import React, { useState, useRef, useEffect } from "react";
import { Product, Sale } from "../types";
import { 
  FileText, Download, Printer, Package, Search, X, TrendingUp, CircleDollarSign, 
  AlertTriangle, Layers, Calendar, ArrowUpRight, ShoppingBag, Activity, BarChart3,
  CheckCircle2, ArrowDownRight, Tag, ShieldCheck, Filter
} from "lucide-react";
import QuickTagsBadgeList from "./QuickTagsBadgeList";

interface ReportsManagerProps {
  products: Product[];
  sales: Sale[];
}

export default function ReportsManager({
  products,
  sales
}: ReportsManagerProps) {
  const [reportType, setReportType] = useState<"inventory" | "sales">("inventory");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Focus search input automatically when open
  useEffect(() => {
    if (isSearchOpen) {
      const timer = setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isSearchOpen]);

  // Key Statistics Calculations (100% intact calculations)
  const totalStockValue = products.reduce((acc, p) => acc + (p.sellingPrice * p.quantity), 0);
  const totalStockUnits = products.reduce((acc, p) => acc + p.quantity, 0);
  const outOfStockCount = products.filter(p => p.quantity === 0).length;
  const inStockLinesCount = products.filter(p => p.quantity > 0).length;
  const stockHealthPercent = products.length > 0 
    ? Math.round((inStockLinesCount / products.length) * 100) 
    : 100;

  const activeSales = sales.filter(s => s.status !== "Reversed");
  const reversedSalesCount = sales.filter(s => s.status === "Reversed").length;
  const totalRevenue = activeSales.reduce((acc, s) => acc + s.totalAmount, 0);
  const totalUnitsSold = activeSales.reduce((acc, s) => acc + s.quantity, 0);
  const avgTransactionValue = activeSales.length > 0 ? Math.round(totalRevenue / activeSales.length) : 0;

  // Export CSV Handler (Preserving exact logic and columns)
  const handleExportCSV = () => {
    let headers = [];
    let rows = [];
    let fileName = "";

    if (reportType === "inventory") {
      headers = ["ID", "Category", "Brand", "Model", "Storage", "Quantity", "Price (NGN)", "Battery", "Warranty", "Condition"];
      rows = products.map(p => [
        p.id,
        p.category,
        p.brand,
        p.model,
        p.storage,
        p.quantity,
        p.sellingPrice,
        p.batteryHealth || "N/A",
        p.warranty,
        p.condition.join(" | ")
      ]);
      fileName = `Restockr_Inventory_Report_${new Date().toISOString().split("T")[0]}.csv`;
    } else {
      headers = ["ID", "Product Name", "Quantity", "Price (NGN)", "Total (NGN)", "Payment Method", "Customer Name", "Customer Phone", "Cashier", "Date"];
      rows = sales.map(s => [
        s.id,
        s.productName,
        s.quantity,
        s.unitPrice,
        s.totalAmount,
        s.paymentMethod,
        s.customerName,
        s.customerPhone,
        s.soldBy,
        new Date(s.createdAt).toLocaleDateString()
      ]);
      fileName = `Restockr_Sales_Report_${new Date().toISOString().split("T")[0]}.csv`;
    }

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(","), ...rows.map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(","))].join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportPDF = () => {
    window.print();
  };

  const filteredProducts = products.filter(p => {
    const q = searchQuery.toLowerCase();
    return (
      p.model.toLowerCase().includes(q) ||
      p.brand.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q) ||
      p.storage.toLowerCase().includes(q)
    );
  });

  const filteredSales = sales.filter(s => {
    const q = searchQuery.toLowerCase();
    return (
      s.productName.toLowerCase().includes(q) ||
      s.customerName.toLowerCase().includes(q) ||
      s.customerPhone.includes(q) ||
      s.paymentMethod.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-8 animate-fade-in text-white p-1" id="reports-manager-module">
      
      {/* Top Header & Actions Deck */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-zinc-800/80">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse"></span>
            <span className="text-[10px] font-mono font-black tracking-widest text-zinc-400 uppercase">
              Financial & Inventory Analytics
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-display font-black uppercase tracking-tight text-white mt-1 flex items-center gap-3">
            Reports <BarChart3 className="w-7 h-7 text-teal-400 hidden sm:inline-block" />
          </h1>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <button
            onClick={() => {
              setSearchQuery("");
              setIsSearchOpen(true);
            }}
            className="p-3.5 bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-white rounded-xl transition-all cursor-pointer shadow-md shrink-0 flex items-center justify-center"
            title="Search Ledger Entries"
            id="btn-report-search-trigger"
          >
            <Search className="w-5 h-5" />
          </button>
          
          <button
            onClick={handleExportCSV}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-white px-4 sm:px-5 py-3.5 rounded-xl font-bold font-display uppercase text-xs tracking-wider cursor-pointer shadow-sm transition-all"
            id="btn-report-export-csv"
          >
            <Download className="w-4 h-4 text-teal-400" /> Export CSV
          </button>

          <button
            onClick={handleExportPDF}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-white hover:bg-zinc-200 text-black px-4 sm:px-5 py-3.5 rounded-xl font-bold font-display uppercase text-xs tracking-wider cursor-pointer shadow-lg transition-all"
            id="btn-report-print-ledger"
          >
            <Printer className="w-4 h-4" /> Print Ledger
          </button>
        </div>
      </div>

      {/* Modern High-Impact Summary Metric Deck */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" id="report-stats-grid">
        
        {/* Metric 1: Inventory Value */}
        <div className="bg-gradient-to-br from-[#0F1E17] via-[#121212] to-[#0A140F] border border-emerald-500/25 rounded-2xl p-5 shadow-xl hover:border-emerald-500/40 transition-all space-y-3 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl group-hover:bg-emerald-500/10 transition-all pointer-events-none" />
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono font-bold uppercase text-zinc-400 tracking-wider flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span> Inventory Value
            </span>
            <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <CircleDollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="space-y-0.5">
            <p className="text-2xl sm:text-3xl font-mono font-black text-white tracking-tight">
              ₦{totalStockValue.toLocaleString()}
            </p>
            <p className="text-[10px] text-zinc-400 font-mono">
              Asset cost across all lines
            </p>
          </div>
          <div className="pt-2 border-t border-emerald-500/10 flex items-center justify-between text-[10px] text-emerald-400/90 font-mono">
            <span>{totalStockUnits} Total Units</span>
            <span className="text-zinc-500">{products.length} Lines</span>
          </div>
        </div>

        {/* Metric 2: Total Revenue */}
        <div className="bg-gradient-to-br from-[#0E1E28] via-[#121212] to-[#0A141A] border border-teal-500/25 rounded-2xl p-5 shadow-xl hover:border-teal-500/40 transition-all space-y-3 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-teal-500/5 rounded-full blur-2xl group-hover:bg-teal-500/10 transition-all pointer-events-none" />
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono font-bold uppercase text-zinc-400 tracking-wider flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-teal-400"></span> Total Revenue
            </span>
            <div className="p-2 rounded-xl bg-teal-500/10 border border-teal-500/20 text-teal-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="space-y-0.5">
            <p className="text-2xl sm:text-3xl font-mono font-black text-white tracking-tight">
              ₦{totalRevenue.toLocaleString()}
            </p>
            <p className="text-[10px] text-zinc-400 font-mono">
              Gross sales earnings
            </p>
          </div>
          <div className="pt-2 border-t border-teal-500/10 flex items-center justify-between text-[10px] text-teal-400/90 font-mono">
            <span className="flex items-center gap-0.5">
              <ArrowUpRight className="w-3 h-3 text-teal-400" /> Avg: ₦{avgTransactionValue.toLocaleString()}
            </span>
            <span className="text-zinc-500">{activeSales.length} Transactions</span>
          </div>
        </div>

        {/* Metric 3: Stock Health */}
        <div className="bg-gradient-to-br from-[#221B10] via-[#121212] to-[#15110A] border border-amber-500/25 rounded-2xl p-5 shadow-xl hover:border-amber-500/40 transition-all space-y-3 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full blur-2xl group-hover:bg-amber-500/10 transition-all pointer-events-none" />
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono font-bold uppercase text-zinc-400 tracking-wider flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span> Stock Health
            </span>
            <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="space-y-0.5">
            <div className="flex items-baseline gap-2">
              <p className="text-2xl sm:text-3xl font-mono font-black text-white tracking-tight">
                {stockHealthPercent}%
              </p>
              <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${
                outOfStockCount === 0 
                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" 
                  : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
              }`}>
                {outOfStockCount === 0 ? "Optimal" : `${outOfStockCount} Out`}
              </span>
            </div>
            <p className="text-[10px] text-zinc-400 font-mono">
              In-stock ratio across catalog
            </p>
          </div>
          {/* Health Bar Visual Indicator */}
          <div className="space-y-1 pt-1">
            <div className="w-full bg-zinc-800/80 rounded-full h-1.5 overflow-hidden">
              <div 
                className={`h-full transition-all ${
                  stockHealthPercent >= 80 ? "bg-emerald-400" : stockHealthPercent >= 50 ? "bg-amber-400" : "bg-rose-500"
                }`}
                style={{ width: `${stockHealthPercent}%` }}
              />
            </div>
            <div className="flex justify-between text-[9px] font-mono text-zinc-500">
              <span>{inStockLinesCount} Available</span>
              <span>{products.length} Total Lines</span>
            </div>
          </div>
        </div>

        {/* Metric 4: Volume Sold */}
        <div className="bg-gradient-to-br from-[#1C132B] via-[#121212] to-[#110C1C] border border-purple-500/25 rounded-2xl p-5 shadow-xl hover:border-purple-500/40 transition-all space-y-3 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/5 rounded-full blur-2xl group-hover:bg-purple-500/10 transition-all pointer-events-none" />
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono font-bold uppercase text-zinc-400 tracking-wider flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-purple-400"></span> Volume Sold
            </span>
            <div className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <div className="space-y-0.5">
            <p className="text-2xl sm:text-3xl font-mono font-black text-white tracking-tight">
              {totalUnitsSold} <span className="text-xs font-normal text-zinc-400 uppercase font-sans">Units</span>
            </p>
            <p className="text-[10px] text-zinc-400 font-mono">
              Total units processed in sales
            </p>
          </div>
          <div className="pt-2 border-t border-purple-500/10 flex items-center justify-between text-[10px] text-purple-300 font-mono">
            <span>{activeSales.length} Active Sales</span>
            {reversedSalesCount > 0 && (
              <span className="text-rose-400">{reversedSalesCount} Reversed</span>
            )}
          </div>
        </div>

      </div>

      {/* Directory Tab Selector */}
      <div className="bg-[#121212] border border-zinc-800 p-2 rounded-2xl flex flex-col sm:flex-row gap-2 shadow-xl" id="report-type-grid">
        <button
          onClick={() => {
            setReportType("inventory");
            setSearchQuery("");
          }}
          className={`flex-1 p-4 rounded-xl flex items-center justify-between transition-all cursor-pointer text-left ${
            reportType === "inventory"
              ? "bg-zinc-900 border border-zinc-700 text-white shadow-lg"
              : "bg-transparent text-zinc-400 hover:text-white hover:bg-zinc-950/50"
          }`}
          id="tab-report-inventory"
        >
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-lg ${reportType === "inventory" ? "bg-teal-500/10 text-teal-400 border border-teal-500/20" : "bg-zinc-800 text-zinc-500"}`}>
              <Package className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-display font-black text-xs uppercase tracking-wider text-white">Stock Ledger Directory</h3>
              <p className="text-[10px] text-zinc-400 font-mono mt-0.5">
                {products.length} Products • {totalStockUnits} Units In Stock
              </p>
            </div>
          </div>
          {reportType === "inventory" && (
            <span className="hidden md:inline-block px-2.5 py-1 bg-teal-500/10 text-teal-400 border border-teal-500/20 rounded-md text-[10px] font-mono font-bold uppercase">
              Active Selection
            </span>
          )}
        </button>

        <button
          onClick={() => {
            setReportType("sales");
            setSearchQuery("");
          }}
          className={`flex-1 p-4 rounded-xl flex items-center justify-between transition-all cursor-pointer text-left ${
            reportType === "sales"
              ? "bg-zinc-900 border border-zinc-700 text-white shadow-lg"
              : "bg-transparent text-zinc-400 hover:text-white hover:bg-zinc-950/50"
          }`}
          id="tab-report-sales"
        >
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-lg ${reportType === "sales" ? "bg-teal-500/10 text-teal-400 border border-teal-500/20" : "bg-zinc-800 text-zinc-500"}`}>
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-display font-black text-xs uppercase tracking-wider text-white">Sales Ledger Directory</h3>
              <p className="text-[10px] text-zinc-400 font-mono mt-0.5">
                {sales.length} Transactions Recorded • {totalUnitsSold} Units Sold
              </p>
            </div>
          </div>
          {reportType === "sales" && (
            <span className="hidden md:inline-block px-2.5 py-1 bg-teal-500/10 text-teal-400 border border-teal-500/20 rounded-md text-[10px] font-mono font-bold uppercase">
              Active Selection
            </span>
          )}
        </button>
      </div>

      {/* Directory Table / Cards Container */}
      <div className="space-y-4" id="report-details-container">
        
        <div className="flex items-center justify-between px-1">
          <h3 className="text-xs font-display font-black text-zinc-400 uppercase tracking-widest flex items-center gap-2">
            <Activity className="w-4 h-4 text-teal-400" />
            {reportType === "inventory" ? "Active Inventory Directory" : "Historical Sales Directory"}
          </h3>
          <span className="text-[10px] font-mono text-zinc-500">
            Showing {reportType === "inventory" ? products.length : sales.length} total entries
          </span>
        </div>

        {/* Stock Ledger View */}
        {reportType === "inventory" && (
          products.length === 0 ? (
            <div className="bg-[#121212] border border-zinc-800 rounded-2xl p-12 text-center space-y-3">
              <Package className="w-12 h-12 text-zinc-700 mx-auto" />
              <p className="text-zinc-400 text-xs font-bold uppercase tracking-wider">No products available in inventory database</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {products.map(p => (
                <div 
                  key={p.id} 
                  className="bg-[#121212] border border-zinc-800 hover:border-zinc-700 rounded-2xl p-5 transition-all shadow-md flex flex-col justify-between space-y-4 group"
                >
                  <div className="space-y-3">
                    <div className="flex justify-between items-start gap-2">
                      <div className="space-y-1">
                        <span className="text-[9px] bg-zinc-950 text-zinc-400 border border-zinc-800 px-2 py-0.5 rounded font-mono font-bold uppercase tracking-wider">
                          {p.category}
                        </span>
                        <h4 className="font-display font-black text-white text-lg tracking-tight">{p.brand} {p.model}</h4>
                        <p className="text-xs text-zinc-400 font-mono">Storage Spec: <span className="text-teal-400 font-bold">{p.storage}</span></p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="font-mono font-black text-white text-xl">₦{p.sellingPrice.toLocaleString()}</p>
                        <p className="text-[10px] text-zinc-400 font-mono mt-0.5">Warranty: {p.warranty}</p>
                      </div>
                    </div>

                    <QuickTagsBadgeList 
                      tags={p.condition} 
                      batteryHealth={p.batteryHealth} 
                      variant="dark" 
                      className="pt-1"
                    />
                  </div>

                  <div className="flex justify-between items-center border-t border-zinc-800/80 pt-3">
                    <span className="text-[10px] text-zinc-500 font-mono">ID: {p.id}</span>
                    <span className={`text-xs font-mono font-bold px-2.5 py-1 rounded-md border ${
                      p.quantity === 0 
                        ? "bg-rose-500/10 text-rose-400 border-rose-500/20" 
                        : "bg-teal-500/10 text-teal-400 border-teal-500/20"
                    }`}>
                      {p.quantity === 0 ? "SOLD OUT" : `In Stock: ${p.quantity} Units`}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )
        )}

        {/* Sales Ledger View */}
        {reportType === "sales" && (
          sales.length === 0 ? (
            <div className="bg-[#121212] border border-zinc-800 rounded-2xl p-12 text-center space-y-3">
              <FileText className="w-12 h-12 text-zinc-700 mx-auto" />
              <p className="text-zinc-400 text-xs font-bold uppercase tracking-wider">No sales transactions recorded yet</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {sales.map(s => (
                <div 
                  key={s.id} 
                  className="bg-[#121212] border border-zinc-800 hover:border-zinc-700 rounded-2xl p-5 transition-all shadow-md flex flex-col justify-between space-y-4 group"
                >
                  <div className="space-y-3">
                    <div className="flex justify-between items-start gap-2">
                      <div className="space-y-1">
                        <span className="text-[9px] bg-zinc-950 text-teal-400 border border-zinc-800 px-2 py-0.5 rounded font-mono font-bold">
                          {s.id.slice(0, 8).toUpperCase()}
                        </span>
                        <h4 className="font-display font-black text-white text-lg tracking-tight">{s.productName}</h4>
                        <p className="text-xs text-zinc-400 font-mono">Quantity Sold: <span className="font-bold text-white">{s.quantity}</span></p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="font-mono font-black text-white text-xl">₦{s.totalAmount.toLocaleString()}</p>
                        {s.status === "Reversed" ? (
                          <span className="text-[9px] bg-rose-500/10 text-rose-400 border border-rose-500/20 px-2 py-0.5 rounded font-bold uppercase">
                            Reversed
                          </span>
                        ) : (
                          <span className="text-[9px] bg-teal-500/10 text-teal-400 border border-teal-500/20 px-2 py-0.5 rounded font-bold uppercase">
                            {s.paymentMethod}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="bg-zinc-950/80 p-3 rounded-xl border border-zinc-850 text-xs space-y-0.5">
                      <p className="text-zinc-400">Buyer: <span className="font-bold text-white">{s.customerName}</span></p>
                      <p className="text-zinc-500 font-mono text-[10px]">Phone: {s.customerPhone}</p>
                    </div>
                  </div>

                  <div className="flex justify-between items-center border-t border-zinc-800/80 pt-3 text-[10px] text-zinc-500 font-mono">
                    <span>Cashier: <strong className="text-zinc-300 uppercase">{s.soldBy}</strong></span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-teal-400" /> {new Date(s.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )
        )}

      </div>

      {/* Global Search Overlay Modal */}
      {isSearchOpen && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-md z-[100] flex flex-col p-4 sm:p-6 overflow-y-auto animate-fade-in text-white">
          <div className="max-w-4xl mx-auto w-full space-y-6 my-auto">
            
            <div className="flex justify-between items-center border-b border-zinc-800 pb-4">
              <div className="relative flex-1 mr-4">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 text-teal-400" />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Type model, brand, spec, or customer name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-transparent pl-14 pr-4 py-4 text-lg sm:text-xl text-white focus:outline-none placeholder-zinc-600 font-sans tracking-wide"
                />
              </div>
              <button
                onClick={() => setIsSearchOpen(false)}
                className="p-3 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-xl text-white transition-all cursor-pointer"
                title="Close Search Modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs font-mono font-bold text-zinc-400 uppercase tracking-widest">
                <span>Search Results ({reportType === "inventory" ? filteredProducts.length : filteredSales.length} Matches)</span>
                <span>Filtered on {reportType === "inventory" ? "Stock Ledger" : "Sales Ledger"}</span>
              </div>

              {reportType === "inventory" && (
                filteredProducts.length === 0 ? (
                  <div className="py-20 text-center text-zinc-500 space-y-2">
                    <Search className="w-10 h-10 text-zinc-700 mx-auto" />
                    <p className="font-display font-semibold text-zinc-400 text-sm">No stock products match your search query</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredProducts.map((p) => (
                      <div 
                        key={p.id} 
                        className="bg-[#121212] border border-zinc-800 rounded-2xl p-5 flex flex-col justify-between gap-4 shadow-xl text-white"
                      >
                        <div>
                          <span className="text-[9px] bg-zinc-950 text-zinc-400 border border-zinc-800 px-2 py-0.5 rounded font-mono font-bold uppercase">
                            {p.category}
                          </span>
                          <h4 className="font-display font-black text-white text-base mt-1">{p.brand} {p.model}</h4>
                          <p className="text-xs text-zinc-400 font-mono mt-0.5">Storage Spec: {p.storage}</p>
                          <p className="text-xs text-zinc-400 font-mono mt-0.5">Warranty: {p.warranty}</p>
                        </div>

                        <div className="flex justify-between items-center border-t border-zinc-850 pt-3">
                          <span className="font-mono font-bold text-lg text-teal-400">₦{p.sellingPrice.toLocaleString()}</span>
                          <span className="text-xs text-zinc-400 font-mono font-bold">Qty: {p.quantity}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )
              )}

              {reportType === "sales" && (
                filteredSales.length === 0 ? (
                  <div className="py-20 text-center text-zinc-500 space-y-2">
                    <Search className="w-10 h-10 text-zinc-700 mx-auto" />
                    <p className="font-display font-semibold text-zinc-400 text-sm">No sales transactions match your search query</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredSales.map((s) => (
                      <div 
                        key={s.id} 
                        className="bg-[#121212] border border-zinc-800 rounded-2xl p-5 flex flex-col justify-between gap-4 shadow-xl text-white"
                      >
                        <div>
                          <span className="text-[9px] bg-zinc-950 text-teal-400 border border-zinc-800 px-2 py-0.5 rounded font-mono font-bold">
                            {s.id.slice(0, 8).toUpperCase()}
                          </span>
                          <h4 className="font-display font-black text-white text-base mt-1">{s.productName}</h4>
                          <p className="text-xs text-zinc-400 font-mono mt-0.5">Buyer: <span className="text-white font-semibold">{s.customerName}</span> ({s.customerPhone})</p>
                        </div>

                        <div className="flex justify-between items-center border-t border-zinc-850 pt-3">
                          <span className="font-mono font-bold text-lg text-white">₦{s.totalAmount.toLocaleString()}</span>
                          <span className="text-xs text-zinc-400 font-mono">{new Date(s.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )
              )}
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
