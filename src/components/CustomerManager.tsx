import React, { useState, useRef, useEffect } from "react";
import { Customer } from "../types";
import { Users, Search, ShoppingBag, CreditCard, Clipboard, Save, X, Plus } from "lucide-react";

interface CustomerManagerProps {
  customers: Customer[];
  onSaveCustomer: (customer: Customer) => void;
}

export default function CustomerManager({
  customers,
  onSaveCustomer
}: CustomerManagerProps) {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);

  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form Fields
  const [formName, setFormName] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formNotes, setFormNotes] = useState("");

  // Focus search input automatically when open
  useEffect(() => {
    if (isSearchOpen) {
      const timer = setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isSearchOpen]);

  const resetForm = () => {
    setSelectedCustomer(null);
    setFormName("");
    setFormPhone("");
    setFormNotes("");
  };

  const handleEditCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    setFormName(customer.name);
    setFormPhone(customer.phoneNumber);
    setFormNotes(customer.notes);
    setIsModalOpen(true);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formPhone.trim()) {
      alert("Name and Phone number are required.");
      return;
    }

    const customerData: Customer = {
      id: selectedCustomer?.id || `cust-${Date.now()}`,
      shop_id: selectedCustomer?.shop_id || "shop-autogadget",
      name: formName,
      phoneNumber: formPhone,
      purchaseCount: selectedCustomer?.purchaseCount || 0,
      totalSpent: selectedCustomer?.totalSpent || 0,
      notes: formNotes
    };

    onSaveCustomer(customerData);
    setIsModalOpen(false);
    resetForm();
  };

  const filteredCustomers = customers.filter(c => {
    const q = searchQuery.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      c.phoneNumber.includes(q) ||
      c.notes.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6 animate-fade-in text-white" id="customer-manager-module">
      
      {/* Header with Search icon in top-right */}
      <div className="flex justify-between items-center animate-fade-in" id="cust-header">
        <div>
          <h1 className="text-3xl font-display font-black uppercase tracking-tight text-white">Buyer Register</h1>
          <p className="text-sm text-[#B7BCC7]">Track client history, repeat patronage, cumulative investments, and customized order notes.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setSearchQuery("");
              setIsSearchOpen(true);
            }}
            className="p-3 bg-[#1A1D24] border border-[#313640] hover:border-[#00C896]/50 text-zinc-400 hover:text-white rounded-xl transition-all cursor-pointer shadow-md"
            title="Search Buyers"
          >
            <Search className="w-5 h-5" />
          </button>
          <button
            onClick={() => {
              resetForm();
              setIsModalOpen(true);
            }}
            className="flex items-center gap-2 bg-[#00C896] text-[#0F1115] hover:bg-[#00b084] px-5 py-3 rounded-xl transition-all cursor-pointer font-bold font-display uppercase text-xs tracking-wider shadow-lg shadow-[#00C896]/10"
          >
            <Plus className="w-4 h-4 text-[#0F1115]" /> Add Buyer Profile
          </button>
        </div>
      </div>

      {/* Grid List of Buyers as Rounded Cards */}
      {customers.length === 0 ? (
        <div className="bg-[#1A1D24] border border-[#313640] rounded-[22px] py-16 text-center text-[#B7BCC7] shadow-sm">
          <Users className="w-12 h-12 text-[#313640] mx-auto mb-3" />
          <p className="font-display font-bold text-lg text-white">No buyer profiles found</p>
          <p className="text-sm text-[#B7BCC7] mt-1">Record a sale or add profiles to populate the register.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" id="cust-grid">
          {customers.map(customer => (
            <div 
              key={customer.id} 
              className="bg-[#1A1D24] border border-[#313640] rounded-[22px] p-5 shadow-lg hover:border-[#313640]/80 transition-all flex flex-col justify-between space-y-4 text-white"
              id={`customer-profile-${customer.id}`}
            >
              <div className="space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-display font-bold text-base text-white">{customer.name}</h3>
                    <p className="font-mono text-xs text-[#00C896] mt-0.5">{customer.phoneNumber}</p>
                  </div>
                  <span className="p-2 bg-[#232730] text-[#B7BCC7] rounded-xl border border-[#313640]/50">
                    <Users className="w-4 h-4" />
                  </span>
                </div>

                {/* Metrics */}
                <div className="grid grid-cols-2 gap-2 bg-[#232730] p-2.5 rounded-xl border border-[#313640]/40">
                  <div className="flex items-center gap-2">
                    <ShoppingBag className="w-3.5 h-3.5 text-[#B7BCC7]" />
                    <div>
                      <p className="text-[8px] font-mono text-[#B7BCC7] uppercase">Purchases</p>
                      <p className="font-mono text-xs font-bold text-white">{customer.purchaseCount} items</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-3.5 h-3.5 text-[#00C896]" />
                    <div>
                      <p className="text-[8px] font-mono text-[#B7BCC7] uppercase">Total spent</p>
                      <p className="font-mono text-xs font-black text-[#00C896]">₦{customer.totalSpent.toLocaleString()}</p>
                    </div>
                  </div>
                </div>

                {/* Notes block */}
                {customer.notes && (
                  <div className="text-xs text-[#B7BCC7] bg-[#232730]/60 p-3 rounded-xl border border-[#313640]/30">
                    <p className="font-bold text-[9px] uppercase text-[#B7BCC7] font-mono tracking-wider flex items-center gap-1">
                      <Clipboard className="w-3 h-3" /> Special Notes
                    </p>
                    <p className="mt-1 line-clamp-3 text-white/90">{customer.notes}</p>
                  </div>
                )}
              </div>

              {/* Action */}
              <button
                onClick={() => handleEditCustomer(customer)}
                className="w-full text-center bg-[#232730] hover:bg-[#313640] border border-[#313640] text-white py-2.5 rounded-xl text-xs font-bold font-display uppercase tracking-wider cursor-pointer transition-all"
              >
                Configure Profile Notes
              </button>
            </div>
          ))}
        </div>
      )}

      {/* GLOBAL SEARCH OVERLAY MODAL */}
      {isSearchOpen && (
        <div className="fixed inset-0 bg-black/95 z-50 flex flex-col p-6 overflow-y-auto animate-fade-in text-white">
          <div className="max-w-4xl mx-auto w-full space-y-6">
            
            {/* Search Input Box */}
            <div className="flex justify-between items-center border-b border-zinc-800 pb-4">
              <div className="relative flex-1 mr-4">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 text-[#00C896]" />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Type buyer's name, phone, special notes to search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-transparent pl-14 pr-4 py-4 text-xl text-white focus:outline-none placeholder-zinc-600 font-sans tracking-wide"
                />
              </div>
              <button
                onClick={() => setIsSearchOpen(false)}
                className="p-3 bg-[#1A1D24] hover:bg-[#232730] border border-[#313640] rounded-xl text-white transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Live Matches List */}
            <div className="space-y-4">
              <p className="text-xs font-mono font-bold text-zinc-500 uppercase tracking-widest">
                Search Results ({filteredCustomers.length} Matches)
              </p>

              {filteredCustomers.length === 0 ? (
                <div className="py-20 text-center text-zinc-500">
                  <Search className="w-12 h-12 text-zinc-700 mx-auto mb-3" />
                  <p className="font-display font-semibold text-zinc-400">No buyers match your search term</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredCustomers.map((customer) => (
                    <div 
                      key={customer.id} 
                      className="bg-[#1A1D24] border border-[#313640] rounded-[22px] p-5 flex flex-col justify-between gap-4 shadow-xl"
                    >
                      <div className="space-y-3">
                        <div>
                          <h4 className="font-display font-bold text-white text-base leading-snug">
                            {customer.name}
                          </h4>
                          <p className="font-mono text-xs text-[#00C896] mt-0.5">{customer.phoneNumber}</p>
                        </div>

                        {/* Metrics */}
                        <div className="grid grid-cols-2 gap-2 bg-[#232730] p-2.5 rounded-xl border border-[#313640]/40">
                          <div className="flex items-center gap-2">
                            <ShoppingBag className="w-3.5 h-3.5 text-[#B7BCC7]" />
                            <div>
                              <p className="text-[8px] font-mono text-[#B7BCC7] uppercase">Purchases</p>
                              <p className="font-mono text-xs font-bold text-white">{customer.purchaseCount} items</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <CreditCard className="w-3.5 h-3.5 text-[#00C896]" />
                            <div>
                              <p className="text-[8px] font-mono text-[#B7BCC7] uppercase">Spent</p>
                              <p className="font-mono text-xs font-black text-[#00C896]">₦{customer.totalSpent.toLocaleString()}</p>
                            </div>
                          </div>
                        </div>

                        {customer.notes && (
                          <div className="text-xs text-[#B7BCC7] bg-[#232730]/60 p-3 rounded-xl border border-[#313640]/30">
                            <p className="font-bold text-[9px] uppercase text-[#B7BCC7] font-mono tracking-wider">Notes</p>
                            <p className="mt-1 line-clamp-3 text-white/90">{customer.notes}</p>
                          </div>
                        )}
                      </div>

                      <button
                        onClick={() => {
                          handleEditCustomer(customer);
                          setIsSearchOpen(false);
                        }}
                        className="w-full text-center bg-[#232730] hover:bg-[#313640] border border-[#313640] text-white py-2 rounded-xl text-xs font-bold font-display uppercase tracking-wider cursor-pointer"
                      >
                        Edit Profile
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        </div>
      )}

      {/* CREATE / EDIT CUSTOMER DIALOG MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fade-in" id="customer-modal">
          <div className="bg-[#1A1D24] border border-[#313640] rounded-[22px] w-full max-w-md shadow-2xl animate-scale-up text-white overflow-hidden">
            
            <div className="p-5 border-b border-[#313640] flex justify-between items-center bg-[#232730]">
              <h3 className="font-display font-black text-xs uppercase tracking-wider text-white">
                {selectedCustomer ? "Configure Customer Notes" : "Register New Customer Profile"}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 hover:bg-[#313640] rounded-lg text-[#B7BCC7] hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="p-5 space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono font-bold text-[#B7BCC7] uppercase tracking-wider block">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Chukwuma Obi"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full px-3 py-2 bg-[#232730] border border-[#313640] rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-[#00C896] text-white"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-mono font-bold text-[#B7BCC7] uppercase tracking-wider block">
                  Phone Number
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. +234 803 111 2222"
                  value={formPhone}
                  onChange={(e) => setFormPhone(e.target.value)}
                  className="w-full px-3 py-2 bg-[#232730] border border-[#313640] rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-[#00C896] text-white font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-mono font-bold text-[#B7BCC7] uppercase tracking-wider block">
                  Business & Order Notes
                </label>
                <textarea
                  rows={4}
                  placeholder="Enter preferences, order history tags, credit remarks, etc."
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-[#232730] border border-[#313640] rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-[#00C896] text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-[#313640]/50">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-[#313640] text-[#B7BCC7] hover:bg-[#232730] hover:text-white rounded-xl text-xs font-bold font-display uppercase tracking-wider transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#00C896] text-[#0F1115] hover:bg-[#00b084] rounded-xl text-xs font-bold font-display uppercase tracking-wider flex items-center gap-1 transition-all"
                >
                  <Save className="w-3.5 h-3.5 text-[#0F1115]" /> Save Profile
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
}
