import React, { useState } from 'react';
import { 
  ArrowLeft, Search, HelpCircle, MessageSquare, ChevronDown, 
  Send, Bot, User, Sparkles, Activity, ShieldCheck, CheckCircle2 
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { SupportFAQ, SupportChatMessage } from '../types';

export const HelpSupportView: React.FC = () => {
  const { setActiveView, triggerHaptic } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [expandedFaqId, setExpandedFaqId] = useState<string | null>('faq1');

  // AI Support Chat State
  const [chatMessages, setChatMessages] = useState<SupportChatMessage[]>([
    {
      id: 'm1',
      sender: 'bot',
      text: 'Hello! I am your 24/7 USDT Vault AI Concierge. How can I assist you with your wallet, deposits, withdrawals, or security today?',
      timestamp: 'Just now',
    },
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const faqs: SupportFAQ[] = [
    {
      id: 'faq1',
      category: 'DEPOSIT',
      question: 'How long does a USDT deposit take to reflect in my balance?',
      answer: 'TRC-20 deposits require 1 network confirmation (~1 minute). ERC-20 deposits require 12 confirmations (~3 minutes), and BEP-20 requires 15 confirmations (~1 minute). Once confirmed on-chain, your balance is credited immediately via our double-entry ledger engine.',
    },
    {
      id: 'faq2',
      category: 'FEES',
      question: 'What are the withdrawal and network fees?',
      answer: 'TRC-20: 1.00 USDT network fee. ERC-20: 3.50 USDT network fee. BEP-20: 0.80 USDT network fee. Internal P2P transfers to another registered email or account ID are completely FREE (0.00 USDT fee) with instant settlement.',
    },
    {
      id: 'faq3',
      category: 'SECURITY',
      question: 'How does 2FA and MPC Enclave protection work?',
      answer: 'When Two-Factor Authentication (2FA) is enabled, withdrawals and critical security changes require a 6-digit Time-based One-Time Password (TOTP) from Google Authenticator or Microsoft Authenticator. Private keys are safeguarded in an isolated Multi-Party Computation (MPC) hardware enclave.',
    },
    {
      id: 'faq4',
      category: 'KYC',
      question: 'What are the KYC tiers and withdrawal limits?',
      answer: 'Tier 0 (Unverified): 500 USDT daily withdrawal limit. Tier 1 (ID Verified): 10,000 USDT daily limit. Tier 2 (Enterprise / Proof of Address): Unlimited daily withdrawals and OTC priority processing.',
    },
    {
      id: 'faq5',
      category: 'WITHDRAW',
      question: 'Can a withdrawal be cancelled once broadcasted?',
      answer: 'Once a transaction is signed and broadcasted to the decentralized blockchain network, it cannot be reversed. However, transactions flagged for compliance review (pending manual approval) can be cancelled by contacting compliance support before release.',
    },
  ];

  const categories = ['ALL', 'DEPOSIT', 'WITHDRAW', 'SECURITY', 'KYC', 'FEES'];

  const filteredFaqs = faqs.filter((faq) => {
    const matchesCategory = selectedCategory === 'ALL' || faq.category === selectedCategory;
    const matchesSearch = faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    triggerHaptic();

    const userMsg: SupportChatMessage = {
      id: 'u_' + Date.now(),
      sender: 'user',
      text: chatInput.trim(),
      timestamp: 'Just now',
    };

    setChatMessages((prev) => [...prev, userMsg]);
    setChatInput('');
    setIsTyping(true);

    setTimeout(() => {
      let botResponse = 'Thank you for reaching out. Our support protocol is active. ';
      const lower = userMsg.text.toLowerCase();

      if (lower.includes('deposit') || lower.includes('receive')) {
        botResponse = 'For deposits, navigate to the Home screen and tap "Receive" or "Deposit". Select your preferred network (TRC20, ERC20, or BEP20) to view your dedicated deposit address and QR code. Confirmations take 1–3 minutes.';
      } else if (lower.includes('withdraw') || lower.includes('send') || lower.includes('fee')) {
        botResponse = 'Withdrawal fees are 1.0 USDT for TRC20, 3.5 USDT for ERC20, and 0.8 USDT for BEP20. Internal transfers between registered accounts are 100% free with 0 fee. If 2FA is enabled, enter your 6-digit code to authorize.';
      } else if (lower.includes('kyc') || lower.includes('tier') || lower.includes('limit')) {
        botResponse = 'You can upgrade your KYC Tier in the Profile -> Identity Verification tab. Tier 1 unlocks a $10,000 daily limit, and Tier 2 unlocks unlimited enterprise withdrawals.';
      } else if (lower.includes('2fa') || lower.includes('authenticator') || lower.includes('security')) {
        botResponse = 'To protect your funds, enable Google Authenticator in Profile -> Security & 2FA Center. You will be provided with a QR code and secret backup key.';
      } else {
        botResponse = `Understood: "${userMsg.text}". All ledger entries are synchronized across TRON, Ethereum, and BSC. If you require manual operator escalation, our compliance team is available 24/7.`;
      }

      setChatMessages((prev) => [
        ...prev,
        {
          id: 'b_' + Date.now(),
          sender: 'bot',
          text: botResponse,
          timestamp: 'Just now',
        },
      ]);
      setIsTyping(false);
    }, 900);
  };

  return (
    <div className="space-y-4 pb-20 select-none text-[#1e2024] dark:text-white">
      {/* Top Navigation */}
      <div className="flex items-center justify-between py-1">
        <button
          type="button"
          onClick={() => setActiveView('profile')}
          className="flex items-center space-x-1.5 text-xs text-[#6b7280] dark:text-[#94a3b8] hover:text-[#1e2024] dark:hover:text-white p-1 rounded-lg cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back</span>
        </button>
        <h2 className="text-sm font-bold text-[#1e2024] dark:text-white">Help & 24/7 AI Desk</h2>
        <div className="w-8" />
      </div>

      {/* 24/7 AI Assistant Interactive Chat Card */}
      <div className="bg-white dark:bg-[#121620] rounded-3xl border border-[#e5e7eb] dark:border-[#1e2433] p-4 shadow-xs space-y-3">
        <div className="flex items-center justify-between border-b border-[#f3f4f6] dark:border-[#182030] pb-2">
          <div className="flex items-center space-x-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-500/10 text-[#2980fe] dark:text-blue-400 border border-blue-200 dark:border-blue-500/20">
              <Bot className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-[#1e2024] dark:text-white flex items-center gap-1.5">
                <span>AI Vault Concierge</span>
                <span className="flex h-1.5 w-1.5 rounded-full bg-[#03b875] animate-pulse" />
              </h3>
              <p className="text-[10px] text-[#2980fe] dark:text-blue-400 font-mono">Instant 24/7 Assistance</p>
            </div>
          </div>
          <span className="text-[10px] font-mono text-[#8a93a6] dark:text-[#64748b]">v2.4 Live</span>
        </div>

        {/* Chat Message Scroll */}
        <div className="max-h-48 overflow-y-auto space-y-2.5 pr-1 no-scrollbar text-xs">
          {chatMessages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] p-3 rounded-2xl text-xs leading-relaxed ${
                  msg.sender === 'user'
                    ? 'bg-[#2980fe] text-white font-medium rounded-br-none shadow-xs'
                    : 'bg-[#f7f8fa] dark:bg-[#182030] text-[#1e2024] dark:text-white border border-[#e5e7eb] dark:border-[#1e2433] rounded-bl-none'
                }`}
              >
                {msg.text}
              </div>
            </div>
          ))}
          {isTyping && (
            <div className="flex justify-start">
              <div className="bg-[#f7f8fa] dark:bg-[#182030] p-2.5 rounded-2xl rounded-bl-none text-xs text-[#6b7280] dark:text-[#94a3b8] flex items-center gap-1 border border-[#e5e7eb] dark:border-[#1e2433]">
                <Sparkles className="h-3.5 w-3.5 text-[#2980fe] animate-spin" />
                <span>AI Concierge is typing...</span>
              </div>
            </div>
          )}
        </div>

        {/* Chat Input Form */}
        <form onSubmit={handleSendMessage} className="flex items-center gap-1.5 pt-1">
          <input
            type="text"
            placeholder="Ask anything (e.g. deposit times, 2FA setup, fees)..."
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            className="flex-1 bg-[#f7f8fa] dark:bg-[#0b0e14] border border-[#e5e7eb] dark:border-[#1e2433] rounded-xl px-3 py-2 text-xs text-[#1e2024] dark:text-white placeholder-[#8a93a6] focus:border-[#2980fe] focus:outline-none"
          />
          <button
            type="submit"
            disabled={!chatInput.trim()}
            className="p-2 rounded-xl bg-[#2980fe] hover:bg-[#2268d1] disabled:opacity-50 text-white font-bold transition-colors cursor-pointer shadow-xs"
          >
            <Send className="h-4 w-4" />
          </button>
        </form>
      </div>

      {/* Searchable FAQ Section */}
      <div className="space-y-3 pt-2">
        <h3 className="text-xs font-bold text-[#6b7280] dark:text-[#94a3b8] uppercase tracking-wider px-1">
          Frequently Asked Questions
        </h3>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3.5 top-3 h-4 w-4 text-[#8a93a6]" />
          <input
            type="text"
            placeholder="Search FAQ guides and topics..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white dark:bg-[#121620] border border-[#e5e7eb] dark:border-[#1e2433] rounded-2xl pl-10 pr-4 py-2.5 text-xs text-[#1e2024] dark:text-white placeholder-[#8a93a6] focus:border-[#2980fe] focus:outline-none shadow-xs"
          />
        </div>

        {/* Category Pills */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => {
                triggerHaptic();
                setSelectedCategory(cat);
              }}
              className={`px-3 py-1.5 rounded-xl text-[11px] font-bold shrink-0 transition-all cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-[#2980fe] text-white shadow-xs'
                  : 'bg-white dark:bg-[#121620] text-[#6b7280] dark:text-[#94a3b8] hover:text-[#1e2024] dark:hover:text-white border border-[#e5e7eb] dark:border-[#1e2433]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* FAQ Accordion List */}
        <div className="space-y-2">
          {filteredFaqs.map((faq) => {
            const isExpanded = expandedFaqId === faq.id;
            return (
              <div
                key={faq.id}
                className="bg-white dark:bg-[#121620] rounded-2xl border border-[#e5e7eb] dark:border-[#1e2433] overflow-hidden transition-all shadow-xs"
              >
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic();
                    setExpandedFaqId(isExpanded ? null : faq.id);
                  }}
                  className="w-full p-3.5 flex items-center justify-between text-left hover:bg-[#f7f8fa] dark:hover:bg-[#181f2e] transition-colors cursor-pointer"
                >
                  <span className="text-xs font-bold text-[#1e2024] dark:text-white pr-2">
                    {faq.question}
                  </span>
                  <ChevronDown
                    className={`h-4 w-4 text-[#8a93a6] shrink-0 transition-transform duration-200 ${
                      isExpanded ? 'rotate-180 text-[#2980fe]' : ''
                    }`}
                  />
                </button>
                {isExpanded && (
                  <div className="px-3.5 pb-3.5 pt-1 text-xs text-[#6b7280] dark:text-[#94a3b8] leading-relaxed border-t border-[#f3f4f6] dark:border-[#182030] bg-[#f7f8fa] dark:bg-[#0b0e14]">
                    {faq.answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
