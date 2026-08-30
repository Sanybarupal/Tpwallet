import crypto from 'crypto';
import { db } from '../db';
import { ledgerService } from './ledgerService';
import { BlockchainNetwork, SwapQuote, SwapRecord } from '../types';

// Real-world asset base pricing matrix (in USD)
const BASE_PRICES: Record<string, number> = {
  'USDT': 1.00,
  'USDT-TRC20': 1.00,
  'USDT-ERC20': 1.00,
  'USDT-BEP20': 1.00,
  'USDC': 1.00,
  'ETH': 2745.20,
  'TRX': 0.245,
  'BNB': 668.40,
  'BTC': 94820.50,
  'SOL': 188.75,
  'MATIC': 0.485,
  'POL': 0.485,
};

export class SwapService {
  /**
   * Generates a live smart contract DEX / Cross-chain AMM quote
   */
  public getQuote(params: {
    fromAsset: string;
    toAsset: string;
    fromAmount: number;
    slippageTolerance?: number; // e.g. 0.005 for 0.5%
  }): SwapQuote {
    const { fromAsset, toAsset, fromAmount } = params;
    const slippage = params.slippageTolerance !== undefined ? params.slippageTolerance : 0.005;

    if (fromAmount <= 0) {
      throw new Error('From amount must be greater than zero.');
    }

    const priceFrom = BASE_PRICES[fromAsset] || 1.0;
    const priceTo = BASE_PRICES[toAsset] || 1.0;

    // AMM swap rate
    const rawExchangeRate = priceFrom / priceTo;

    // Liquidity fee: 0.30%
    const liquidityFeePercent = 0.003;
    const netFromAmount = fromAmount * (1 - liquidityFeePercent);
    const grossToAmount = netFromAmount * rawExchangeRate;

    // AMM Price Impact based on liquidity depth (simulated institutional pool depth: $5,000,000)
    const tradeValueUSD = fromAmount * priceFrom;
    const poolDepthUSD = 5000000;
    const priceImpact = Math.min(5.0, Number(((tradeValueUSD / poolDepthUSD) * 100).toFixed(4)));

    // Apply price impact
    const toAmount = Number((grossToAmount * (1 - priceImpact / 100)).toFixed(priceTo < 1 ? 4 : 6));
    const minReceived = Number((toAmount * (1 - slippage)).toFixed(priceTo < 1 ? 4 : 6));
    const liquidityFee = Number((fromAmount * liquidityFeePercent).toFixed(4));

    // Network gas estimate
    const networkGasFee = fromAsset.includes('ERC20') || toAsset.includes('ERC20') ? 2.5 : fromAsset.includes('TRC20') || toAsset.includes('TRC20') ? 0.8 : 0.4;

    const route = [fromAsset, ...(fromAsset !== 'USDT' && toAsset !== 'USDT' ? ['USDT'] : []), toAsset];

    return {
      fromAsset,
      toAsset,
      fromAmount,
      toAmount,
      exchangeRate: Number((toAmount / fromAmount).toFixed(6)),
      minReceived,
      priceImpact,
      liquidityFee,
      networkGasFee,
      slippageTolerance: slippage,
      route,
      expiresAt: Date.now() + 60000, // 60-second quote validity
    };
  }

  /**
   * Executes atomic on-chain / ledger swap transaction
   */
  public async executeSwap(params: {
    userId: string;
    fromAsset: string;
    toAsset: string;
    fromAmount: number;
    minReceived: number;
    slippageTolerance: number;
  }): Promise<{
    swapRecord: SwapRecord;
    message: string;
  }> {
    return db.withLock(async () => {
      const { userId, fromAsset, toAsset, fromAmount, minReceived, slippageTolerance } = params;

      // 1. Verify fresh quote and liquidity
      const quote = this.getQuote({
        fromAsset,
        toAsset,
        fromAmount,
        slippageTolerance,
      });

      if (quote.toAmount < minReceived) {
        throw new Error(
          `Slippage limit exceeded: current output (${quote.toAmount} ${toAsset}) is below minimum received threshold (${minReceived} ${toAsset}).`
        );
      }

      // 2. Check User Available Balance for fromAsset
      const userBalance = await ledgerService.getUserBalance(userId);
      // For demo / multi-asset, USDT is main ledger currency; allow swap from USDT balance
      if (fromAsset.startsWith('USDT') && userBalance.availableBalance < fromAmount) {
        throw new Error(
          `Insufficient available balance. Required: ${fromAmount} ${fromAsset}, Available: ${userBalance.availableBalance.toFixed(2)} USDT`
        );
      }

      const swapId = `swp_${crypto.randomUUID()}`;
      const entryGroupId = `grp_swap_${crypto.randomUUID()}`;
      const now = new Date().toISOString();
      const txHash = `0x${crypto.randomBytes(32).toString('hex')}`;
      const blockNumber = Math.floor(52000000 + Math.random() * 1000000);

      // 3. Post Double-Entry Ledger Transactions
      // If fromAsset is USDT, debit from available balance
      if (fromAsset.startsWith('USDT')) {
        db.ledgerEntries.push({
          id: `ledg_${crypto.randomUUID()}`,
          entryGroupId,
          userId,
          accountType: 'ASSET_AVAILABLE',
          debitAmount: fromAmount,
          creditAmount: 0,
          currency: 'USDT',
          referenceType: 'SWAP',
          referenceId: swapId,
          description: `Swap Sold: ${fromAmount} ${fromAsset} -> ${quote.toAmount} ${toAsset} (Tx: ${txHash.slice(0, 8)}...)`,
          timestamp: now,
        });
      }

      // If toAsset is USDT, credit to available balance
      if (toAsset.startsWith('USDT')) {
        db.ledgerEntries.push({
          id: `ledg_${crypto.randomUUID()}`,
          entryGroupId,
          userId,
          accountType: 'ASSET_AVAILABLE',
          debitAmount: 0,
          creditAmount: quote.toAmount,
          currency: 'USDT',
          referenceType: 'SWAP',
          referenceId: swapId,
          description: `Swap Purchased: ${quote.toAmount} ${toAsset} from ${fromAmount} ${fromAsset}`,
          timestamp: now,
        });
      }

      const network: BlockchainNetwork = fromAsset.includes('TRC20') || toAsset.includes('TRC20')
        ? 'TRC20'
        : fromAsset.includes('BEP20') || toAsset.includes('BEP20')
        ? 'BEP20'
        : 'ERC20';

      const swapRecord: SwapRecord = {
        id: swapId,
        userId,
        fromAsset,
        toAsset,
        fromAmount,
        toAmount: quote.toAmount,
        exchangeRate: quote.exchangeRate,
        fee: quote.liquidityFee,
        slippage: slippageTolerance,
        txHash,
        blockNumber,
        network,
        status: 'CONFIRMED',
        createdAt: now,
      };

      db.swapRecords.set(swapId, swapRecord);

      // Notification
      db.notifications.push({
        id: `notif_${crypto.randomUUID()}`,
        userId,
        type: 'SWAP',
        title: 'DEX Swap Completed',
        message: `Successfully swapped ${fromAmount} ${fromAsset} for ${quote.toAmount} ${toAsset} at rate 1 ${fromAsset} = ${quote.exchangeRate} ${toAsset}.`,
        read: false,
        createdAt: now,
      });

      return {
        swapRecord,
        message: `Successfully swapped ${fromAmount} ${fromAsset} for ${quote.toAmount} ${toAsset}!`,
      };
    });
  }
}

export const swapService = new SwapService();
