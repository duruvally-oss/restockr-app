import React, { useState } from "react";
import { Shop } from "../types";
import { 
  CreditCard, ShieldCheck, Zap, HelpCircle, Calendar, Clock, CheckCircle, ArrowUpRight, RefreshCw, X, ChevronRight
} from "lucide-react";

interface SettingsSubscriptionProps {
  shop: Shop;
  onUpdateSubscription: (plan: Shop["subscriptionPlan"], status: Shop["subscriptionStatus"], expiry: string) => void;
  onSimulateExpiryToggle: (isExpired: boolean) => void;
  isSimulatedExpired: boolean;
}

export default function SettingsSubscription({
  shop,
  onUpdateSubscription,
  onSimulateExpiryToggle,
  isSimulatedExpired
}: SettingsSubscriptionProps) {
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [isProcessingUpgrade, setIsProcessingUpgrade] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  // Calculate days remaining dynamically
  const expiryDate = new Date(shop.subscriptionExpiry);
  const currentDate = new Date();
  const timeDiff = expiryDate.getTime() - currentDate.getTime();
  const daysRemaining = Math.max(0, Math.ceil(timeDiff / (1000 * 60 * 60 * 24)));

  // Payment history logs derived from current subscription status
  const currentExpiryFormatted = new Date(shop.subscriptionExpiry).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  const paymentHistory = [
    {
      id: `PSTK-${shop.id.slice(0, 6).toUpperCase()}-01`,
      plan: shop.subscriptionPlan || "Monthly Pro Plan",
      amount: "₦5,000.00",
      date: currentExpiryFormatted,
      status: shop.subscriptionStatus === "Active" ? "Successful" : "Pending",
      gateway: "Paystack Secured"
    }
  ];

  const handleSelectUpgradeTier = (planName: "Monthly Plan" | "Yearly Plan", label: string, amount: string) => {
    setIsProcessingUpgrade(true);
    setTimeout(() => {
      const daysToAdd = planName === "Monthly Plan" ? 30 : 365;
      const newExpiry = new Date(Date.now() + daysToAdd * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
      onUpdateSubscription(planName, "Active", newExpiry);
      setIsProcessingUpgrade(false);
      setShowUpgradeModal(false);
      setSuccessMsg(`Successfully subscribed to ${label}! Renewal updated to ${newExpiry}`);
      setTimeout(() => setSuccessMsg(""), 5000);
    }, 1200);
  };

  return (
    <div className="space-y-8 animate-fade-in text-white p-1" id="settings-subscription-module">
      
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-2 border-b border-zinc-900">
        <div>
          <span className="text-xs font-mono font-black tracking-widest text-zinc-500 uppercase">Billing Engine</span>
          <h1 className="text-4xl font-display font-black uppercase text-white tracking-tight mt-1">Billing</h1>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-3 py-1.5 text-[10px] font-mono font-bold uppercase rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span> Merchant Subscription Active
          </span>
        </div>
      </div>

      {successMsg && (
        <div className="bg-emerald-950/35 border border-emerald-800/40 p-4 rounded-xl text-emerald-400 text-xs font-bold flex items-center gap-2 animate-pulse">
          <CheckCircle className="w-4 h-4 shrink-0" />
          {successMsg}
        </div>
      )}

      {/* Primary Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* COL 1 & 2: Billing Summary details */}
        <div className="lg:col-span-2 space-y-6">
          
          <div className="bg-[#121212] border border-zinc-800 rounded-2xl p-6 shadow-xl space-y-6">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <span className="text-[9px] font-mono font-bold tracking-widest text-zinc-500 uppercase">Current Active Plan</span>
                <h3 className="font-display font-black text-2xl text-white tracking-tight">
                  {shop.subscriptionPlan}
                </h3>
              </div>
              <span className={`px-3 py-1.5 text-[10px] font-mono font-bold uppercase rounded-lg ${
                shop.subscriptionStatus === "Active" && !isSimulatedExpired
                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                  : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
              }`}>
                {isSimulatedExpired ? "EXPIRED" : shop.subscriptionStatus}
              </span>
            </div>

            {/* Structured Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 pt-2">
              <div className="bg-zinc-950 border border-zinc-900 p-4 rounded-xl space-y-1">
                <div className="flex items-center gap-1.5 text-zinc-500">
                  <Clock className="w-3.5 h-3.5" />
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider">Days Remaining</span>
                </div>
                <p className="text-xl font-mono font-black text-white">
                  {isSimulatedExpired ? 0 : daysRemaining} Days
                </p>
              </div>

              <div className="bg-zinc-950 border border-zinc-900 p-4 rounded-xl space-y-1">
                <div className="flex items-center gap-1.5 text-zinc-500">
                  <Calendar className="w-3.5 h-3.5" />
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider">Renewal Date</span>
                </div>
                <p className="text-xs sm:text-sm font-mono font-black text-white pt-1">
                  {shop.subscriptionExpiry}
                </p>
              </div>

              <div className="col-span-2 md:col-span-1 bg-zinc-950 border border-zinc-900 p-4 rounded-xl space-y-1">
                <div className="flex items-center gap-1.5 text-zinc-500">
                  <CreditCard className="w-3.5 h-3.5" />
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider">Payment Method</span>
                </div>
                <p className="text-xs font-bold text-white pt-1 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span> Paystack Secured
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-t border-zinc-900 pt-5 gap-4">
              <div className="text-xs text-zinc-500">
                Payment transactions secured through Paystack merchant channel API.
              </div>
              <button
                type="button"
                onClick={() => setShowUpgradeModal(true)}
                className="w-full sm:w-auto bg-white hover:bg-zinc-200 text-black px-5 py-3 rounded-xl text-xs font-bold uppercase tracking-wider cursor-pointer transition-colors shadow-lg flex items-center justify-center gap-1.5"
              >
                Upgrade Plan <ArrowUpRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Secure Payment History logs */}
          <div className="bg-[#121212] border border-zinc-800 rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-teal-400" />
              <h3 className="font-display font-black text-sm uppercase text-white tracking-wider">Payment History</h3>
            </div>
            
            <div className="space-y-3">
              {paymentHistory.map(pay => (
                <div 
                  key={pay.id} 
                  className="bg-zinc-950 hover:bg-zinc-900 p-4 rounded-xl border border-zinc-900 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 transition-colors text-xs"
                >
                  <div className="space-y-1">
                    <p className="font-mono text-[9px] text-zinc-500">Invoice ID: {pay.id}</p>
                    <h4 className="font-display font-black text-xs text-white uppercase tracking-wider">{pay.plan}</h4>
                    <p className="text-zinc-400 font-medium">{pay.date} • {pay.gateway}</p>
                  </div>
                  <div className="flex sm:flex-col justify-between sm:justify-center items-center sm:items-end w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-zinc-900">
                    <span className="font-mono font-black text-sm text-white">{pay.amount}</span>
                    <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 px-2 py-0.5 rounded text-[8px] font-bold font-mono uppercase mt-1">
                      {pay.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* COL 3: Side info box */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-[#121212] border border-zinc-800 rounded-2xl p-5 space-y-4">
            <div className="p-3 bg-zinc-950 border border-zinc-900 rounded-xl w-fit">
              <ShieldCheck className="w-5 h-5 text-teal-400" />
            </div>
            <div className="space-y-2">
              <h4 className="font-display font-black text-xs text-white uppercase tracking-widest">Billing Guidelines</h4>
              <p className="text-[11px] text-zinc-400 leading-relaxed">
                Subscriptions are billed on a recurring monthly schedule. All transactions are securely audited and archived for corporate reports.
              </p>
            </div>
          </div>

          <div className="bg-[#121212] border border-zinc-800 rounded-2xl p-5 space-y-3 text-xs">
            <div className="flex items-center gap-2 text-zinc-400">
              <HelpCircle className="w-4 h-4 text-zinc-500" />
              <span className="font-semibold text-zinc-400">Need Assistance?</span>
            </div>
            <p className="text-[11px] text-zinc-500 leading-relaxed">
              For support, bulk licenses, or custom merchant setups, please contact billing@restockr.app.
            </p>
          </div>
        </div>

      </div>

      {/* PLAN UPGRADE MODAL */}
      {showUpgradeModal && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-[150] flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
          <div className="w-full max-w-2xl bg-[#121212] border-2 border-zinc-800 rounded-2xl p-6 shadow-2xl animate-scale-up space-y-6">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-black font-display text-white uppercase tracking-tight">Upgrade Plan</h3>
                <p className="text-xs text-zinc-500 mt-1">Unlock enterprise features to scale your gadget workspace.</p>
              </div>
              <button
                onClick={() => setShowUpgradeModal(false)}
                className="p-2 bg-zinc-900 hover:bg-zinc-800 rounded-xl text-zinc-400 hover:text-white transition-all cursor-pointer border border-zinc-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Pro Plan */}
              <div className="bg-zinc-950 border border-zinc-900 rounded-xl p-5 space-y-4 flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-mono font-black text-teal-400 uppercase tracking-widest">Monthly Pro</span>
                    <Zap className="w-4 h-4 text-teal-400" />
                  </div>
                  <div className="py-2">
                    <span className="text-2xl font-mono font-black text-white">₦5,000</span>
                    <span className="text-xs text-zinc-500"> / month</span>
                  </div>
                  <ul className="text-xs text-zinc-400 space-y-1.5 pt-2">
                    <li className="flex items-center gap-1.5">✓ Unlimited Stock Items</li>
                    <li className="flex items-center gap-1.5">✓ Staff Collaboration Accounts</li>
                    <li className="flex items-center gap-1.5">✓ Live Storefront Analytics</li>
                  </ul>
                </div>
                <button
                  onClick={() => handleSelectUpgradeTier("Monthly Plan", "Monthly Pro Plan", "₦5,000")}
                  disabled={isProcessingUpgrade}
                  className="w-full mt-4 py-3 bg-white hover:bg-zinc-200 text-black rounded-xl text-xs font-bold uppercase tracking-wider cursor-pointer transition-all flex items-center justify-center gap-1.5"
                >
                  {isProcessingUpgrade ? <RefreshCw className="w-4 h-4 animate-spin" /> : "Subscribe Pro"}
                </button>
              </div>

              {/* Enterprise Plan */}
              <div className="bg-zinc-950 border border-zinc-900 rounded-xl p-5 space-y-4 flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-mono font-black text-zinc-500 uppercase tracking-widest">Enterprise Custom</span>
                    <ShieldCheck className="w-4 h-4 text-zinc-500" />
                  </div>
                  <div className="py-2">
                    <span className="text-2xl font-mono font-black text-white">₦25,000</span>
                    <span className="text-xs text-zinc-500"> / month</span>
                  </div>
                  <ul className="text-xs text-zinc-400 space-y-1.5 pt-2">
                    <li className="flex items-center gap-1.5">✓ Multiple Shops Branches</li>
                    <li className="flex items-center gap-1.5">✓ Dedicated CRM Pipeline</li>
                    <li className="flex items-center gap-1.5">✓ Priority Support Line</li>
                  </ul>
                </div>
                <button
                  onClick={() => handleSelectUpgradeTier("Yearly Plan", "Enterprise Custom Plan", "₦25,000")}
                  disabled={isProcessingUpgrade}
                  className="w-full mt-4 py-3 bg-zinc-900 hover:bg-zinc-800 text-white border border-zinc-800 rounded-xl text-xs font-bold uppercase tracking-wider cursor-pointer transition-all flex items-center justify-center gap-1.5"
                >
                  {isProcessingUpgrade ? <RefreshCw className="w-4 h-4 animate-spin" /> : "Upgrade Enterprise"}
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
}
