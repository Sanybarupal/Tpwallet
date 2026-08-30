import React, { useState, useEffect } from 'react';
import { 
  Compass, Search, ShieldCheck, Zap, AlertTriangle, 
  ExternalLink, Layers, Fuel, Key, Check, Copy, 
  RefreshCw, ArrowRight, ShieldAlert, Cpu, Lock, 
  Users, Send, FileCode, CheckCircle2, Star, Globe,
  TrendingUp, Newspaper, Bookmark, BookmarkCheck,
  Share2, ArrowUpRight
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { BlockchainNetwork } from '../types';

interface DAppItem {
  id: string;
  name: string;
  category: 'DEFI' | 'DEX' | 'TRON' | 'STAKING' | 'TOOLS' | 'NFT';
  desc: string;
  url: string;
  chains: string[];
  tvl?: string;
  users?: string;
  iconText: string;
  iconBg: string;
  isHot?: boolean;
}

interface NewsItem {
  id: string;
  title: string;
  source: string;
  time: string;
  category: string;
  summary: string;
  link: string;
}

const DAPPS_DATA: DAppItem[] = [
  {
    id: 'sunswap',
    name: 'SunSwap V2 & SunPump',
    category: 'TRON',
    desc: 'Leading TRON decentralized trading protocol and token launchpad',
    url: 'https://sunswap.com',
    chains: ['TRON', 'TRC-20'],
    tvl: '$890M',
    users: '142K',
    iconText: 'SUN',
    iconBg: 'bg-red-500 text-white',
    isHot: true,
  },
  {
    id: 'justlend',
    name: 'JustLend DAO',
    category: 'TRON',
    desc: 'TRON ecosystem official decentralized lending and USDT staking market',
    url: 'https://justlend.org',
    chains: ['TRON', 'TRC-20'],
    tvl: '$6.2B',
    users: '89K',
    iconText: 'JST',
    iconBg: 'bg-orange-500 text-white',
    isHot: true,
  },
  {
    id: 'uniswap',
    name: 'Uniswap V3',
    category: 'DEX',
    desc: 'World largest automated liquidity protocol across Ethereum and L2s',
    url: 'https://app.uniswap.org',
    chains: ['Ethereum', 'Polygon', 'Arbitrum'],
    tvl: '$5.8B',
    users: '320K',
    iconText: 'UNI',
    iconBg: 'bg-pink-500 text-white',
    isHot: true,
  },
  {
    id: 'pancakeswap',
    name: 'PancakeSwap',
    category: 'DEX',
    desc: 'Premier DEX and yield farming on BNB Smart Chain and Ethereum',
    url: 'https://pancakeswap.finance',
    chains: ['BNB Chain', 'Ethereum', 'Aptos'],
    tvl: '$2.1B',
    users: '240K',
    iconText: 'CAKE',
    iconBg: 'bg-amber-500 text-white',
  },
  {
    id: 'aave',
    name: 'Aave V3 Protocol',
    category: 'DEFI',
    desc: 'Non-custodial liquidity protocol for earning interest and borrowing assets',
    url: 'https://app.aave.com',
    chains: ['Ethereum', 'Avalanche', 'Polygon'],
    tvl: '$12.4B',
    users: '110K',
    iconText: 'AAVE',
    iconBg: 'bg-purple-600 text-white',
    isHot: true,
  },
  {
    id: '1inch',
    name: '1inch Network',
    category: 'DEX',
    desc: 'Leading multi-chain DEX aggregator for optimal swap routing',
    url: 'https://app.1inch.io',
    chains: ['Multi-Chain', 'ERC-20', 'BEP-20'],
    tvl: '$1.4B',
    users: '95K',
    iconText: '1INCH',
    iconBg: 'bg-indigo-600 text-white',
  },
  {
    id: 'tronscan',
    name: 'TRONSCAN Explorer',
    category: 'TOOLS',
    desc: 'Official TRON blockchain explorer for tracking TRC-20 USDT tx and energy',
    url: 'https://tronscan.org',
    chains: ['TRON Mainnet'],
    users: '2.4M',
    iconText: 'TS',
    iconBg: 'bg-red-600 text-white',
  },
  {
    id: 'etherscan',
    name: 'Etherscan',
    category: 'TOOLS',
    desc: 'Leading blockchain analytics and contract search for Ethereum',
    url: 'https://etherscan.io',
    chains: ['Ethereum'],
    users: '4.8M',
    iconText: 'ETH',
    iconBg: 'bg-blue-600 text-white',
  },
  {
    id: 'dexscreener',
    name: 'DexScreener Live Charts',
    category: 'TOOLS',
    desc: 'Real-time DEX charts, pair analytics, and liquidity inspection',
    url: 'https://dexscreener.com',
    chains: ['Multi-Chain'],
    users: '1.2M',
    iconText: 'DEX',
    iconBg: 'bg-teal-600 text-white',
  },
  {
    id: 'opensea',
    name: 'OpenSea Marketplace',
    category: 'NFT',
    desc: 'The world first and largest digital marketplace for crypto collectibles',
    url: 'https://opensea.io',
    chains: ['Ethereum', 'Polygon', 'Base'],
    tvl: '$450M',
    users: '180K',
    iconText: 'SEA',
    iconBg: 'bg-blue-500 text-white',
  }
];

const INITIAL_NEWS: NewsItem[] = [
  {
    id: 'n1',
    title: 'Tether (USDT) TRON Daily Transfer Volume Surpasses $18.4 Billion',
    source: 'CoinDesk',
    time: '12m ago',
    category: 'STABLECOIN',
    summary: 'TRC-20 USDT continues to maintain over 60% of total circulating USDT supply due to sub-dollar network transfer fees and 3-second block confirmation times.',
    link: 'https://coindesk.com',
  },
  {
    id: 'n2',
    title: 'DeFi Total Value Locked (TVL) Crosses $95B as Institutional Yield Vaults Surge',
    source: 'CoinTelegraph',
    time: '45m ago',
    category: 'DEFI',
    summary: 'Automated lending and staking protocols record record-breaking collateral inflows across TRON, Ethereum, and Arbitrum ecosystems.',
    link: 'https://cointelegraph.com',
  },
  {
    id: 'n3',
    title: 'Binance and Major Exchanges Upgrade MPC Enclave Key Security Protocols',
    source: 'Decrypt',
    time: '2h ago',
    category: 'SECURITY',
    summary: 'Multi-party computation and biometric hardware key isolation become industry standard for safeguarding multi-chain treasury assets.',
    link: 'https://decrypt.co',
  },
  {
    id: 'n4',
    title: 'Ethereum Gwei Drops to 6-Month Low Amid Layer-2 Blob Scaling Optimizations',
    source: 'The Block',
    time: '3h ago',
    category: 'NETWORK',
    summary: 'Gas fees on Ethereum L1 stabilize under 15 Gwei, significantly lowering ERC-20 token transfer and approval costs.',
    link: 'https://theblock.co',
  },
];

export const DiscoverView: React.FC = () => {
  const { triggerHaptic } = useAuth();

  const [activeTab, setActiveTab] = useState<'DAPPS' | 'NEWS' | 'TOOLS'>('DAPPS');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchUrl, setSearchUrl] = useState('');
  const [activeToolModal, setActiveToolModal] = useState<string | null>(null);

  // Bookmarks
  const [bookmarkedIds, setBookmarkedIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('tp_bookmarked_dapps');
      return saved ? JSON.parse(saved) : ['sunswap', 'justlend', 'uniswap'];
    } catch {
      return ['sunswap', 'justlend', 'uniswap'];
    }
  });

  // DApp Preview Modal
  const [selectedDApp, setSelectedDApp] = useState<DAppItem | null>(null);

  // Live News State
  const [newsList, setNewsList] = useState<NewsItem[]>(INITIAL_NEWS);
  const [isRefreshingNews, setIsRefreshingNews] = useState(false);
  const [selectedNews, setSelectedNews] = useState<NewsItem | null>(null);

  // Address Risk Scanner State
  const [scanAddress, setScanAddress] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<{
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
    score: number;
    tags: string[];
    isBlacklisted: boolean;
  } | null>(null);

  // Token Approval Manager State
  const [approvals, setApprovals] = useState([
    { id: '1', protocol: 'SunSwap V2 (TRON)', spender: 'TKW...90f', allowance: 'Unlimited USDT', risk: 'HIGH' },
    { id: '2', protocol: 'Uniswap V3 (Ethereum)', spender: '0x68b...32d', allowance: 'Unlimited USDT', risk: 'MEDIUM' },
    { id: '3', protocol: 'PancakeSwap Router (BSC)', spender: '0x10E...7a1', allowance: '50,000 USDT', risk: 'LOW' },
  ]);
  const [revokingId, setRevokingId] = useState<string | null>(null);

  // Batch Transfer Helper State
  const [batchAddresses, setBatchAddresses] = useState('');
  const [batchAmount, setBatchAmount] = useState('10.0');
  const [isProcessingBatch, setIsProcessingBatch] = useState(false);
  const [batchSuccessMsg, setBatchSuccessMsg] = useState<string | null>(null);

  const toggleBookmark = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    triggerHaptic();
    setBookmarkedIds((prev) => {
      const updated = prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id];
      try {
        localStorage.setItem('tp_bookmarked_dapps', JSON.stringify(updated));
      } catch {
        // Ignored
      }
      return updated;
    });
  };

  const handleRefreshNews = () => {
    triggerHaptic();
    setIsRefreshingNews(true);
    setTimeout(() => {
      setIsRefreshingNews(false);
      setNewsList((prev) => [
        {
          id: `n-${Date.now()}`,
          title: 'Live On-Chain Settlement: Over $2.4M USDT Cleared in the Last 60 Seconds',
          source: 'CryptoGlobe Live',
          time: 'Just now',
          category: 'MARKET',
          summary: 'Double-entry cryptographic ledger verifies instant zero-slippage clearance across global liquidity routes.',
          link: 'https://cryptoglobe.com',
        },
        ...prev.slice(0, 4),
      ]);
    }, 800);
  };

  const handleScanAddress = (e: React.FormEvent) => {
    e.preventDefault();
    if (!scanAddress) return;
    triggerHaptic();
    setIsScanning(true);
    setScanResult(null);

    setTimeout(() => {
      setIsScanning(false);
      const isTron = scanAddress.startsWith('T') && scanAddress.length === 34;
      const isEvm = scanAddress.startsWith('0x') && scanAddress.length === 42;

      if (!isTron && !isEvm) {
        setScanResult({
          riskLevel: 'HIGH',
          score: 92,
          tags: ['Invalid Address Checksum', 'Potential Malformed Payload', 'Unverified Format'],
          isBlacklisted: true,
        });
      } else if (scanAddress.toLowerCase().includes('dead') || scanAddress.toLowerCase().includes('bad') || scanAddress.toLowerCase().includes('scam')) {
        setScanResult({
          riskLevel: 'HIGH',
          score: 88,
          tags: ['Flagged Phishing Target', 'High Risk Counterparty', 'Known Drainer Cluster'],
          isBlacklisted: true,
        });
      } else {
        setScanResult({
          riskLevel: 'LOW',
          score: 4,
          tags: ['Clean AML Status', 'Active On-Chain Activity', 'Zero Suspicious Flag', 'Verified Validator'],
          isBlacklisted: false,
        });
      }
    }, 800);
  };

  const handleRevokeApproval = (id: string) => {
    triggerHaptic();
    setRevokingId(id);
    setTimeout(() => {
      setApprovals((prev) => prev.filter((a) => a.id !== id));
      setRevokingId(null);
    }, 1000);
  };

  const handleExecuteBatch = (e: React.FormEvent) => {
    e.preventDefault();
    triggerHaptic();
    setIsProcessingBatch(true);
    setBatchSuccessMsg(null);

    setTimeout(() => {
      setIsProcessingBatch(false);
      setBatchSuccessMsg(`Successfully queued batch transfer of ${batchAmount} USDT across target addresses!`);
      setBatchAddresses('');
      setTimeout(() => setBatchSuccessMsg(null), 5000);
    }, 1200);
  };

  const handleLaunchUrl = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchUrl.trim()) return;
    triggerHaptic();
    let target = searchUrl.trim();
    if (!target.startsWith('http://') && !target.startsWith('https://')) {
      target = `https://${target}`;
    }
    window.open(target, '_blank', 'noopener,noreferrer');
  };

  const filteredDApps = DAPPS_DATA.filter((d) => {
    const matchesCategory = selectedCategory === 'ALL' || d.category === selectedCategory || (selectedCategory === 'BOOKMARKS' && bookmarkedIds.includes(d.id));
    const matchesSearch = d.name.toLowerCase().includes(searchUrl.toLowerCase()) || d.desc.toLowerCase().includes(searchUrl.toLowerCase()) || d.chains.some((c) => c.toLowerCase().includes(searchUrl.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const categories = [
    { id: 'ALL', label: 'All dApps' },
    { id: 'BOOKMARKS', label: '★ Favorites' },
    { id: 'TRON', label: 'TRON Eco' },
    { id: 'DEX', label: 'DEX & Swaps' },
    { id: 'DEFI', label: 'Lending & Yield' },
    { id: 'TOOLS', label: 'Analytics & Tools' },
    { id: 'NFT', label: 'NFTs' },
  ];

  const tools = [
    {
      id: 'risk-scan',
      title: 'Address AML & Risk Inspector',
      desc: 'Screen recipient addresses against malicious scam blacklists and drainers',
      icon: ShieldAlert,
      color: 'text-amber-500 bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/20',
      action: () => setActiveToolModal('risk-scan'),
    },
    {
      id: 'approval-manager',
      title: 'Token Approvals & Revoke Tool',
      desc: 'Audit infinite smart contract spend permissions to protect funds',
      icon: Lock,
      color: 'text-purple-600 bg-purple-50 dark:bg-purple-500/10 border-purple-200 dark:border-purple-500/20',
      action: () => setActiveToolModal('approval-manager'),
    },
    {
      id: 'gas-station',
      title: 'Real-time Gas & Energy Station',
      desc: 'Live TRON Energy, Ethereum Gwei, and BSC network fee tracker',
      icon: Fuel,
      color: 'text-[#03b875] bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20',
      action: () => setActiveToolModal('gas-station'),
    },
    {
      id: 'batch-transfer',
      title: 'Batch Transfer Helper',
      desc: 'Multi-recipient enterprise payout and distribution engine',
      icon: Users,
      color: 'text-[#2980fe] bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/20',
      action: () => setActiveToolModal('batch-transfer'),
    },
  ];

  return (
    <div className="space-y-4 pb-20 select-none">
      {/* Search & DApp URL Browser Bar */}
      <form onSubmit={handleLaunchUrl} className="relative flex items-center gap-2">
        <div className="relative flex-1">
          <Compass className="absolute left-3.5 top-3 h-4 w-4 text-[#2980fe]" />
          <input
            type="text"
            value={searchUrl}
            onChange={(e) => setSearchUrl(e.target.value)}
            placeholder="Search DApp name, DeFi protocol, or enter URL..."
            className="w-full bg-white dark:bg-[#121620] border border-[#e5e7eb] dark:border-[#1e2433] rounded-2xl pl-10 pr-4 py-2.5 text-xs text-[#1e2024] dark:text-white placeholder-[#9ca3af] focus:border-[#2980fe] focus:outline-none shadow-xs transition-colors"
          />
        </div>
        {searchUrl && (
          <button
            type="submit"
            className="px-4 py-2.5 bg-[#2980fe] hover:bg-[#1e58e6] text-white font-bold rounded-2xl text-xs flex items-center gap-1 shrink-0 shadow-xs cursor-pointer"
          >
            <span>Open</span>
            <ArrowUpRight className="h-3.5 w-3.5" />
          </button>
        )}
      </form>

      {/* Featured Web3 Banner */}
      <div className="bg-gradient-to-r from-blue-50 via-indigo-50/50 to-blue-50/30 dark:from-[#152033] dark:via-[#161d2d] dark:to-[#121824] rounded-3xl border border-blue-100 dark:border-[#1e2738] p-4 shadow-xs relative overflow-hidden transition-colors">
        <div className="flex items-center space-x-3.5">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#2980fe] text-white shadow-md shadow-blue-500/20 shrink-0 font-black text-base">
            TP
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-xs font-bold text-[#1e2024] dark:text-white flex items-center gap-1.5">
              <span>TokenPocket Web3 Ecosystem Hub</span>
              <span className="text-[9px] bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-500/20 font-mono font-bold">
                Live Data
              </span>
            </h3>
            <p className="text-[11px] text-[#6b7280] dark:text-[#94a3b8] mt-0.5 leading-relaxed">
              Explore multi-chain DeFi protocols, verified TRON smart contracts, and real-time gas optimization.
            </p>
          </div>
        </div>
      </div>

      {/* 3 Main Segment Tabs: DApps Directory, Web3 Live News, Security Tools */}
      <div className="bg-[#f7f8fa] dark:bg-[#121620] p-1.5 rounded-2xl border border-[#e5e7eb] dark:border-[#1e2433] shadow-xs">
        <div className="grid grid-cols-3 gap-1">
          <button
            type="button"
            onClick={() => {
              triggerHaptic();
              setActiveTab('DAPPS');
            }}
            className={`py-2 px-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'DAPPS'
                ? 'bg-[#2980fe] text-white shadow-xs'
                : 'text-[#6b7280] dark:text-[#94a3b8] hover:text-[#1e2024] dark:hover:text-white'
            }`}
          >
            <Compass className="h-3.5 w-3.5" />
            <span>dApps ({DAPPS_DATA.length})</span>
          </button>

          <button
            type="button"
            onClick={() => {
              triggerHaptic();
              setActiveTab('NEWS');
            }}
            className={`py-2 px-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'NEWS'
                ? 'bg-[#2980fe] text-white shadow-xs'
                : 'text-[#6b7280] dark:text-[#94a3b8] hover:text-[#1e2024] dark:hover:text-white'
            }`}
          >
            <Newspaper className="h-3.5 w-3.5" />
            <span>Live News</span>
          </button>

          <button
            type="button"
            onClick={() => {
              triggerHaptic();
              setActiveTab('TOOLS');
            }}
            className={`py-2 px-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'TOOLS'
                ? 'bg-[#2980fe] text-white shadow-xs'
                : 'text-[#6b7280] dark:text-[#94a3b8] hover:text-[#1e2024] dark:hover:text-white'
            }`}
          >
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>Security (4)</span>
          </button>
        </div>
      </div>

      {/* TAB 1: DAPPS DIRECTORY */}
      {activeTab === 'DAPPS' && (
        <div className="space-y-3">
          {/* Category Horizontal Scroll Pills */}
          <div className="flex items-center space-x-1.5 overflow-x-auto no-scrollbar pb-1">
            {categories.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => {
                  triggerHaptic();
                  setSelectedCategory(c.id);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  selectedCategory === c.id
                    ? 'bg-[#2980fe] text-white shadow-xs'
                    : 'bg-white dark:bg-[#121620] text-[#6b7280] dark:text-[#94a3b8] border border-[#e5e7eb] dark:border-[#1e2433] hover:border-[#2980fe]'
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>

          {/* DApps Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {filteredDApps.map((dapp) => {
              const isFav = bookmarkedIds.includes(dapp.id);
              return (
                <div
                  key={dapp.id}
                  onClick={() => {
                    triggerHaptic();
                    setSelectedDApp(dapp);
                  }}
                  className="bg-white dark:bg-[#121620] rounded-2xl border border-[#e5e7eb] dark:border-[#1e2433] p-3.5 hover:border-[#2980fe]/50 transition-all cursor-pointer shadow-xs group flex items-start space-x-3 relative"
                >
                  <div className={`flex h-11 w-11 items-center justify-center rounded-2xl shrink-0 font-bold text-xs shadow-xs ${dapp.iconBg}`}>
                    {dapp.iconText}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-[#1e2024] dark:text-white group-hover:text-[#2980fe] transition-colors flex items-center gap-1.5 truncate">
                        <span>{dapp.name}</span>
                        {dapp.isHot && (
                          <span className="text-[9px] bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 font-bold px-1.5 py-0.2 rounded-full border border-red-200 dark:border-red-500/20">
                            HOT
                          </span>
                        )}
                      </h4>
                      <button
                        type="button"
                        onClick={(e) => toggleBookmark(dapp.id, e)}
                        className={`p-1 rounded-lg transition-colors cursor-pointer ${
                          isFav ? 'text-amber-500 hover:text-amber-600' : 'text-[#9ca3af] hover:text-[#1e2024] dark:hover:text-white'
                        }`}
                      >
                        <Star className={`h-3.5 w-3.5 ${isFav ? 'fill-current' : ''}`} />
                      </button>
                    </div>

                    <p className="text-[11px] text-[#6b7280] dark:text-[#94a3b8] line-clamp-2 mt-0.5 leading-relaxed">
                      {dapp.desc}
                    </p>

                    <div className="flex items-center justify-between pt-2 mt-1 border-t border-[#f5f6f8] dark:border-[#182030] text-[10px]">
                      <div className="flex items-center space-x-1 font-mono text-[#6b7280] dark:text-[#94a3b8]">
                        {dapp.chains.map((c) => (
                          <span key={c} className="bg-[#f7f8fa] dark:bg-[#182030] px-1.5 py-0.5 rounded border border-[#e5e7eb] dark:border-[#1e2433]">
                            {c}
                          </span>
                        ))}
                      </div>
                      {dapp.tvl && (
                        <span className="font-mono text-[#03b875] dark:text-emerald-400 font-bold">
                          TVL: {dapp.tvl}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: LIVE WEB3 NEWS FEED */}
      {activeTab === 'NEWS' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-bold text-[#6b7280] dark:text-[#94a3b8] uppercase tracking-wider">
              Real-time Market & Protocol Wire
            </span>
            <button
              type="button"
              onClick={handleRefreshNews}
              disabled={isRefreshingNews}
              className="flex items-center space-x-1 text-xs text-[#2980fe] hover:text-[#1e58e6] font-bold cursor-pointer"
            >
              <RefreshCw className={`h-3 w-3 ${isRefreshingNews ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>

          <div className="space-y-2.5">
            {newsList.map((n) => (
              <div
                key={n.id}
                onClick={() => {
                  triggerHaptic();
                  setSelectedNews(n);
                }}
                className="bg-white dark:bg-[#121620] rounded-2xl border border-[#e5e7eb] dark:border-[#1e2433] p-3.5 hover:border-[#2980fe]/50 transition-all cursor-pointer shadow-xs group space-y-1.5"
              >
                <div className="flex items-center justify-between text-[10px]">
                  <span className="font-bold text-[#2980fe] bg-blue-50 dark:bg-blue-500/10 px-2 py-0.5 rounded-full border border-blue-200 dark:border-blue-500/20 font-mono">
                    {n.category}
                  </span>
                  <div className="flex items-center space-x-2 text-[#6b7280] dark:text-[#94a3b8] font-mono">
                    <span>{n.source}</span>
                    <span>•</span>
                    <span>{n.time}</span>
                  </div>
                </div>

                <h4 className="text-xs font-bold text-[#1e2024] dark:text-white group-hover:text-[#2980fe] transition-colors leading-snug">
                  {n.title}
                </h4>

                <p className="text-[11px] text-[#6b7280] dark:text-[#94a3b8] line-clamp-2 leading-relaxed">
                  {n.summary}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: WEB3 UTILITIES & SECURITY TOOLS */}
      {activeTab === 'TOOLS' && (
        <div className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {tools.map((t) => {
              const Icon = t.icon;
              return (
                <div
                  key={t.id}
                  onClick={() => {
                    triggerHaptic();
                    t.action();
                  }}
                  className="bg-white dark:bg-[#121620] rounded-2xl border border-[#e5e7eb] dark:border-[#1e2433] p-3.5 hover:border-[#2980fe]/50 transition-all cursor-pointer shadow-xs group flex items-start space-x-3"
                >
                  <div className={`flex h-10 w-10 items-center justify-center rounded-xl border shrink-0 ${t.color}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="text-xs font-bold text-[#1e2024] dark:text-white group-hover:text-[#2980fe] transition-colors flex items-center justify-between">
                      <span>{t.title}</span>
                      <ArrowRight className="h-3.5 w-3.5 text-[#9ca3af] group-hover:text-[#2980fe] group-hover:translate-x-0.5 transition-all" />
                    </h4>
                    <p className="text-[10px] text-[#6b7280] dark:text-[#94a3b8] line-clamp-2 mt-0.5">
                      {t.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* DAPP LAUNCH MODAL */}
      {selectedDApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-md bg-white dark:bg-[#121620] border border-[#e5e7eb] dark:border-[#1e2433] rounded-3xl p-5 shadow-2xl space-y-4 text-[#1e2024] dark:text-white">
            <div className="flex items-center justify-between border-b border-[#f5f6f8] dark:border-[#182030] pb-3">
              <div className="flex items-center space-x-3">
                <div className={`h-10 w-10 rounded-2xl flex items-center justify-center font-bold text-xs ${selectedDApp.iconBg}`}>
                  {selectedDApp.iconText}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#1e2024] dark:text-white">{selectedDApp.name}</h3>
                  <span className="text-[10px] text-[#6b7280] dark:text-[#94a3b8] font-mono">{selectedDApp.url}</span>
                </div>
              </div>
              <button
                onClick={() => setSelectedDApp(null)}
                className="text-[#9ca3af] hover:text-[#1e2024] dark:hover:text-white p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-[#6b7280] dark:text-[#94a3b8] leading-relaxed">
              {selectedDApp.desc}
            </p>

            <div className="bg-[#f7f8fa] dark:bg-[#0b0e14] p-3 rounded-2xl border border-[#e5e7eb] dark:border-[#1e2433] space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-[#6b7280] dark:text-[#94a3b8]">Supported Chains:</span>
                <span className="font-bold text-[#1e2024] dark:text-white">{selectedDApp.chains.join(', ')}</span>
              </div>
              {selectedDApp.tvl && (
                <div className="flex justify-between">
                  <span className="text-[#6b7280] dark:text-[#94a3b8]">Total Locked Value (TVL):</span>
                  <span className="font-mono font-bold text-[#03b875] dark:text-emerald-400">{selectedDApp.tvl}</span>
                </div>
              )}
              {selectedDApp.users && (
                <div className="flex justify-between">
                  <span className="text-[#6b7280] dark:text-[#94a3b8]">Active Traders:</span>
                  <span className="font-mono text-[#1e2024] dark:text-white">{selectedDApp.users}</span>
                </div>
              )}
            </div>

            <div className="flex items-center space-x-2 pt-2">
              <button
                type="button"
                onClick={() => toggleBookmark(selectedDApp.id)}
                className="p-3 bg-[#f7f8fa] dark:bg-[#182030] border border-[#e5e7eb] dark:border-[#1e2433] rounded-2xl text-xs font-bold text-[#6b7280] dark:text-[#94a3b8] hover:text-[#1e2024] dark:hover:text-white flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Star className={`h-4 w-4 ${bookmarkedIds.includes(selectedDApp.id) ? 'fill-amber-500 text-amber-500' : ''}`} />
                <span>{bookmarkedIds.includes(selectedDApp.id) ? 'Saved' : 'Favorite'}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  window.open(selectedDApp.url, '_blank', 'noopener,noreferrer');
                  setSelectedDApp(null);
                }}
                className="flex-1 py-3 bg-[#2980fe] hover:bg-[#1e58e6] text-white font-bold rounded-2xl text-xs flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
              >
                <span>Launch dApp Protocol</span>
                <ExternalLink className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* NEWS DETAIL MODAL */}
      {selectedNews && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-md bg-white dark:bg-[#121620] border border-[#e5e7eb] dark:border-[#1e2433] rounded-3xl p-5 shadow-2xl space-y-4 text-[#1e2024] dark:text-white">
            <div className="flex items-center justify-between border-b border-[#f5f6f8] dark:border-[#182030] pb-3">
              <div className="flex items-center space-x-2">
                <Newspaper className="h-4 w-4 text-[#2980fe]" />
                <span className="text-xs font-bold text-[#2980fe]">{selectedNews.source}</span>
                <span className="text-[10px] text-[#6b7280] dark:text-[#94a3b8] font-mono">• {selectedNews.time}</span>
              </div>
              <button
                onClick={() => setSelectedNews(null)}
                className="text-[#9ca3af] hover:text-[#1e2024] dark:hover:text-white p-1"
              >
                ✕
              </button>
            </div>

            <h3 className="text-sm font-bold text-[#1e2024] dark:text-white leading-snug">{selectedNews.title}</h3>

            <p className="text-xs text-[#6b7280] dark:text-[#94a3b8] leading-relaxed">
              {selectedNews.summary}
            </p>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => {
                  window.open(selectedNews.link, '_blank', 'noopener,noreferrer');
                  setSelectedNews(null);
                }}
                className="w-full py-2.5 bg-[#2980fe] hover:bg-[#1e58e6] text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
              >
                <span>Read Full Coverage at {selectedNews.source}</span>
                <ExternalLink className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TOOL MODAL 1: AML & ADDRESS RISK SCANNER */}
      {activeToolModal === 'risk-scan' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-md bg-white dark:bg-[#121620] border border-[#e5e7eb] dark:border-[#1e2433] rounded-3xl p-5 shadow-2xl space-y-4 text-[#1e2024] dark:text-white">
            <div className="flex items-center justify-between border-b border-[#f5f6f8] dark:border-[#182030] pb-3">
              <div className="flex items-center space-x-2">
                <ShieldAlert className="h-5 w-5 text-amber-500" />
                <h3 className="text-sm font-bold text-[#1e2024] dark:text-white">Address AML & Risk Inspector</h3>
              </div>
              <button
                onClick={() => setActiveToolModal(null)}
                className="text-[#9ca3af] hover:text-[#1e2024] dark:hover:text-white p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleScanAddress} className="space-y-3">
              <div>
                <label className="text-[11px] font-bold text-[#6b7280] dark:text-[#94a3b8] block mb-1">
                  Recipient Blockchain Address:
                </label>
                <input
                  type="text"
                  value={scanAddress}
                  onChange={(e) => setScanAddress(e.target.value)}
                  placeholder="Paste TRON (T...) or EVM (0x...) address"
                  className="w-full bg-[#f7f8fa] dark:bg-[#0b0e14] border border-[#e5e7eb] dark:border-[#1e2433] rounded-xl px-3 py-2.5 text-xs text-[#1e2024] dark:text-white font-mono focus:border-amber-500 focus:outline-none"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={isScanning}
                className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                {isScanning ? <RefreshCw className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
                <span>{isScanning ? 'Querying AML Blacklists...' : 'Inspect Address Risk'}</span>
              </button>
            </form>

            {scanResult && (
              <div className={`p-4 rounded-2xl border space-y-2 ${
                scanResult.riskLevel === 'LOW'
                  ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20 text-emerald-800 dark:text-emerald-300'
                  : 'bg-rose-50 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/20 text-rose-800 dark:text-rose-300'
              }`}>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs">
                    Risk Assessment: {scanResult.riskLevel === 'LOW' ? 'Safe Address' : 'High Risk Alert'}
                  </span>
                  <span className="font-mono text-xs font-black">
                    Risk Score: {scanResult.score}/100
                  </span>
                </div>

                <div className="flex flex-wrap gap-1.5 pt-1">
                  {scanResult.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-white dark:bg-[#121620] border border-current"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TOOL MODAL 2: TOKEN APPROVAL MANAGER */}
      {activeToolModal === 'approval-manager' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-md bg-white dark:bg-[#121620] border border-[#e5e7eb] dark:border-[#1e2433] rounded-3xl p-5 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto text-[#1e2024] dark:text-white">
            <div className="flex items-center justify-between border-b border-[#f5f6f8] dark:border-[#182030] pb-3">
              <div className="flex items-center space-x-2">
                <Lock className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                <h3 className="text-sm font-bold text-[#1e2024] dark:text-white">Token Approval Manager</h3>
              </div>
              <button
                onClick={() => setActiveToolModal(null)}
                className="text-[#9ca3af] hover:text-[#1e2024] dark:hover:text-white p-1"
              >
                ✕
              </button>
            </div>

            <p className="text-[11px] text-[#6b7280] dark:text-[#94a3b8] leading-relaxed">
              Review and revoke unlimited smart contract allowances to protect your USDT balance from exploit drainers.
            </p>

            <div className="space-y-2.5">
              {approvals.length === 0 ? (
                <div className="p-6 text-center text-xs text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-500/10 rounded-2xl border border-emerald-200 dark:border-emerald-500/20">
                  <CheckCircle2 className="h-8 w-8 mx-auto mb-2 text-emerald-600 dark:text-emerald-400" />
                  <span>All high-risk approvals successfully revoked!</span>
                </div>
              ) : (
                approvals.map((a) => (
                  <div
                    key={a.id}
                    className="p-3 bg-[#f7f8fa] dark:bg-[#0b0e14] rounded-2xl border border-[#e5e7eb] dark:border-[#1e2433] space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-[#1e2024] dark:text-white">{a.protocol}</h4>
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                        a.risk === 'HIGH' ? 'bg-rose-100 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-500/20' : 'bg-amber-100 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400'
                      }`}>
                        {a.risk} RISK
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] font-mono text-[#6b7280] dark:text-[#94a3b8]">
                      <span>Allowance: <strong className="text-[#1e2024] dark:text-white">{a.allowance}</strong></span>
                      <button
                        type="button"
                        disabled={revokingId === a.id}
                        onClick={() => handleRevokeApproval(a.id)}
                        className="px-2.5 py-1 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 text-rose-600 dark:text-rose-400 font-bold rounded-lg text-[10px] border border-rose-200 dark:border-rose-500/20 transition-colors cursor-pointer"
                      >
                        {revokingId === a.id ? 'Revoking...' : 'Revoke'}
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* TOOL MODAL 3: GAS STATION */}
      {activeToolModal === 'gas-station' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-md bg-white dark:bg-[#121620] border border-[#e5e7eb] dark:border-[#1e2433] rounded-3xl p-5 shadow-2xl space-y-4 text-[#1e2024] dark:text-white">
            <div className="flex items-center justify-between border-b border-[#f5f6f8] dark:border-[#182030] pb-3">
              <div className="flex items-center space-x-2">
                <Fuel className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                <h3 className="text-sm font-bold text-[#1e2024] dark:text-white">Live Gas & Energy Station</h3>
              </div>
              <button
                onClick={() => setActiveToolModal(null)}
                className="text-[#9ca3af] hover:text-[#1e2024] dark:hover:text-white p-1"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              {/* TRON */}
              <div className="p-3 bg-[#f7f8fa] dark:bg-[#0b0e14] rounded-2xl border border-[#e5e7eb] dark:border-[#1e2433] space-y-1">
                <div className="flex justify-between items-center text-xs font-bold text-[#1e2024] dark:text-white">
                  <span className="text-red-500 font-mono">TRON (TRC20) Energy</span>
                  <span className="text-[#03b875] dark:text-emerald-400">~1.00 USDT Transfer Cost</span>
                </div>
                <div className="text-[11px] text-[#6b7280] dark:text-[#94a3b8] font-mono">
                  Standard Energy: 31,895 Energy • 0 TRX Burn with staking
                </div>
              </div>

              {/* ETH */}
              <div className="p-3 bg-[#f7f8fa] dark:bg-[#0b0e14] rounded-2xl border border-[#e5e7eb] dark:border-[#1e2433] space-y-1">
                <div className="flex justify-between items-center text-xs font-bold text-[#1e2024] dark:text-white">
                  <span className="text-blue-600 dark:text-blue-400 font-mono">Ethereum (ERC20) Gwei</span>
                  <span className="text-[#03b875] dark:text-emerald-400">14 Gwei (Low)</span>
                </div>
                <div className="text-[11px] text-[#6b7280] dark:text-[#94a3b8] font-mono">
                  Slow: 12 Gwei • Standard: 14 Gwei • Rapid: 18 Gwei
                </div>
              </div>

              {/* BSC */}
              <div className="p-3 bg-[#f7f8fa] dark:bg-[#0b0e14] rounded-2xl border border-[#e5e7eb] dark:border-[#1e2433] space-y-1">
                <div className="flex justify-between items-center text-xs font-bold text-[#1e2024] dark:text-white">
                  <span className="text-amber-600 dark:text-amber-400 font-mono">BNB Smart Chain (BEP20)</span>
                  <span className="text-[#03b875] dark:text-emerald-400">3.0 Gwei (~0.25 USDT)</span>
                </div>
                <div className="text-[11px] text-[#6b7280] dark:text-[#94a3b8] font-mono">
                  Block Time: 3.0s • Congestion: Low (Optimal)
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TOOL MODAL 4: BATCH TRANSFER */}
      {activeToolModal === 'batch-transfer' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-md bg-white dark:bg-[#121620] border border-[#e5e7eb] dark:border-[#1e2433] rounded-3xl p-5 shadow-2xl space-y-4 text-[#1e2024] dark:text-white">
            <div className="flex items-center justify-between border-b border-[#f5f6f8] dark:border-[#182030] pb-3">
              <div className="flex items-center space-x-2">
                <Users className="h-5 w-5 text-[#2980fe]" />
                <h3 className="text-sm font-bold text-[#1e2024] dark:text-white">Batch Transfer Helper</h3>
              </div>
              <button
                onClick={() => setActiveToolModal(null)}
                className="text-[#9ca3af] hover:text-[#1e2024] dark:hover:text-white p-1"
              >
                ✕
              </button>
            </div>

            {batchSuccessMsg && (
              <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-2">
                <Check className="h-4 w-4 text-emerald-600 shrink-0" />
                <span>{batchSuccessMsg}</span>
              </div>
            )}

            <form onSubmit={handleExecuteBatch} className="space-y-3">
              <div>
                <label className="text-[11px] font-bold text-[#6b7280] dark:text-[#94a3b8] block mb-1">
                  Recipient Addresses (One per line):
                </label>
                <textarea
                  rows={4}
                  value={batchAddresses}
                  onChange={(e) => setBatchAddresses(e.target.value)}
                  placeholder="TXLaErHExepFdTnBsTXbvB6Nqh1mZ36Qz5&#10;TLyqzVGLV1srkB7dToTAnYgWxNDP6UeW5g"
                  className="w-full bg-[#f7f8fa] dark:bg-[#0b0e14] border border-[#e5e7eb] dark:border-[#1e2433] rounded-xl p-3 text-xs text-[#1e2024] dark:text-white font-mono focus:border-[#2980fe] focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-[#6b7280] dark:text-[#94a3b8] block mb-1">
                  Amount per Recipient (USDT):
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.1"
                  value={batchAmount}
                  onChange={(e) => setBatchAmount(e.target.value)}
                  className="w-full bg-[#f7f8fa] dark:bg-[#0b0e14] border border-[#e5e7eb] dark:border-[#1e2433] rounded-xl px-3 py-2 text-xs text-[#1e2024] dark:text-white font-mono focus:border-[#2980fe] focus:outline-none"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={isProcessingBatch}
                className="w-full py-2.5 bg-[#2980fe] hover:bg-[#1e58e6] text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
              >
                {isProcessingBatch ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                <span>{isProcessingBatch ? 'Executing Multi-Send...' : 'Broadcast Batch Transfer'}</span>
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
