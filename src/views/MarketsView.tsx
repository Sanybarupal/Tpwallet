import React, { useState, useEffect, useCallback } from 'react';
import { 
  TrendingUp, ArrowLeftRight, RefreshCw, 
  Search, Zap, Check, 
  ArrowDownUp, AlertCircle, ExternalLink
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import { SwapQuote } from '../types';
import { CryptoIcon } from '../components/CryptoIcons';

interface MarketPair {
  symbol: string;
  name: string;
  pair: string;
  price: number;
  change24h: number;
  high24h: number;
  low24h: number;
  volume24h: string;
  sparkline: number[];
  baseAsset: string;
  networkTag: string;
}

const INITIAL_PAIRS: MarketPair[] = [
  {
    symbol: 'BTC',
    name: 'Bitcoin',
    pair: 'BTC / USDT',
    price: 94820.50,
    change24h: 2.84,
    high24h: 96100.00,
    low24h: 92450.00,
    volume24h: '4.82B',
    sparkline: [92, 93, 92.5, 94, 93.8, 95.2, 94.8],
    baseAsset: 'BTC',
    networkTag: 'Mainnet',
  },
  {
    symbol: 'ETH',
    name: 'Ethereum',
    pair: 'ETH / USDT',
    price: 2745.20,
    change24h: -1.15,
    high24h: 2810.00,
    low24h: 2710.00,
    volume24h: '2.14B',
    sparkline: [28, 27.8, 28.2, 27.5, 27.3, 27.6, 27.45],
    baseAsset: 'ETH',
    networkTag: 'ERC-20',
  },
  {
    symbol: 'TRX',
    name: 'TRON Gas Token',
    pair: 'TRX / USDT',
    price: 0.245,
    change24h: 4.62,
    high24h: 0.252,
    low24h: 0.231,
    volume24h: '680M',
    sparkline: [0.23, 0.235, 0.238, 0.242, 0.24, 0.246, 0.245],
    baseAsset: 'TRX',
    networkTag: 'TRC-20 Gas',
  },
  {
    symbol: 'BNB',
    name: 'BNB Chain',
    pair: 'BNB / USDT',
    price: 668.40,
    change24h: 1.45,
    high24h: 678.00,
    low24h: 654.00,
    volume24h: '940M',
    sparkline: [65.4, 66.0, 65.8, 66.5, 67.0, 66.4, 66.8],
    baseAsset: 'BNB',
    networkTag: 'BEP-20',
  },
  {
    symbol: 'SOL',
    name: 'Solana',
    pair: 'SOL / USDT',
    price: 188.75,
    change24h: 6.20,
    high24h: 194.50,
    low24h: 176.80,
    volume24h: '3.42B',
    sparkline: [17.6, 18.0, 18.2, 18.5, 19.1, 18.7, 18.8],
    baseAsset: 'SOL',
    networkTag: 'SPL',
  },
  {
    symbol: 'MATIC',
    name: 'Polygon (POL)',
    pair: 'POL / USDT',
    price: 0.485,
    change24h: 3.12,
    high24h: 0.51,
    low24h: 0.46,
    volume24h: '420M',
    sparkline: [0.46, 0.47, 0.48, 0.475, 0.49, 0.485, 0.485],
    baseAsset: 'POL',
    networkTag: 'Polygon',
  },
];

export const MarketsView: React.FC = () => {
  const { balance, triggerHaptic, refreshBalance, binanceAccount } = useAuth();

  const [activeTab, setActiveTab] = useState<'SPOT' | 'SWAP' | 'DEPTH'>('SPOT');
  const [searchQuery, setSearchQuery] = useState('');
  const [pairs, setPairs] = useState<MarketPair[]>(INITIAL_PAIRS);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedDepthPair, setSelectedDepthPair] = useState('BTCUSDT');
  const [orderbookDepth, setOrderbookDepth] = useState<{ bids: [string, string][]; asks: [string, string][] } | null>(null);

  // Swap DEX State
  const [swapFrom, setSwapFrom] = useState<string>('USDT-TRC20');
  const [swapTo, setSwapTo] = useState<string>('ETH');
  const [fromAmount, setFromAmount] = useState('100.00');
  const [slippage, setSlippage] = useState<number>(0.005); // 0.5%
  const [quote, setQuote] = useState<SwapQuote | null>(null);
  const [isQuoting, setIsQuoting] = useState(false);
  const [isSwapping, setIsSwapping] = useState(false);
  const [swapSuccess, setSwapSuccess] = useState<{ message: string; txHash: string } | null>(null);
  const [swapError, setSwapError] = useState<string | null>(null);

  const totalBal = balance?.availableBalance || 0;

  // Real-time Binance API feed fetcher
  const loadBinanceTickers = useCallback(async () => {
    try {
      const res = await api.getBinanceTickers();
      if (res.tickers && res.tickers.length > 0) {
        setPairs((prev) =>
          prev.map((p) => {
            const symbolKey = `${p.symbol}USDT`;
            const ticker = res.tickers.find((t: any) => t.symbol === symbolKey);
            if (ticker) {
              const last = parseFloat(ticker.lastPrice);
              const change = parseFloat(ticker.priceChangePercent);
              const high = parseFloat(ticker.highPrice || '0');
              const low = parseFloat(ticker.lowPrice || '0');
              return {
                ...p,
                price: isNaN(last) ? p.price : last,
                change24h: isNaN(change) ? p.change24h : +change.toFixed(2),
                high24h: high || p.high24h,
                low24h: low || p.low24h,
                volume24h: ticker.volume ? `${(parseFloat(ticker.volume) / 1000).toFixed(1)}k` : p.volume24h,
              };
            }
            return p;
          })
        );
      }
    } catch {
      // ignore
    }
  }, []);

  const loadOrderbookDepth = useCallback(async (sym: string) => {
    try {
      const res = await api.getBinanceDepth(sym, 7);
      if (res.depth) {
        setOrderbookDepth(res.depth);
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    loadBinanceTickers();
    const interval = setInterval(loadBinanceTickers, 5000);
    return () => clearInterval(interval);
  }, [loadBinanceTickers]);

  useEffect(() => {
    if (activeTab === 'DEPTH') {
      loadOrderbookDepth(selectedDepthPair);
      const interval = setInterval(() => loadOrderbookDepth(selectedDepthPair), 3000);
      return () => clearInterval(interval);
    }
  }, [activeTab, selectedDepthPair, loadOrderbookDepth]);

  const fetchQuote = useCallback(async () => {
    const amt = parseFloat(fromAmount);
    if (isNaN(amt) || amt <= 0 || swapFrom === swapTo) {
      setQuote(null);
      return;
    }
    try {
      setIsQuoting(true);
      const res = await api.getSwapQuote({
        fromAsset: swapFrom,
        toAsset: swapTo,
        fromAmount: amt,
        slippageTolerance: slippage,
      });
      setQuote(res.quote);
    } catch {
      // Ignored
    } finally {
      setIsQuoting(false);
    }
  }, [fromAmount, swapFrom, swapTo, slippage]);

  useEffect(() => {
    if (activeTab === 'SWAP') {
      const timer = setTimeout(fetchQuote, 250);
      return () => clearTimeout(timer);
    }
  }, [activeTab, fetchQuote]);

  const handleRefresh = async () => {
    triggerHaptic();
    setIsRefreshing(true);
    await loadBinanceTickers();
    setTimeout(() => {
      setIsRefreshing(false);
    }, 600);
  };


  const handleSwapTokens = () => {
    triggerHaptic();
    const temp = swapFrom;
    setSwapFrom(swapTo);
    setSwapTo(temp);
  };

  const handleExecuteSwap = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quote) return;
    triggerHaptic();
    setIsSwapping(true);
    setSwapSuccess(null);
    setSwapError(null);

    try {
      const res = await api.executeSwap({
        fromAsset: quote.fromAsset,
        toAsset: quote.toAsset,
        fromAmount: quote.fromAmount,
        minReceived: quote.minReceived,
        slippageTolerance: quote.slippageTolerance,
      });
      setSwapSuccess({
        message: res.message,
        txHash: res.swapRecord.txHash,
      });
      await refreshBalance();
    } catch (err: unknown) {
      setSwapError(err instanceof Error ? err.message : 'Swap transaction failed');
    } finally {
      setIsSwapping(false);
    }
  };

  const filteredPairs = pairs.filter((p) =>
    p.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-4 pb-20 select-none">
      {/* Top Segment Controller: Spot Markets vs Flash Swap vs Binance Depth */}
      <div className="bg-[#f7f8fa] dark:bg-[#121620] p-1.5 rounded-2xl border border-[#e5e7eb] dark:border-[#1e2433] shadow-xs transition-all">
        <div className="grid grid-cols-3 gap-1">
          <button
            type="button"
            onClick={() => {
              triggerHaptic();
              setActiveTab('SPOT');
            }}
            className={`py-2.5 px-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer relative ${
              activeTab === 'SPOT'
                ? 'bg-[#2980fe] text-white shadow-md shadow-blue-500/25 scale-[1.01]'
                : 'bg-transparent text-[#6b7280] dark:text-[#94a3b8] hover:text-[#1e2024] dark:hover:text-white hover:bg-white/60 dark:hover:bg-[#182030]/60'
            }`}
          >
            <TrendingUp className={`h-4 w-4 shrink-0 ${activeTab === 'SPOT' ? 'text-white' : 'text-[#03b875]'}`} />
            <span className="truncate">Spot (行情)</span>
          </button>

          <button
            type="button"
            onClick={() => {
              triggerHaptic();
              setActiveTab('SWAP');
            }}
            className={`py-2.5 px-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer relative ${
              activeTab === 'SWAP'
                ? 'bg-[#2980fe] text-white shadow-md shadow-blue-500/25 scale-[1.01]'
                : 'bg-transparent text-[#6b7280] dark:text-[#94a3b8] hover:text-[#1e2024] dark:hover:text-white hover:bg-white/60 dark:hover:bg-[#182030]/60'
            }`}
          >
            <ArrowLeftRight className={`h-4 w-4 shrink-0 ${activeTab === 'SWAP' ? 'text-white' : 'text-[#2980fe]'}`} />
            <span className="truncate">Swap (闪兑)</span>
          </button>

          <button
            type="button"
            onClick={() => {
              triggerHaptic();
              setActiveTab('DEPTH');
            }}
            className={`py-2.5 px-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer relative ${
              activeTab === 'DEPTH'
                ? 'bg-[#2980fe] text-white shadow-md shadow-blue-500/25 scale-[1.01]'
                : 'bg-transparent text-[#6b7280] dark:text-[#94a3b8] hover:text-[#1e2024] dark:hover:text-white hover:bg-white/60 dark:hover:bg-[#182030]/60'
            }`}
          >
            <Zap className={`h-4 w-4 shrink-0 ${activeTab === 'DEPTH' ? 'text-white' : 'text-amber-500'}`} />
            <span className="truncate">Order Depth</span>
          </button>
        </div>
      </div>

      {/* VIEW 1: SPOT MARKETS */}
      {activeTab === 'SPOT' && (
        <div className="space-y-3">
          {/* Search & Refresh Bar */}
          <div className="flex items-center space-x-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-[#9ca3af]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search USDT pairs (BTC, ETH, TRX, SOL, BNB)..."
                className="w-full bg-white dark:bg-[#121620] border border-[#e5e7eb] dark:border-[#1e2433] rounded-2xl pl-9 pr-3 py-2 text-xs text-[#1e2024] dark:text-white placeholder-[#9ca3af] focus:border-[#2980fe] focus:outline-none shadow-xs"
              />
            </div>
            <button
              type="button"
              onClick={handleRefresh}
              className="p-2.5 rounded-2xl bg-white dark:bg-[#121620] border border-[#e5e7eb] dark:border-[#1e2433] text-[#6b7280] dark:text-[#94a3b8] hover:text-[#1e2024] dark:hover:text-white shadow-xs cursor-pointer"
              title="Refresh Quotes"
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin text-[#2980fe]' : ''}`} />
            </button>
          </div>

          {/* Market Ticker Pairs List */}
          <div className="bg-white dark:bg-[#121620] rounded-3xl border border-[#e5e7eb] dark:border-[#1e2433] divide-y divide-[#f5f6f8] dark:divide-[#1a202c] overflow-hidden shadow-xs">
            {filteredPairs.map((pair) => {
              const isPositive = pair.change24h >= 0;
              return (
                <div
                  key={pair.symbol}
                  onClick={() => {
                    triggerHaptic();
                    setSelectedDepthPair(`${pair.symbol}USDT`);
                    setActiveTab('DEPTH');
                  }}
                  className="p-3.5 flex items-center justify-between hover:bg-[#f7f8fa] dark:hover:bg-[#181f2e] transition-colors cursor-pointer"
                >
                  {/* Left: Asset info */}
                  <div className="flex items-center space-x-3">
                    <CryptoIcon symbol={pair.symbol} size={40} />
                    <div>
                      <div className="flex items-center space-x-1.5">
                        <span className="font-bold text-xs text-[#1e2024] dark:text-white">{pair.symbol}</span>
                        <span className="text-[10px] text-[#8a93a6] font-mono">/ USDT</span>
                      </div>
                      <div className="flex items-center space-x-1.5 text-[10px] text-[#8a93a6] font-mono mt-0.5">
                        <span>Vol: {pair.volume24h}</span>
                        <span>•</span>
                        <span className="text-[#8a93a6]">{pair.networkTag}</span>
                      </div>
                    </div>
                  </div>

                  {/* Middle: Mini SVG Trend Sparkline */}
                  <div className="hidden sm:block w-16 h-7">
                    <svg viewBox="0 0 70 28" className="w-full h-full overflow-visible">
                      <path
                        d={`M 0 ${28 - pair.sparkline[0] * 0.25} Q 15 ${28 - pair.sparkline[1] * 0.25} 35 ${28 - pair.sparkline[3] * 0.25} T 70 ${28 - pair.sparkline[6] * 0.25}`}
                        fill="none"
                        stroke={isPositive ? '#03b875' : '#f5465c'}
                        strokeWidth="2"
                        strokeLinecap="round"
                      />
                    </svg>
                  </div>

                  {/* Right: Price & 24h Badge */}
                  <div className="text-right font-mono">
                    <span className="text-xs font-black text-[#1e2024] dark:text-white block">
                      ${pair.price.toLocaleString('en-US', { minimumFractionDigits: pair.price < 1 ? 4 : 2 })}
                    </span>
                    <span
                      className={`inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-lg mt-0.5 ${
                        isPositive
                          ? 'bg-[#03b875]/10 text-[#03b875] border border-[#03b875]/20'
                          : 'bg-[#f5465c]/10 text-[#f5465c] border border-[#f5465c]/20'
                      }`}
                    >
                      {isPositive ? '+' : ''}{pair.change24h}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Quick Info Box */}
          <div className="bg-[#f0f7ff] dark:bg-[#122038] rounded-2xl border border-[#dbeafe] dark:border-[#1e3a8a]/40 p-3.5 flex items-center justify-between text-xs text-[#1e40af] dark:text-[#93c5fd]">
            <div className="flex items-center space-x-2">
              <Zap className="h-4 w-4 text-[#2980fe]" />
              <span>Real-Time Binance Spot & AMM Market Ticker Rates</span>
            </div>
            <span className="text-[10px] text-[#03b875] font-mono font-bold">CONNECTED</span>
          </div>
        </div>
      )}

      {/* VIEW 2: BINANCE REAL-TIME ORDERBOOK DEPTH */}
      {activeTab === 'DEPTH' && (
        <div className="space-y-3">
          <div className="bg-white dark:bg-[#121620] rounded-3xl border border-[#e5e7eb] dark:border-[#1e2433] p-4 space-y-4 shadow-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="text-xs font-bold text-[#1e2024] dark:text-white">Binance Live Orderbook</span>
                <span className="text-[10px] px-2 py-0.5 rounded-md bg-[#2980fe]/10 text-[#2980fe] font-mono font-bold">
                  {selectedDepthPair}
                </span>
              </div>
              <div className="flex gap-1">
                {['BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'SOLUSDT', 'TRXUSDT'].map((sym) => (
                  <button
                    key={sym}
                    type="button"
                    onClick={() => {
                      triggerHaptic();
                      setSelectedDepthPair(sym);
                    }}
                    className={`px-2 py-1 rounded-lg text-[10px] font-mono font-bold transition-all cursor-pointer ${
                      selectedDepthPair === sym
                        ? 'bg-[#2980fe] text-white'
                        : 'bg-[#f7f8fa] dark:bg-[#181f2e] text-[#6b7280] dark:text-[#94a3b8] border border-[#e5e7eb] dark:border-[#2a3447]'
                    }`}
                  >
                    {sym.replace('USDT', '')}
                  </button>
                ))}
              </div>
            </div>

            {/* Depth Table Header */}
            <div className="grid grid-cols-2 gap-4 text-[10px] font-mono font-bold uppercase tracking-wider text-[#8a93a6] border-b border-[#f0f2f5] dark:border-[#1e2433] pb-2">
              <div className="flex justify-between">
                <span>Bid Price (USDT)</span>
                <span>Amount</span>
              </div>
              <div className="flex justify-between">
                <span>Ask Price (USDT)</span>
                <span>Amount</span>
              </div>
            </div>

            {/* Depth Rows */}
            <div className="grid grid-cols-2 gap-4 text-xs font-mono">
              {/* Bids (Green) */}
              <div className="space-y-1.5">
                {(orderbookDepth?.bids || [
                  ['94810.00', '1.45'],
                  ['94805.50', '0.88'],
                  ['94800.00', '2.50'],
                  ['94795.00', '0.42'],
                  ['94790.00', '3.10'],
                ]).map(([p, a], idx) => (
                  <div key={idx} className="flex justify-between text-[#03b875] py-0.5">
                    <span className="font-bold">{parseFloat(p).toFixed(2)}</span>
                    <span className="text-[#6b7280] dark:text-[#94a3b8]">{parseFloat(a).toFixed(3)}</span>
                  </div>
                ))}
              </div>

              {/* Asks (Red) */}
              <div className="space-y-1.5">
                {(orderbookDepth?.asks || [
                  ['94825.00', '0.95'],
                  ['94830.00', '1.80'],
                  ['94835.50', '0.35'],
                  ['94840.00', '2.15'],
                  ['94850.00', '4.60'],
                ]).map(([p, a], idx) => (
                  <div key={idx} className="flex justify-between text-[#f5465c] py-0.5">
                    <span className="font-bold">{parseFloat(p).toFixed(2)}</span>
                    <span className="text-[#6b7280] dark:text-[#94a3b8]">{parseFloat(a).toFixed(3)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 3: FLASH SWAP / CROSS-CHAIN DEX BRIDGE */}
      {activeTab === 'SWAP' && (
        <form onSubmit={handleExecuteSwap} className="space-y-4">
          {swapSuccess && (
            <div className="rounded-2xl bg-[#f0fdf4] dark:bg-[#062c19] border border-[#bbf7d0] dark:border-[#0f5132] p-3 text-xs text-[#15803d] dark:text-[#4ade80] space-y-1">
              <div className="flex items-center gap-2 font-bold">
                <Check className="h-4 w-4 text-[#03b875] shrink-0" />
                <span>{swapSuccess.message}</span>
              </div>
              <p className="font-mono text-[10px] text-[#6b7280] dark:text-[#94a3b8] break-all pl-6">
                Tx Hash: {swapSuccess.txHash}
              </p>
            </div>
          )}

          {swapError && (
            <div className="rounded-2xl bg-[#fff1f2] dark:bg-[#301015] border border-[#fecdd3] dark:border-[#5c1c24] p-3 text-xs text-[#be123c] dark:text-[#f87171] flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-[#f5465c] shrink-0" />
              <span>{swapError}</span>
            </div>
          )}

          {/* From Container */}
          <div className="bg-white dark:bg-[#121620] rounded-3xl border border-[#e5e7eb] dark:border-[#1e2433] p-4 space-y-2.5 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#6b7280] dark:text-[#94a3b8]">Pay / Swap From</span>
              <span className="text-[10px] text-[#6b7280] dark:text-[#94a3b8] font-mono">
                Avail: <strong className="text-[#1e2024] dark:text-white">{totalBal.toFixed(2)} USDT</strong>
              </span>
            </div>

            <div className="flex items-center justify-between bg-[#f7f8fa] dark:bg-[#181f2e] p-3 rounded-2xl border border-[#e5e7eb] dark:border-[#2a3447]">
              <input
                type="number"
                step="0.01"
                min="0.1"
                value={fromAmount}
                onChange={(e) => setFromAmount(e.target.value)}
                placeholder="0.00"
                className="w-1/2 bg-transparent text-lg font-mono font-black text-[#1e2024] dark:text-white focus:outline-none"
                required
              />

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setFromAmount(totalBal.toString())}
                  className="text-[10px] font-bold text-[#2980fe] bg-[#2980fe]/10 px-2 py-1 rounded-lg border border-[#2980fe]/20 cursor-pointer"
                >
                  MAX
                </button>
                <select
                  value={swapFrom}
                  onChange={(e) => setSwapFrom(e.target.value)}
                  className="bg-white dark:bg-[#121620] border border-[#e5e7eb] dark:border-[#2a3447] rounded-xl px-2.5 py-1.5 text-xs font-bold text-[#1e2024] dark:text-white focus:outline-none cursor-pointer"
                >
                  <option value="USDT-TRC20">USDT (TRC20)</option>
                  <option value="USDT-ERC20">USDT (ERC20)</option>
                  <option value="USDT-BEP20">USDT (BEP20)</option>
                  <option value="TRX">TRX (TRON)</option>
                  <option value="ETH">ETH (Ethereum)</option>
                  <option value="BNB">BNB (BSC)</option>
                  <option value="SOL">SOL (Solana)</option>
                  <option value="MATIC">POL (Polygon)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Switcher Button */}
          <div className="flex justify-center -my-2 relative z-10">
            <button
              type="button"
              onClick={handleSwapTokens}
              className="p-2.5 rounded-2xl bg-[#2980fe] hover:bg-[#1e58e6] text-white shadow-md shadow-blue-500/20 transition-transform active:scale-90 cursor-pointer"
            >
              <ArrowDownUp className="h-4 w-4" />
            </button>
          </div>

          {/* To Container */}
          <div className="bg-white dark:bg-[#121620] rounded-3xl border border-[#e5e7eb] dark:border-[#1e2433] p-4 space-y-2.5 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#6b7280] dark:text-[#94a3b8]">Receive / Swap To</span>
              <span className="text-[10px] text-[#03b875] font-mono font-bold">
                {isQuoting ? 'Calculating quote...' : 'Estimated Output'}
              </span>
            </div>

            <div className="flex items-center justify-between bg-[#f7f8fa] dark:bg-[#181f2e] p-3 rounded-2xl border border-[#e5e7eb] dark:border-[#2a3447]">
              <div className="font-mono text-lg font-black text-[#03b875]">
                {quote ? quote.toAmount : '0.00'}
              </div>

              <select
                value={swapTo}
                onChange={(e) => setSwapTo(e.target.value)}
                className="bg-white dark:bg-[#121620] border border-[#e5e7eb] dark:border-[#2a3447] rounded-xl px-2.5 py-1.5 text-xs font-bold text-[#1e2024] dark:text-white focus:outline-none cursor-pointer"
              >
                <option value="ETH">ETH (Ethereum)</option>
                <option value="USDT-TRC20">USDT (TRC20)</option>
                <option value="USDT-ERC20">USDT (ERC20)</option>
                <option value="USDT-BEP20">USDT (BEP20)</option>
                <option value="TRX">TRX (TRON)</option>
                <option value="BNB">BNB (BSC)</option>
                <option value="SOL">SOL (Solana)</option>
                <option value="MATIC">POL (Polygon)</option>
              </select>
            </div>
          </div>

          {/* Slippage & AMM Routing Parameters */}
          <div className="bg-white dark:bg-[#121620] rounded-2xl border border-[#e5e7eb] dark:border-[#1e2433] p-3.5 space-y-2 text-xs shadow-xs">
            <div className="flex justify-between items-center text-[#6b7280] dark:text-[#94a3b8]">
              <span>Slippage Tolerance</span>
              <div className="flex gap-1">
                {[
                  { label: '0.1%', val: 0.001 },
                  { label: '0.5%', val: 0.005 },
                  { label: '1.0%', val: 0.01 },
                ].map((s) => (
                  <button
                    key={s.label}
                    type="button"
                    onClick={() => {
                      triggerHaptic();
                      setSlippage(s.val);
                    }}
                    className={`px-2 py-0.5 rounded-lg text-[10px] font-bold cursor-pointer ${
                      slippage === s.val
                        ? 'bg-[#2980fe] text-white'
                        : 'bg-[#f7f8fa] dark:bg-[#181f2e] text-[#6b7280] dark:text-[#94a3b8] border border-[#e5e7eb] dark:border-[#2a3447]'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {quote && (
              <>
                <div className="flex justify-between items-center text-[#6b7280] dark:text-[#94a3b8] text-[11px]">
                  <span>Exchange Rate</span>
                  <span className="font-mono text-[#1e2024] dark:text-white">
                    1 {swapFrom} = {quote.exchangeRate} {swapTo}
                  </span>
                </div>

                <div className="flex justify-between items-center text-[#6b7280] dark:text-[#94a3b8] text-[11px]">
                  <span>Guaranteed Min Received</span>
                  <span className="font-mono text-[#1e2024] dark:text-white font-bold">
                    {quote.minReceived} {swapTo}
                  </span>
                </div>

                <div className="flex justify-between items-center text-[#6b7280] dark:text-[#94a3b8] text-[11px]">
                  <span>Price Impact / Depth</span>
                  <span className={`font-mono font-bold ${quote.priceImpact > 1.0 ? 'text-[#f59e0b]' : 'text-[#03b875]'}`}>
                    {quote.priceImpact}%
                  </span>
                </div>

                <div className="flex justify-between items-center text-[#6b7280] dark:text-[#94a3b8] text-[11px]">
                  <span>AMM Liquidity Fee (0.3%)</span>
                  <span className="font-mono text-[#6b7280] dark:text-[#94a3b8]">
                    {quote.liquidityFee} {swapFrom}
                  </span>
                </div>
              </>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSwapping || !quote || parseFloat(fromAmount) <= 0}
            className="w-full py-3.5 rounded-2xl bg-[#2980fe] hover:bg-[#1e58e6] disabled:opacity-50 text-white font-bold text-xs shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-[0.99]"
          >
            {isSwapping ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                <span>Broadcasting On-Chain Swap...</span>
              </>
            ) : (
              <>
                <Zap className="h-4 w-4" />
                <span>Execute Real AMM Flash Swap</span>
              </>
            )}
          </button>
        </form>
      )}
    </div>
  );

};
