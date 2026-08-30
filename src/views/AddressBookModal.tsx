import React, { useState } from 'react';
import { 
  X, Plus, Trash2, Send, Copy, Check, BookOpen, 
  Search, ShieldCheck, UserCheck, ChevronRight 
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { SavedContact, BlockchainNetwork } from '../types';

interface AddressBookModalProps {
  onSelectContact?: (contact: SavedContact) => void;
}

export const AddressBookModal: React.FC<AddressBookModalProps> = ({ onSelectContact }) => {
  const { 
    isAddressBookOpen, setIsAddressBookOpen, contacts, 
    addContact, deleteContact, setSelectedWithdrawalPrefill, 
    setIsWithdrawModalOpen, setIsTransferModalOpen, triggerHaptic 
  } = useAuth();

  const [searchQuery, setSearchQuery] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Form state
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [network, setNetwork] = useState<BlockchainNetwork | 'INTERNAL'>('TRC20');
  const [note, setNote] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  if (!isAddressBookOpen) return null;

  const handleCopy = (id: string, text: string) => {
    triggerHaptic();
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSelect = (contact: SavedContact) => {
    triggerHaptic();
    if (onSelectContact) {
      onSelectContact(contact);
      setIsAddressBookOpen(false);
      return;
    }

    // Default flow: Launch send or internal transfer
    setIsAddressBookOpen(false);
    if (contact.network === 'INTERNAL') {
      setIsTransferModalOpen(true);
    } else {
      setSelectedWithdrawalPrefill({
        network: contact.network,
        address: contact.address,
      });
      setIsWithdrawModalOpen(true);
    }
  };

  const handleSaveContact = (e: React.FormEvent) => {
    e.preventDefault();
    triggerHaptic();
    setFormError(null);

    if (!name.trim()) {
      setFormError('Contact name is required');
      return;
    }
    if (!address.trim()) {
      setFormError('Recipient address / email is required');
      return;
    }

    addContact({
      name: name.trim(),
      address: address.trim(),
      network,
      note: note.trim() || undefined,
    });

    setName('');
    setAddress('');
    setNote('');
    setIsAdding(false);
  };

  const filteredContacts = contacts.filter((c) => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.network.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-white dark:bg-[#0b0e14] text-[#1e2024] dark:text-white animate-in fade-in duration-200 select-none">
      {/* Top Header */}
      <div className="flex items-center justify-between p-4 bg-white/95 dark:bg-[#0b0e14]/95 backdrop-blur-md border-b border-[#e5e7eb] dark:border-[#1e2433] z-10">
        <div className="flex items-center space-x-2">
          <BookOpen className="h-5 w-5 text-[#03b875]" />
          <h3 className="font-bold text-sm text-[#1e2024] dark:text-white">Address Book</h3>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setIsAdding(!isAdding)}
            className="p-1.5 px-3 rounded-xl bg-[#03b875] hover:bg-[#029b63] text-white font-bold text-xs flex items-center gap-1 transition-colors cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>{isAdding ? 'Close' : 'Add New'}</span>
          </button>
          <button
            onClick={() => setIsAddressBookOpen(false)}
            className="p-2 rounded-full bg-[#f7f8fa] dark:bg-[#182030] text-[#9ca3af] hover:text-[#1e2024] dark:hover:text-white transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-4 overflow-y-auto space-y-4">
        {/* Add Contact Drawer Form */}
        {isAdding && (
          <form onSubmit={handleSaveContact} className="bg-[#f7f8fa] dark:bg-[#121620] border border-[#e5e7eb] dark:border-[#1e2433] rounded-3xl p-4 space-y-3 animate-in fade-in">
            <h4 className="text-xs font-bold text-[#03b875] uppercase tracking-wider">
              Add Trusted Contact
            </h4>

            {formError && (
              <div className="p-2 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 text-[11px] text-rose-600 dark:text-rose-400">
                {formError}
              </div>
            )}

            <div>
              <label className="text-[11px] text-[#6b7280] dark:text-[#94a3b8] font-medium block mb-1">Contact Name / Label</label>
              <input
                type="text"
                placeholder="e.g. Binance Deposit / Alice"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-white dark:bg-[#0b0e14] border border-[#e5e7eb] dark:border-[#1e2433] rounded-xl px-3 py-2 text-xs text-[#1e2024] dark:text-white focus:border-[#03b875] focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="text-[11px] text-[#6b7280] dark:text-[#94a3b8] font-medium block mb-1">Network Type</label>
              <div className="grid grid-cols-4 gap-1.5">
                {(['TRC20', 'ERC20', 'BEP20', 'INTERNAL'] as const).map((net) => (
                  <button
                    key={net}
                    type="button"
                    onClick={() => setNetwork(net)}
                    className={`py-1.5 text-[11px] font-bold rounded-xl border transition-all cursor-pointer ${
                      network === net
                        ? 'bg-[#03b875] text-white border-[#03b875]'
                        : 'bg-white dark:bg-[#0b0e14] text-[#6b7280] dark:text-[#94a3b8] border-[#e5e7eb] dark:border-[#1e2433] hover:border-[#03b875]/40'
                    }`}
                  >
                    {net}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-[11px] text-[#6b7280] dark:text-[#94a3b8] font-medium block mb-1">
                {network === 'INTERNAL' ? 'Account Email' : `${network} Wallet Address`}
              </label>
              <input
                type="text"
                placeholder={network === 'INTERNAL' ? 'user@domain.com' : network === 'TRC20' ? 'T...' : '0x...'}
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full bg-white dark:bg-[#0b0e14] border border-[#e5e7eb] dark:border-[#1e2433] rounded-xl px-3 py-2 text-xs text-[#1e2024] dark:text-white font-mono focus:border-[#03b875] focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="text-[11px] text-[#6b7280] dark:text-[#94a3b8] font-medium block mb-1">Note (Optional)</label>
              <input
                type="text"
                placeholder="e.g. OTC settlements / Cold vault"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="w-full bg-white dark:bg-[#0b0e14] border border-[#e5e7eb] dark:border-[#1e2433] rounded-xl px-3 py-2 text-xs text-[#1e2024] dark:text-white focus:border-[#03b875] focus:outline-none"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-[#03b875] hover:bg-[#029b63] text-white font-bold text-xs shadow-xs transition-colors cursor-pointer"
            >
              Save Contact
            </button>
          </form>
        )}

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3.5 top-3 h-4 w-4 text-[#9ca3af]" />
          <input
            type="text"
            placeholder="Search contacts by name, address, or network..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#f7f8fa] dark:bg-[#121620] border border-[#e5e7eb] dark:border-[#1e2433] rounded-2xl pl-10 pr-4 py-2.5 text-xs text-[#1e2024] dark:text-white placeholder-[#9ca3af] focus:border-[#03b875] focus:outline-none"
          />
        </div>

        {/* Contact List */}
        <div className="space-y-2.5">
          {filteredContacts.length === 0 ? (
            <div className="text-center py-10 text-[#9ca3af] text-xs">
              No contacts found. Tap &quot;Add New&quot; to save a trusted wallet address.
            </div>
          ) : (
            filteredContacts.map((contact) => (
              <div
                key={contact.id}
                className="bg-[#f7f8fa] dark:bg-[#121620] rounded-2xl border border-[#e5e7eb] dark:border-[#1e2433] p-3.5 hover:border-[#03b875]/40 transition-all flex flex-col space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-white dark:bg-[#182030] font-bold text-xs text-[#03b875] border border-[#e5e7eb] dark:border-[#1e2433]">
                      {contact.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-[#1e2024] dark:text-white">{contact.name}</h4>
                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-white dark:bg-[#0b0e14] text-[#03b875] border border-[#e5e7eb] dark:border-[#1e2433]">
                        {contact.network}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-1.5">
                    <button
                      type="button"
                      onClick={() => handleSelect(contact)}
                      className="px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 text-[#03b875] font-bold text-xs border border-emerald-200 dark:border-emerald-500/20 flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <Send className="h-3 w-3" />
                      <span>Send</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteContact(contact.id)}
                      className="p-1.5 rounded-lg text-[#9ca3af] hover:text-rose-500 transition-colors cursor-pointer"
                      title="Delete contact"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                <div className="bg-white dark:bg-[#0b0e14] p-2 rounded-xl border border-[#e5e7eb] dark:border-[#1e2433] flex items-center justify-between text-[11px] font-mono text-[#6b7280] dark:text-[#94a3b8]">
                  <span className="truncate max-w-[240px]">{contact.address}</span>
                  <button
                    onClick={() => handleCopy(contact.id, contact.address)}
                    className="text-[#9ca3af] hover:text-[#1e2024] dark:hover:text-white p-0.5 ml-2 cursor-pointer"
                  >
                    {copiedId === contact.id ? <Check className="h-3 w-3 text-[#03b875]" /> : <Copy className="h-3 w-3" />}
                  </button>
                </div>

                {contact.note && (
                  <p className="text-[10px] text-[#9ca3af] italic">
                    Note: {contact.note}
                  </p>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
