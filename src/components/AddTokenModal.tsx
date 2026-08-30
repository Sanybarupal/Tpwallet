import React, { useState } from 'react';
import { X, Plus, Search, Check, Sparkles, ShieldCheck, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { BlockchainNetwork, CustomToken } from '../types';
import { api } from '../lib/api';
import { CryptoIcon } from './CryptoIcons';

interface AddTokenModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddToken?: (token: { symbol: string; name: string; chain: BlockchainNetwork; contract: string; decimals: number }) => void;
}

const POPULAR_TOKENS = [
  { symbol: 'USDC', name: 'USD Coin (TRON)', chain: 'TRC20' as BlockchainNetwork, contract: 'TE2RzoSV3wFK99w6J9UnnZ4vLfXYoxv5b9', decimals: 6 },
  { symbol: 'USDC', name: 'USD Coin (ERC20)', chain: 'ERC20' as BlockchainNetwork, contract: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', decimals: 6 },
  { symbol: 'DAI', name: 'Dai Stablecoin (ERC20)', chain: 'ERC20' as BlockchainNetwork, contract: '0x6B175474E89094C44Da98b954EedeAC495271d0F', decimals: 18 },
  { symbol: 'BUSD', name: 'Binance USD (BEP20)', chain: 'BEP20' as BlockchainNetwork, contract: '0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56', decimals: 18 },
  { symbol: 'TUSD', name: 'TrueUSD (TRON)', chain: 'TRC20' as BlockchainNetwork, contract: 'TUpMhErRtPBNGbGgvPZgE29pKEQUzsKvqh', decimals: 18 },
  { symbol: 'FDUSD', name: 'First Digital USD (BEP20)', chain: 'BEP20' as BlockchainNetwork, contract: '0xc5f0f7b66764F6ec8C8Dff7BA683102295E16409', decimals: 18 },
];

export const AddTokenModal: React.FC<AddTokenModalProps> = ({ isOpen, onClose, onAddToken }) => {
  const { triggerHaptic, activeNetwork, refreshBalance } = useAuth();
  const [activeTab, setActiveTab] = useState<'POPULAR' | 'CUSTOM'>('POPULAR');
  const [search, setSearch] = useState('');
  const [customChain, setCustomChain] = useState<BlockchainNetwork>(activeNetwork || 'TRC20');
  const [contractAddress, setContractAddress] = useState('');
  const [tokenSymbol, setTokenSymbol] = useState('');
  const [tokenName, setTokenName] = useState('');
  const [decimals, setDecimals] = useState('6');
  const [isVerifying, setIsVerifying] = useState(false);
  const [addedSymbols, setAddedSymbols] = useState<string[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleAddPopular = async (token: typeof POPULAR_TOKENS[0]) => {
    triggerHaptic();
    try {
      await api.addCustomToken(token.contract, token.chain);
      if (onAddToken) onAddToken(token);
      setAddedSymbols((prev) => [...prev, `${token.symbol}-${token.chain}`]);
      await refreshBalance();
      setTimeout(() => {
        onClose();
      }, 600);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to add token');
    }
  };

  const handleValidateContract = async () => {
    if (!contractAddress) return;
    setIsVerifying(true);
    setErrorMsg(null);
    try {
      const res = await api.queryContract(contractAddress, customChain);
      if (res.tokenInfo) {
        setTokenSymbol(res.tokenInfo.symbol);
        setTokenName(res.tokenInfo.name);
        setDecimals(res.tokenInfo.decimals.toString());
      }
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Invalid contract query');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleAddCustom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contractAddress || !tokenSymbol) return;
    triggerHaptic();
    setIsVerifying(true);
    setErrorMsg(null);

    try {
      const res = await api.addCustomToken(contractAddress, customChain);

      if (onAddToken) {
        onAddToken({
          symbol: res.token.symbol,
          name: res.token.name,
          chain: res.token.network,
          contract: res.token.contractAddress,
          decimals: res.token.decimals,
        });
      }
      await refreshBalance();
      onClose();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to add token');
    } finally {
      setIsVerifying(false);
    }
  };

  const filteredPopular = POPULAR_TOKENS.filter(
    (t) => t.symbol.toLowerCase().includes(search.toLowerCase()) || t.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in select-none">
      <div className="w-full max-w-md bg-white dark:bg-[#121620] border border-[#e5e7eb] dark:border-[#1e2433] rounded-3xl p-5 shadow-2xl space-y-4 text-[#1e2024] dark:text-white">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#f5f6f8] dark:border-[#182030] pb-3">
          <div className="flex items-center space-x-2">
            <div className="p-1.5 rounded-xl bg-blue-50 dark:bg-blue-500/10 text-[#2980fe] dark:text-blue-400 border border-blue-200 dark:border-blue-500/20">
              <Plus className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-[#1e2024] dark:text-white">Add Custom Token</h3>
              <p className="text-[10px] text-[#6b7280] dark:text-[#94a3b8]">Multi-Chain Smart Contract Asset</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-xl bg-[#f7f8fa] dark:bg-[#182030] text-[#9ca3af] hover:text-[#1e2024] dark:hover:text-white cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {errorMsg && (
          <div className="p-3 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/30 rounded-2xl text-xs text-rose-600 dark:text-rose-300 flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-500" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Tab switch */}
        <div className="flex bg-[#f7f8fa] dark:bg-[#0b0e14] p-1 rounded-2xl border border-[#e5e7eb] dark:border-[#1e2433]">
          <button
            type="button"
            onClick={() => {
              triggerHaptic();
              setActiveTab('POPULAR');
            }}
            className={`flex-1 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              activeTab === 'POPULAR' ? 'bg-[#2980fe] text-white shadow-xs' : 'text-[#6b7280] dark:text-[#94a3b8] hover:text-[#1e2024] dark:hover:text-white'
            }`}
          >
            Popular Tokens
          </button>
          <button
            type="button"
            onClick={() => {
              triggerHaptic();
              setActiveTab('CUSTOM');
            }}
            className={`flex-1 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              activeTab === 'CUSTOM' ? 'bg-[#2980fe] text-white shadow-xs' : 'text-[#6b7280] dark:text-[#94a3b8] hover:text-[#1e2024] dark:hover:text-white'
            }`}
          >
            Smart Contract Input
          </button>
        </div>

        {activeTab === 'POPULAR' ? (
          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-[#9ca3af]" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search USDC, DAI, BUSD, TUSD..."
                className="w-full bg-[#f7f8fa] dark:bg-[#0b0e14] border border-[#e5e7eb] dark:border-[#1e2433] rounded-xl pl-8 pr-3 py-2 text-xs text-[#1e2024] dark:text-white placeholder-[#9ca3af] focus:border-[#2980fe] focus:outline-none"
              />
            </div>

            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {filteredPopular.map((tok) => {
                const isAdded = addedSymbols.includes(`${tok.symbol}-${tok.chain}`);
                return (
                  <div
                    key={`${tok.symbol}-${tok.chain}`}
                    className="p-3 bg-[#f7f8fa] dark:bg-[#0b0e14] rounded-2xl border border-[#e5e7eb] dark:border-[#1e2433] flex items-center justify-between hover:border-[#2980fe]/50 transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      <CryptoIcon symbol={tok.symbol} size={32} />
                      <div>
                        <div className="flex items-center space-x-1.5">
                          <span className="font-bold text-xs text-[#1e2024] dark:text-white">{tok.symbol}</span>
                          <span className="text-[9px] font-mono font-bold bg-white dark:bg-[#182030] text-[#6b7280] dark:text-[#94a3b8] px-1.5 py-0.2 rounded border border-[#e5e7eb] dark:border-[#1e2433]">
                            {tok.chain}
                          </span>
                        </div>
                        <p className="text-[10px] text-[#9ca3af] font-mono truncate max-w-[170px]">
                          {tok.contract}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      disabled={isAdded}
                      onClick={() => handleAddPopular(tok)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 transition-all cursor-pointer ${
                        isAdded
                          ? 'bg-emerald-50 dark:bg-emerald-500/20 text-[#03b875] dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30'
                          : 'bg-[#2980fe] hover:bg-[#1e58e6] text-white shadow-xs'
                      }`}
                    >
                      {isAdded ? (
                        <>
                          <Check className="h-3.5 w-3.5" />
                          <span>Added</span>
                        </>
                      ) : (
                        <>
                          <Plus className="h-3.5 w-3.5" />
                          <span>Add</span>
                        </>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <form onSubmit={handleAddCustom} className="space-y-3">
            <div>
              <label className="text-[10px] font-bold text-[#6b7280] dark:text-[#94a3b8] block mb-1">Target Blockchain</label>
              <div className="grid grid-cols-3 gap-1.5">
                {(['TRC20', 'ERC20', 'BEP20'] as const).map((net) => (
                  <button
                    key={net}
                    type="button"
                    onClick={() => {
                      triggerHaptic();
                      setCustomChain(net);
                    }}
                    className={`py-1.5 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                      customChain === net
                        ? 'bg-[#2980fe] text-white border-[#2980fe]'
                        : 'bg-[#f7f8fa] dark:bg-[#0b0e14] text-[#6b7280] dark:text-[#94a3b8] border-[#e5e7eb] dark:border-[#1e2433]'
                    }`}
                  >
                    {net}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-[10px] font-bold text-[#6b7280] dark:text-[#94a3b8] block">Contract Address</label>
                <button
                  type="button"
                  onClick={handleValidateContract}
                  className="text-[10px] font-bold text-[#2980fe] hover:underline cursor-pointer"
                >
                  Auto-Detect Info
                </button>
              </div>
              <input
                type="text"
                value={contractAddress}
                onChange={(e) => setContractAddress(e.target.value)}
                onBlur={handleValidateContract}
                placeholder={customChain === 'TRC20' ? 'T...' : '0x...'}
                className="w-full bg-[#f7f8fa] dark:bg-[#0b0e14] border border-[#e5e7eb] dark:border-[#1e2433] rounded-xl px-3 py-2 text-xs text-[#1e2024] dark:text-white font-mono focus:border-[#2980fe] focus:outline-none"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] font-bold text-[#6b7280] dark:text-[#94a3b8] block mb-1">Symbol</label>
                <input
                  type="text"
                  value={tokenSymbol}
                  onChange={(e) => setTokenSymbol(e.target.value)}
                  placeholder="e.g. USDT"
                  className="w-full bg-[#f7f8fa] dark:bg-[#0b0e14] border border-[#e5e7eb] dark:border-[#1e2433] rounded-xl px-3 py-2 text-xs text-[#1e2024] dark:text-white focus:border-[#2980fe] focus:outline-none uppercase font-mono"
                  required
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-[#6b7280] dark:text-[#94a3b8] block mb-1">Decimals</label>
                <input
                  type="number"
                  value={decimals}
                  onChange={(e) => setDecimals(e.target.value)}
                  placeholder="6 or 18"
                  className="w-full bg-[#f7f8fa] dark:bg-[#0b0e14] border border-[#e5e7eb] dark:border-[#1e2433] rounded-xl px-3 py-2 text-xs text-[#1e2024] dark:text-white font-mono focus:border-[#2980fe] focus:outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isVerifying}
              className="w-full py-2.5 bg-[#2980fe] hover:bg-[#1e58e6] text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-xs mt-2 transition-colors cursor-pointer"
            >
              {isVerifying ? <Sparkles className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
              <span>{isVerifying ? 'Querying Blockchain RPC...' : 'Import Custom Token'}</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
