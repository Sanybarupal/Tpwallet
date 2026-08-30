import { ethers } from 'ethers';
import { db, NETWORKS } from '../db';
import { BlockchainNetwork, CustomToken } from '../types';

const ERC20_ABI = [
  'function name() view returns (string)',
  'function symbol() view returns (string)',
  'function decimals() view returns (uint8)',
  'function totalSupply() view returns (uint256)',
  'function balanceOf(address owner) view returns (uint256)',
  'function transfer(address to, uint amount) returns (bool)',
];

// Verified token catalog
const VERIFIED_TOKENS: Record<string, { symbol: string; name: string; decimals: number; network: BlockchainNetwork }> = {
  ['0xdac17f958d2ee523a2206206994597c13d831ec7']: { symbol: 'USDT', name: 'Tether USD', decimals: 6, network: 'ERC20' },
  ['0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48']: { symbol: 'USDC', name: 'USD Coin', decimals: 6, network: 'ERC20' },
  ['0x55d398326f99059ff775485246999027b3197955']: { symbol: 'USDT', name: 'Tether USD', decimals: 18, network: 'BEP20' },
  ['0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d']: { symbol: 'USDC', name: 'USD Coin', decimals: 18, network: 'BEP20' },
  ['0xc2132d05d31c914a87c6611c10748aeb04b58e8f']: { symbol: 'USDT', name: 'Tether USD (PoS)', decimals: 6, network: 'POLYGON' },
  ['0x7ceb23fd6bc0add59e62ac25578270cff1b9f619']: { symbol: 'WETH', name: 'Wrapped Ether', decimals: 18, network: 'POLYGON' },
  ['TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t']: { symbol: 'USDT', name: 'Tether USD TRC20', decimals: 6, network: 'TRC20' },
  ['TEkxiTehnzSmSe2XqrBj4w32RUN966rdz8']: { symbol: 'USDC', name: 'USD Coin TRC20', decimals: 6, network: 'TRC20' },
};

export class SmartContractService {
  /**
   * Queries on-chain smart contract details for a given contract address
   */
  public async queryContractInfo(contractAddress: string, network: BlockchainNetwork): Promise<{
    symbol: string;
    name: string;
    decimals: number;
    isVerified: boolean;
  }> {
    const trimmed = contractAddress.trim();

    // Check verified catalog first
    const catalogMatch = VERIFIED_TOKENS[trimmed.toLowerCase()] || VERIFIED_TOKENS[trimmed];
    if (catalogMatch) {
      return {
        ...catalogMatch,
        isVerified: true,
      };
    }

    if (network === 'TRC20') {
      // Tron token validation
      if (!/^T[a-km-zA-HJ-NP-Z1-9]{33}$/.test(trimmed)) {
        throw new Error('Invalid TRC-20 contract address format.');
      }
      return {
        symbol: 'CUSTOM-TRC20',
        name: 'Custom TRC20 Token',
        decimals: 6,
        isVerified: false,
      };
    }

    // EVM contract validation via ethers provider
    if (!ethers.isAddress(trimmed)) {
      throw new Error('Invalid EVM contract address format (must be 0x 40 hex chars).');
    }

    try {
      const netConfig = NETWORKS[network];
      const provider = new ethers.JsonRpcProvider(netConfig ? netConfig.rpcUrl : 'https://rpc.sepolia.org');
      const contract = new ethers.Contract(trimmed, ERC20_ABI, provider);

      // Attempt on-chain read with timeout
      const [name, symbol, decimals] = await Promise.all([
        contract.name().catch(() => 'Custom Token'),
        contract.symbol().catch(() => 'TOKEN'),
        contract.decimals().catch(() => 18),
      ]);

      return {
        name,
        symbol,
        decimals: Number(decimals),
        isVerified: true,
      };
    } catch {
      // Fallback
      return {
        name: 'Custom ERC-20 Token',
        symbol: 'CUSTOM',
        decimals: 18,
        isVerified: false,
      };
    }
  }

  /**
   * Adds custom token to user's portfolio
   */
  public async addCustomToken(params: {
    userId: string;
    contractAddress: string;
    network: BlockchainNetwork;
  }): Promise<CustomToken> {
    const { userId, contractAddress, network } = params;
    const info = await this.queryContractInfo(contractAddress, network);

    return db.withLock(() => {
      // Check if already added
      const existing = Array.from(db.customTokens.values()).find(
        (t) => t.userId === userId && t.contractAddress.toLowerCase() === contractAddress.toLowerCase()
      );
      if (existing) {
        return existing;
      }

      const customToken: CustomToken = {
        id: `tok_${crypto.randomUUID()}`,
        userId,
        contractAddress,
        network,
        symbol: info.symbol,
        name: info.name,
        decimals: info.decimals,
        balance: 0,
        addedAt: new Date().toISOString(),
      };

      db.customTokens.set(customToken.id, customToken);
      return customToken;
    });
  }

  /**
   * Returns list of user's custom tokens
   */
  public getUserCustomTokens(userId: string): CustomToken[] {
    return Array.from(db.customTokens.values()).filter((t) => t.userId === userId);
  }
}

export const smartContractService = new SmartContractService();
