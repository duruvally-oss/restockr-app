import { Product, Sale, Staff } from "../types";
import { Plus, ShoppingCart, Package, Users, ArrowRight, Bell, Sparkles, TrendingUp, Layers, ShieldCheck } from "lucide-react";

interface DashboardOverviewProps {
  products: Product[];
  sales: Sale[];
  staff: Staff[];
  unreadNotificationsCount: number;
  onNavigate: (module: string) => void;
  onQuickAction: (action: "add_product" | "sell_product" | "update_condition") => void;
}

export default function DashboardOverview({
  products,
  sales,
  staff,
  unreadNotificationsCount,
  onNavigate,
  onQuickAction
}: DashboardOverviewProps) {
  // Statistics Calculations
  const totalProducts = products.length; // Count of unique product entries
  const totalAvailableStock = products.reduce((acc, p) => acc + p.quantity, 0); // Total sum of quantities

  // Today's Date representation
  const todayStr = new Date().toISOString().split("T")[0];
  
  // Today's Sales Amount (Naira sum)
  const todaySalesAmount = sales
    .filter(s => s.createdAt.startsWith(todayStr) && s.status !== "Reversed")
    .reduce((acc, s) => acc + s.totalAmount, 0);

  // Today's Sales Quantity (Units sold count)
  const todaySalesCount = sales
    .filter(s => s.createdAt.startsWith(todayStr) && s.status !== "Reversed")
    .reduce((acc, s) => acc + s.quantity, 0);

  // Recent lists
  const recentProducts = [...products]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 4);

  const recentSales = sales
    .filter(s => s.status !== "Reversed")
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 4);

  return (
    <div className="space-y-12 animate-fade-in text-white" id="dashboard-overview-module">
      
      {/* 1. Quick Actions Section - Soft rounded corners, darker silver cards, clean spacing */}
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-6 bg-teal-500 rounded-full" />
          <h2 className="text-sm font-black text-zinc-400 uppercase tracking-widest font-display" id="qa-header">
            Quick Actions
          </h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6" id="qa-grid">
          
          {/* Action 1: Add Product */}
          <button
            onClick={() => onQuickAction("add_product")}
            id="qa-btn-add-product"
            className="flex flex-col items-center justify-center p-6 bg-[#1B1B1B] hover:bg-zinc-800/40 border border-[#2A2A2A] hover:border-teal-500/50 text-white rounded-[16px] transition-all duration-300 cursor-pointer text-center group shadow-lg"
          >
            <div className="p-3 bg-gradient-to-b from-[#565656] to-[#3A3A3A] border border-[#555555] rounded-xl mb-4 group-hover:scale-105 transition-all duration-300 text-white shadow-md">
              <Plus className="w-5 h-5" />
            </div>
            <span className="font-display font-black text-xs tracking-wider uppercase">Add Product</span>
            <span className="text-[10px] text-zinc-500 mt-1 font-mono">New Stock Intake</span>
          </button>

          {/* Action 2: Sell Product */}
          <button
            onClick={() => onQuickAction("sell_product")}
            id="qa-btn-sell-product"
            className="flex flex-col items-center justify-center p-6 bg-[#1B1B1B] hover:bg-zinc-800/40 border border-[#2A2A2A] hover:border-teal-500/50 text-white rounded-[16px] transition-all duration-300 cursor-pointer text-center group shadow-lg"
          >
            <div className="p-3 bg-gradient-to-b from-[#565656] to-[#3A3A3A] border border-[#555555] rounded-xl mb-4 group-hover:scale-105 transition-all duration-300 text-white shadow-md">
              <ShoppingCart className="w-5 h-5" />
            </div>
            <span className="font-display font-black text-xs tracking-wider uppercase">Sell Device</span>
            <span className="text-[10px] text-zinc-500 mt-1 font-mono">Record Sale</span>
          </button>

          {/* Action 3: Inventory */}
          <button
            onClick={() => onNavigate("inventory")}
            id="qa-btn-inventory"
            className="flex flex-col items-center justify-center p-6 bg-[#1B1B1B] hover:bg-zinc-800/40 border border-[#2A2A2A] hover:border-teal-500/50 text-white rounded-[16px] transition-all duration-300 cursor-pointer text-center group shadow-lg"
          >
            <div className="p-3 bg-gradient-to-b from-[#565656] to-[#3A3A3A] border border-[#555555] rounded-xl mb-4 group-hover:scale-105 transition-all duration-300 text-white shadow-md">
              <Package className="w-5 h-5" />
            </div>
            <span className="font-display font-black text-xs tracking-wider uppercase">Inventory</span>
            <span className="text-[10px] text-zinc-500 mt-1 font-mono">Stock Ledger</span>
          </button>

          {/* Action 4: Customers */}
          <button
            onClick={() => onNavigate("customers")}
            id="qa-btn-customers"
            className="flex flex-col items-center justify-center p-6 bg-[#1B1B1B] hover:bg-zinc-800/40 border border-[#2A2A2A] hover:border-teal-500/50 text-white rounded-[16px] transition-all duration-300 cursor-pointer text-center group shadow-lg"
          >
            <div className="p-3 bg-gradient-to-b from-[#565656] to-[#3A3A3A] border border-[#555555] rounded-xl mb-4 group-hover:scale-105 transition-all duration-300 text-white shadow-md">
              <Users className="w-5 h-5" />
            </div>
            <span className="font-display font-black text-xs tracking-wider uppercase">Customers</span>
            <span className="text-[10px] text-zinc-500 mt-1 font-mono">Buyer Profiles</span>
          </button>

        </div>
      </div>
      
      {/* 2. Simplified Operational Overview Statistics (3 premium cards) */}
      <div className="space-y-6 pt-6 border-t border-[#2A2A2A]/40" id="operational-overview-section">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-6 bg-teal-500 rounded-full" />
          <h2 className="text-sm font-black text-zinc-400 uppercase tracking-widest font-display" id="overview-header">
            Operational Overview
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6" id="overview-grid">
          
          {/* Card 1: Available Stock */}
          <div className="bg-[#121212] border border-[#3F3F46] p-6 rounded-[18px] shadow-lg flex flex-col justify-between" id="card-available-stock">
            <div className="flex justify-between items-start">
              <div className="space-y-2">
                <p className="text-[11px] font-['Arial_Black',sans-serif] font-black text-white uppercase tracking-wider flex items-center gap-1">
                  <span>📦</span> Available Stock
                </p>
                <p className="font-sans font-extrabold text-2xl sm:text-3xl text-white tracking-tight">{totalAvailableStock}</p>
                <p className="text-[10px] text-zinc-500 leading-normal">Total physical units in stock</p>
              </div>
              <span className="p-2 bg-zinc-900 border border-[#3F3F46] rounded-lg shrink-0 text-zinc-400">
                <Package className="w-4 h-4" />
              </span>
            </div>
          </div>

          {/* Card 2: Sold Today */}
          <div className="bg-[#121212] border border-[#3F3F46] p-6 rounded-[18px] shadow-lg flex flex-col justify-between" id="card-sold-today">
            <div className="flex justify-between items-start">
              <div className="space-y-2">
                <p className="text-[11px] font-['Arial_Black',sans-serif] font-black text-white uppercase tracking-wider flex items-center gap-1">
                  <span>🛒</span> Sold Today
                </p>
                <p className="font-sans font-extrabold text-2xl sm:text-3xl text-white tracking-tight">{todaySalesCount}</p>
                <p className="text-[10px] text-zinc-500 leading-normal">Units logged today</p>
              </div>
              <span className="p-2 bg-zinc-900 border border-[#3F3F46] rounded-lg shrink-0 text-zinc-400">
                <ShoppingCart className="w-4 h-4" />
              </span>
            </div>
          </div>

          {/* Card 3: Today's Revenue */}
          <div className="bg-[#121212] border border-[#3F3F46] p-6 rounded-[18px] shadow-lg flex flex-col justify-between" id="card-todays-revenue">
            <div className="flex justify-between items-start">
              <div className="space-y-2">
                <p className="text-[11px] font-['Arial_Black',sans-serif] font-black text-white uppercase tracking-wider flex items-center gap-1">
                  <span>💰</span> Today's Revenue
                </p>
                <p className="font-sans font-extrabold text-2xl sm:text-3xl text-white tracking-tight">
                  ₦{todaySalesAmount.toLocaleString()}
                </p>
                <p className="text-[10px] text-zinc-500 leading-normal">Completed sales value</p>
              </div>
              <span className="p-2 bg-zinc-900 border border-[#3F3F46] rounded-lg shrink-0 text-zinc-400">
                <TrendingUp className="w-4 h-4" />
              </span>
            </div>
          </div>

        </div>
      </div>

      {/* 3. Recent Activity Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8" id="recent-activity-grid">
        
        {/* Recently Added Products */}
        <div className="bg-[#1B1B1B] border border-[#2A2A2A] rounded-[16px] p-6 shadow-lg flex flex-col justify-between" id="recent-products-box">
          <div>
            <div className="flex justify-between items-center mb-6 border-b border-[#2A2A2A] pb-4">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-teal-400" />
                <h3 className="font-display font-black text-sm text-white uppercase tracking-wider">Recently Added Stock</h3>
              </div>
              <button
                onClick={() => onNavigate("inventory")}
                className="text-xs font-bold text-teal-400 hover:text-teal-300 hover:underline flex items-center gap-1 cursor-pointer transition-colors"
              >
                All Stock <ArrowRight className="w-4 h-4" />
              </button>
            </div>
            {recentProducts.length === 0 ? (
              <div className="py-16 text-center text-zinc-500 text-sm font-sans">No products in inventory. Click &quot;Add Product&quot; to start.</div>
            ) : (
              <div className="divide-y divide-zinc-800/30" id="recent-products-list">
                {recentProducts.map(product => (
                  <div key={product.id} className="py-4 flex justify-between items-center" id={`recent-prod-${product.id}`}>
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-zinc-900 rounded-xl flex items-center justify-center overflow-hidden border border-[#2A2A2A]">
                        {product.productImages && product.productImages[0] ? (
                          <img
                            src={product.productImages[0]}
                            alt={product.model}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Package className="w-5 h-5 text-zinc-500" />
                        )}
                      </div>
                      <div>
                        <p className="font-sans font-bold text-sm text-white tracking-wide">
                          {product.brand} {product.model}
                        </p>
                        <p className="text-xs text-zinc-500 flex items-center gap-2 mt-0.5">
                          <span className="font-mono bg-zinc-900 border border-[#2A2A2A] text-zinc-400 px-2 py-0.5 rounded text-[10px]">
                            {product.storage}
                          </span>
                          <span>•</span>
                          <span>{product.category}</span>
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-mono text-sm font-bold text-white">
                        ₦{product.sellingPrice.toLocaleString()}
                      </p>
                      <p className="text-xs text-zinc-500 mt-0.5">Qty: {product.quantity}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Recently Sold Products */}
        <div className="bg-[#1B1B1B] border border-[#2A2A2A] rounded-[16px] p-6 shadow-lg flex flex-col justify-between" id="recent-sales-box">
          <div>
            <div className="flex justify-between items-center mb-6 border-b border-[#2A2A2A] pb-4">
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-4 h-4 text-teal-400" />
                <h3 className="font-display font-black text-sm text-white uppercase tracking-wider">Recently Sold Logs</h3>
              </div>
              <button
                onClick={() => onNavigate("sales")}
                className="text-xs font-bold text-teal-400 hover:text-teal-300 hover:underline flex items-center gap-1 cursor-pointer transition-colors"
              >
                All Sales <ArrowRight className="w-4 h-4" />
              </button>
            </div>
            {recentSales.length === 0 ? (
              <div className="py-16 text-center text-zinc-500 text-sm font-sans">No sales recorded yet. Click &quot;Sell Product&quot; to log a transaction.</div>
            ) : (
              <div className="divide-y divide-zinc-800/30" id="recent-sales-list">
                {recentSales.map(sale => (
                  <div key={sale.id} className="py-4 flex justify-between items-center" id={`recent-sale-${sale.id}`}>
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-zinc-900 text-zinc-500 rounded-xl flex items-center justify-center border border-[#2A2A2A]">
                        <ShoppingCart className="w-5 h-5 text-teal-400" />
                      </div>
                      <div>
                        <p className="font-sans font-bold text-sm text-white tracking-wide truncate max-w-[180px] md:max-w-[240px]">
                          {sale.productName}
                        </p>
                        <p className="text-xs text-zinc-500 flex items-center gap-2 flex-wrap mt-0.5">
                          <span className="font-mono text-[10px] bg-zinc-900 border border-[#2A2A2A] text-zinc-400 px-1.5 py-0.2 rounded font-semibold">
                            {sale.paymentMethod}
                          </span>
                          <span>•</span>
                          <span className="truncate max-w-[100px]">{sale.customerName || "Walk-in"}</span>
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-mono text-sm font-bold text-white">
                        ₦{sale.totalAmount.toLocaleString()}
                      </p>
                      <p className="text-[10px] text-zinc-500 mt-0.5">By {sale.soldBy}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
