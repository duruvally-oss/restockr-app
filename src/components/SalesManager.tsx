import React, { useState, useRef, useEffect } from "react";
import { Product, Sale, Shop } from "../types";
import { 
  ShoppingCart, FileText, Eye, Search, X, Printer, Download, RefreshCw, AlertCircle, TrendingUp, Check, Layers, ArrowUpRight
} from "lucide-react";
import OfficialReceiptModal from "./OfficialReceiptModal";

interface SalesManagerProps {
  products: Product[];
  sales: Sale[];
  shop: Shop;
  onSaveSale: (sale: Sale) => void;
  onUndoSale: (saleId: string, performer: string) => void;
  onRequestNavigateToInventory?: () => void;
}

export default function SalesManager({
  products,
  sales,
  shop,
  onUndoSale,
  onRequestNavigateToInventory
}: SalesManagerProps) {
  // Global search modal state
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Receipt Modal State
  const [activeReceiptSale, setActiveReceiptSale] = useState<Sale | null>(null);

  // Confirmation state for transaction reversal
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: "",
    description: "",
    onConfirm: () => {}
  });

  const triggerDeleteConfirm = (itemType: string, confirmCallback: () => void, customDesc?: string) => {
    setConfirmModal({
      isOpen: true,
      title: "Undo/Reverse Confirmation",
      description: customDesc || `Are you sure you want to revert this ${itemType}?`,
      onConfirm: () => {
        confirmCallback();
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  // Focus search input automatically when open
  useEffect(() => {
    if (isSearchOpen) {
      const timer = setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isSearchOpen]);

  // Statistics calculation
  const activeSales = sales.filter(s => s.status !== "Reversed");
  const totalRevenue = activeSales.reduce((acc, s) => acc + s.totalAmount, 0);
  const totalDevicesSold = activeSales.reduce((acc, s) => acc + s.quantity, 0);
  
  const today = new Date().toDateString();
  const todaySales = activeSales.filter(s => new Date(s.createdAt).toDateString() === today);
  const todayRevenue = todaySales.reduce((acc, s) => acc + s.totalAmount, 0);

  // Filtered sales for the global search modal & main list view
  const filteredSales = sales.filter(s => {
    const q = searchQuery.toLowerCase();
    return (
      s.productName.toLowerCase().includes(q) ||
      s.customerName.toLowerCase().includes(q) ||
      s.customerPhone.includes(q) ||
      s.paymentMethod.toLowerCase().includes(q) ||
      s.id.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-8 animate-fade-in text-white p-1" id="sales-manager-module">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-2 border-b border-zinc-900" id="sales-header">
        <div>
          <span className="text-xs font-mono font-black tracking-widest text-zinc-500 uppercase">Sales Engine</span>
          <h1 className="text-4xl font-display font-black uppercase tracking-tight text-white mt-1">Sales</h1>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          {/* Top-Right Search Trigger (🔍) */}
          <button
            onClick={() => {
              setSearchQuery("");
              setIsSearchOpen(true);
            }}
            className="p-3 bg-[#1A1D24] border border-[#313640] hover:border-teal-500 text-zinc-400 hover:text-white rounded-xl transition-all cursor-pointer shadow-md shrink-0"
            title="Search Sales History"
          >
            <Search className="w-5 h-5" />
          </button>
          
          <button
            onClick={onRequestNavigateToInventory}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-white hover:bg-zinc-200 text-black px-5 py-3.5 rounded-xl font-bold font-display uppercase text-xs tracking-wider cursor-pointer shadow-lg transition-all"
          >
            <ShoppingCart className="w-4 h-4" /> Sell Product <ArrowUpRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Quick Statistics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-[#121212] border border-zinc-800 rounded-2xl p-5 shadow-lg space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono font-bold uppercase text-zinc-500 tracking-wider">Total Sales Revenue</span>
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-mono font-black text-white">₦{totalRevenue.toLocaleString()}</p>
          <p className="text-[9px] text-zinc-500">Accumulated gross transactions</p>
        </div>

        <div className="bg-[#121212] border border-zinc-800 rounded-2xl p-5 shadow-lg space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono font-bold uppercase text-zinc-500 tracking-wider">Today's Revenue</span>
            <Check className="w-4 h-4 text-teal-400" />
          </div>
          <p className="text-2xl font-mono font-black text-white">₦{todayRevenue.toLocaleString()}</p>
          <p className="text-[9px] text-zinc-500">Processed today: {new Date().toLocaleDateString()}</p>
        </div>

        <div className="bg-[#121212] border border-zinc-800 rounded-2xl p-5 shadow-lg space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono font-bold uppercase text-zinc-500 tracking-wider">Total Devices Sold</span>
            <Layers className="w-4 h-4 text-[#00C896]" />
          </div>
          <p className="text-2xl font-mono font-black text-white">{totalDevicesSold} Units</p>
          <p className="text-[9px] text-zinc-500">Item quantities cleared out of stock</p>
        </div>
      </div>

      {/* Simple CTA Banner */}
      <div className="bg-[#121212] border border-zinc-800 rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="space-y-1 text-center md:text-left">
          <h3 className="font-display font-black text-white uppercase text-sm tracking-wider">Ready to make a new sale?</h3>
          <p className="text-xs text-zinc-400">All transactions are initialized directly from product profiles inside Inventory.</p>
        </div>
        <button
          onClick={onRequestNavigateToInventory}
          className="w-full md:w-auto px-6 py-3.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 text-white font-bold font-display uppercase text-xs tracking-widest rounded-xl transition-all cursor-pointer shadow-md flex items-center justify-center gap-2"
        >
          Open Stock Inventory <ArrowUpRight className="w-4 h-4" />
        </button>
      </div>

      {/* Sales History Section */}
      <div className="space-y-4">
        <div className="flex justify-between items-center px-1">
          <h2 className="text-lg font-display font-black text-white uppercase tracking-wider flex items-center gap-2">
            <FileText className="w-5 h-5 text-zinc-400" />
            Sales Ledger History
          </h2>
          {sales.length > 0 && (
            <span className="text-[10px] font-mono font-bold text-zinc-500 uppercase">
              Showing {filteredSales.length} of {sales.length} records
            </span>
          )}
        </div>

        {sales.length === 0 ? (
          <div className="bg-[#121212] border border-zinc-800 rounded-2xl p-16 text-center text-white space-y-4">
            <div className="w-12 h-12 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mx-auto text-zinc-400">
              <ShoppingCart className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="font-display font-black text-white uppercase text-sm">No transactions registered yet</h3>
              <p className="text-xs text-zinc-400">Sell a product directly from the active inventory list to begin logging records.</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {filteredSales.map((sale) => (
              <div 
                key={sale.id} 
                className="bg-[#121212] border border-zinc-800 hover:border-zinc-750 rounded-2xl p-5 transition-all flex flex-col md:flex-row justify-between items-start md:items-center gap-4 text-white shadow-md"
              >
                <div className="space-y-1.5 flex-1 w-full">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs text-[#00C896] font-bold tracking-wider">{sale.id}</span>
                    <span className="text-[9px] bg-zinc-900 text-zinc-400 border border-zinc-800 px-2 py-0.5 rounded font-mono font-bold uppercase tracking-wide">
                      Agent: {sale.soldBy}
                    </span>
                  </div>
                  <h4 className="font-display font-black text-white text-lg tracking-tight">
                    {sale.productName} <span className="text-xs text-zinc-400 font-normal">x{sale.quantity}</span>
                  </h4>
                  <p className="text-xs text-zinc-400 font-medium">
                    Customer: <span className="text-white font-semibold">{sale.customerName}</span> • <span className="font-mono text-[11px] text-zinc-300">{sale.customerPhone}</span>
                  </p>
                  <p className="text-[10px] text-zinc-500 font-mono">
                    Date: {new Date(sale.createdAt).toLocaleString("en-NG", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>

                <div className="flex md:flex-col justify-between md:justify-center items-center md:items-end w-full md:w-auto pt-3 md:pt-0 border-t md:border-t-0 border-zinc-850 gap-3">
                  <div className="text-right">
                    <p className="font-mono font-black text-white text-xl">₦{sale.totalAmount.toLocaleString()}</p>
                    {sale.status === "Reversed" ? (
                      <span className="inline-block font-sans text-[8px] bg-rose-500/10 text-rose-400 border border-rose-500/20 px-2 py-0.5 rounded-md font-black uppercase tracking-wider mt-1">
                        REVERSED
                      </span>
                    ) : (
                      <span className="inline-block font-sans text-[8px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-md font-black uppercase tracking-wider mt-1">
                        {sale.paymentMethod}
                      </span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setActiveReceiptSale(sale)}
                      className="p-3 bg-zinc-900 hover:bg-zinc-800 border border-zinc-850 hover:border-zinc-700 text-white rounded-xl transition-all cursor-pointer flex items-center justify-center shadow-md"
                      title="View Receipt"
                    >
                      <Eye className="w-4 h-4 text-[#00C896]" />
                    </button>
                    <button
                      disabled={sale.status === "Reversed" || (() => {
                        const saleDate = new Date(sale.createdAt);
                        const now = new Date();
                        const diffTime = Math.abs(now.getTime() - saleDate.getTime());
                        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                        return diffDays > 30;
                      })()}
                      onClick={() => {
                        triggerDeleteConfirm("Transaction", () => {
                          onUndoSale(sale.id, "Owner");
                        }, `Are you sure you want to REVERSE / UNDO sale transaction ${sale.id}? This will immediately restore 1 unit back to stock inventory and log a reversal audit event.`);
                      }}
                      className={`p-3 rounded-xl transition-all flex items-center justify-center shadow-md ${
                        sale.status === "Reversed" || (() => {
                          const saleDate = new Date(sale.createdAt);
                          const now = new Date();
                          const diffTime = Math.abs(now.getTime() - saleDate.getTime());
                          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                          return diffDays > 30;
                        })()
                          ? "bg-zinc-950 border border-zinc-900 text-zinc-600 cursor-not-allowed opacity-40"
                          : "bg-zinc-900 hover:bg-rose-950/20 border border-zinc-850 hover:border-rose-900/50 text-rose-400 cursor-pointer"
                      }`}
                      title={
                        sale.status === "Reversed"
                          ? "This sale has been reversed"
                          : (() => {
                              const saleDate = new Date(sale.createdAt);
                              const now = new Date();
                              const diffTime = Math.abs(now.getTime() - saleDate.getTime());
                              const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                              return diffDays > 30;
                            })()
                          ? "Sale is over 30 days old and cannot be reversed"
                          : "Reverse Sale"
                      }
                    >
                      <RefreshCw className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* GLOBAL SEARCH OVERLAY MODAL */}
      {isSearchOpen && (
        <div className="fixed inset-0 bg-black/95 z-50 flex flex-col p-6 overflow-y-auto animate-fade-in text-white">
          <div className="max-w-4xl mx-auto w-full space-y-6">
            
            {/* Search Input Box */}
            <div className="flex justify-between items-center border-b border-zinc-800 pb-4">
              <div className="relative flex-1 mr-4">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 text-teal-400" />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Type customer name, phone, product specs, or Receipt ID to search..."
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
                Search Results ({filteredSales.length} Matches)
              </p>

              {filteredSales.length === 0 ? (
                <div className="py-20 text-center text-zinc-500">
                  <Search className="w-12 h-12 text-zinc-700 mx-auto mb-3" />
                  <p className="font-display font-semibold text-zinc-400">No transactions match your search term</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredSales.map((sale) => (
                    <div 
                      key={sale.id} 
                      className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 flex flex-col justify-between gap-4 shadow-xl text-white"
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-xs text-[#00C896] font-bold">{sale.id}</span>
                          <span className="text-[10px] text-zinc-500 font-mono">
                            {new Date(sale.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <h4 className="font-display font-black text-white text-base">
                          {sale.productName} <span className="text-xs text-zinc-400">x{sale.quantity}</span>
                        </h4>
                        <p className="text-xs text-zinc-400">
                          Buyer: <span className="font-semibold text-white">{sale.customerName}</span> ({sale.customerPhone})
                        </p>
                      </div>

                      <div className="flex justify-between items-center border-t border-zinc-800 pt-3">
                        <div className="font-mono font-bold text-lg text-white">₦{sale.totalAmount.toLocaleString()}</div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              setActiveReceiptSale(sale);
                              setIsSearchOpen(false); // Close search to focus receipt
                            }}
                            className="px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg transition-colors cursor-pointer text-xs flex items-center gap-1.5 font-bold uppercase tracking-wider font-display"
                          >
                            <Eye className="w-3.5 h-3.5 text-teal-400" /> View
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        </div>
      )}

      {/* OFFICIAL CENTRALIZED THERMAL RECEIPT MODAL */}
      <OfficialReceiptModal
        sale={activeReceiptSale}
        onClose={() => setActiveReceiptSale(null)}
        shop={shop}
        products={products}
      />

      {/* Reversal Alert Confirm Modal */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 z-[250] flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-[#121212] border-2 border-zinc-800 rounded-[20px] p-6 shadow-2xl animate-scale-up space-y-6">
            <div className="flex items-start gap-4 text-white">
              <div className="p-3 bg-rose-950/50 border border-rose-900/50 rounded-xl text-rose-500 shrink-0">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-black font-display text-white uppercase tracking-wider">{confirmModal.title}</h3>
                <p className="text-sm text-zinc-400 leading-relaxed">{confirmModal.description}</p>
              </div>
            </div>
            
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                className="px-5 py-3 bg-[#1A1A1A] border border-zinc-800 hover:bg-zinc-800 hover:text-white rounded-xl text-xs font-bold uppercase tracking-wider text-zinc-400 cursor-pointer transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmModal.onConfirm}
                className="px-5 py-3 bg-[#00C896] text-[#0F1115] hover:bg-[#00b084] rounded-xl text-xs font-bold uppercase tracking-wider cursor-pointer transition-colors"
              >
                Confirm Reversal
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
