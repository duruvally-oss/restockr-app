import React, { useState } from "react";
import { Shop } from "../types";
import { Globe, Eye, Video, Image as ImageIcon, Palette, Copy, Check, Save, ExternalLink, Building, ShieldCheck } from "lucide-react";

interface WebsiteSettingsProps {
  shop: Shop;
  onSaveSettings: (settings: Shop["websiteSettings"]) => void;
  onSaveProfile: (profile: { name: string; businessAddress?: string; businessPhone?: string; logoUrl?: string; whatsappNumber: string }) => void;
}

const THEME_PRESETS = [
  { name: "Slate Abyss (Dark)", value: "#0F172A", desc: "Default ultra-premium slate black canvas." },
  { name: "Classic Silver (Light)", value: "#F1F5F9", desc: "Elegant minimalism using soft white accents." },
  { name: "Deep Cobalt (Ocean)", value: "#1E3A8A", desc: "Bold corporate layout for professional electronic stores." },
  { name: "Emerald Forest (Growth)", value: "#065F46", desc: "A vibrant tech-forward green theme." }
];

export default function WebsiteSettings({
  shop,
  onSaveSettings,
  onSaveProfile
}: WebsiteSettingsProps) {
  // Business profile state parameters
  const [profileName, setProfileName] = useState(shop.name || "");
  const [logoUrl, setLogoUrl] = useState(shop.logoUrl || "");
  const [businessAddress, setBusinessAddress] = useState(shop.businessAddress || "");
  const [businessPhone, setBusinessPhone] = useState(shop.businessPhone || "");
  const [whatsappNumber, setWhatsappNumber] = useState(shop.whatsappNumber || "");

  // Website configuration states
  const [showPrices, setShowPrices] = useState(shop.websiteSettings.showPrices ?? true);
  const [showSold, setShowSold] = useState(shop.websiteSettings.showSoldProducts);
  const [allowVideo, setAllowVideo] = useState(shop.websiteSettings.enableVideoDownloads);
  const [allowImage, setAllowImage] = useState(shop.websiteSettings.enableImageDownloads);
  const [themeColor, setThemeColor] = useState(shop.websiteSettings.customThemeColor);

  // Success indicator states
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Save Business Profile
    onSaveProfile({
      name: profileName,
      businessAddress: businessAddress,
      businessPhone: businessPhone,
      logoUrl: logoUrl,
      whatsappNumber: whatsappNumber
    });

    // Save Reseller Website Settings
    onSaveSettings({
      showPrices: showPrices,
      showSoldProducts: showSold,
      enableVideoDownloads: allowVideo,
      enableImageDownloads: allowImage,
      customThemeColor: themeColor
    });

    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const websiteUrl = `${window.location.origin}/#/shop/${shop.slug}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(websiteUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div className="space-y-6 animate-fade-in text-white p-1" id="website-settings-module">
      
      {/* Title Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-2 border-b border-zinc-900">
        <div>
          <span className="text-xs font-mono font-black tracking-widest text-zinc-500 uppercase">Configuration Deck</span>
          <h1 className="text-4xl font-display font-black uppercase tracking-tight text-white mt-1">Settings</h1>
        </div>
        
        {/* Open Live Storefront Link */}
        <a
          href={`/#/shop/${shop.slug}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 bg-zinc-900 border border-zinc-800 hover:bg-zinc-850 text-white px-5 py-3 rounded-xl font-bold font-display uppercase text-xs tracking-wider cursor-pointer shadow-md transition-colors"
        >
          <ExternalLink className="w-4 h-4 text-emerald-400" /> Visit Public Website
        </a>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* LEFT COLUMN: UNIFIED SETTINGS FORM */}
        <form onSubmit={handleSave} className="lg:col-span-2 space-y-6">
          
          {/* Card 1: Business Profile Parameters */}
          <div className="bg-[#121212] border border-zinc-800 rounded-2xl p-6 shadow-xl space-y-6">
            <h2 className="text-sm font-display font-black text-white border-b border-zinc-900 pb-3 flex items-center gap-2 uppercase tracking-wider">
              <Building className="w-5 h-5 text-emerald-400" /> Company Business Profile
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Business Name */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-wider block">
                  Store / Brand Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Kano Gadgets Hub"
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                  className="w-full px-3 py-2.5 bg-black border border-zinc-800 rounded-xl text-sm focus:outline-none focus:border-zinc-500 text-white font-semibold"
                />
              </div>

              {/* Logo URL */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-wider block">
                  Business Logo Image URL
                </label>
                <input
                  type="url"
                  placeholder="e.g. https://domain.com/logo.png (optional)"
                  value={logoUrl}
                  onChange={(e) => setLogoUrl(e.target.value)}
                  className="w-full px-3 py-2.5 bg-black border border-zinc-800 rounded-xl text-sm focus:outline-none focus:border-zinc-500 text-white font-mono text-xs"
                />
              </div>

              {/* Office Phone */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-wider block">
                  Corporate Phone Number
                </label>
                <input
                  type="tel"
                  placeholder="e.g. +234 803 123 4567"
                  value={businessPhone}
                  onChange={(e) => setBusinessPhone(e.target.value)}
                  className="w-full px-3 py-2.5 bg-black border border-zinc-800 rounded-xl text-sm focus:outline-none focus:border-zinc-500 text-white font-semibold"
                />
              </div>

              {/* WhatsApp Number */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-wider block">
                  WhatsApp Orders Contact
                </label>
                <input
                  type="tel"
                  required
                  placeholder="e.g. +234 812 345 6789"
                  value={whatsappNumber}
                  onChange={(e) => setWhatsappNumber(e.target.value)}
                  className="w-full px-3 py-2.5 bg-black border border-zinc-800 rounded-xl text-sm focus:outline-none focus:border-zinc-500 text-white font-semibold"
                />
              </div>

              {/* Business physical address */}
              <div className="space-y-1.5 md:col-span-2">
                <label className="text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-wider block">
                  Corporate Office / Shop Address
                </label>
                <input
                  type="text"
                  placeholder="e.g. Suite 4, Ikeja Plaza, Computer Village, Lagos, Nigeria"
                  value={businessAddress}
                  onChange={(e) => setBusinessAddress(e.target.value)}
                  className="w-full px-3 py-2.5 bg-black border border-zinc-800 rounded-xl text-sm focus:outline-none focus:border-zinc-500 text-white font-semibold"
                />
                <p className="text-[9px] text-zinc-500">This business name, logo, address, and phones are dynamically drawn on thermal receipts and corporate transaction printouts.</p>
              </div>
            </div>
          </div>

          {/* Card 2: Catalog Preference Settings */}
          <div className="bg-[#121212] border border-zinc-800 rounded-2xl p-6 shadow-xl space-y-6">
            <h2 className="text-sm font-display font-black text-white border-b border-zinc-900 pb-3 flex items-center gap-2 uppercase tracking-wider">
              <Globe className="w-5 h-5 text-emerald-400" /> Reseller Storefront Catalog
            </h2>

            {/* Preset Colors */}
            <div className="space-y-3">
              <label className="text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                <Palette className="w-4 h-4 text-emerald-400" /> Public Catalog Theme Color
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {THEME_PRESETS.map(preset => {
                  const isSelected = themeColor === preset.value;
                  return (
                    <button
                      key={preset.value}
                      type="button"
                      onClick={() => setThemeColor(preset.value)}
                      className={`p-4 rounded-xl border text-left transition-all cursor-pointer flex items-center gap-3 ${
                        isSelected ? "border-emerald-500 bg-zinc-900 shadow-lg" : "border-zinc-850 bg-black hover:bg-zinc-900/40 text-zinc-400"
                      }`}
                    >
                      <span className="w-5 h-5 rounded-full shrink-0 border border-zinc-800" style={{ backgroundColor: preset.value }} />
                      <div>
                        <p className={`text-xs font-bold ${isSelected ? "text-white" : "text-zinc-400"}`}>{preset.name}</p>
                        <p className="text-[10px] text-zinc-500 mt-0.5">{preset.desc}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Visibility Controls */}
            <div className="space-y-4 border-t border-zinc-900 pt-5">
              <label className="text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-wider block">
                Storefront Download Permissions & Visibilities
              </label>

              {/* Show Prices */}
              <div className="flex items-center justify-between py-2">
                <div className="space-y-0.5">
                  <p className="font-display font-semibold text-xs text-white flex items-center gap-1.5">
                    <Eye className="w-4 h-4 text-emerald-400" /> Show Product Selling Prices
                  </p>
                  <p className="text-[10px] text-zinc-500 max-w-md">Toggle whether prices display on storefront product cards and copied details.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowPrices(!showPrices)}
                  className={`w-11 h-6 rounded-full transition-colors relative shrink-0 cursor-pointer ${
                    showPrices ? "bg-emerald-500" : "bg-zinc-900 border border-zinc-800"
                  }`}
                >
                  <span className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
                    showPrices ? "translate-x-5" : "translate-x-0"
                  }`} />
                </button>
              </div>

              {/* Show Sold Out */}
              <div className="flex items-center justify-between py-2 border-t border-zinc-900/60">
                <div className="space-y-0.5">
                  <p className="font-display font-semibold text-xs text-white flex items-center gap-1.5">
                    <Eye className="w-4 h-4 text-emerald-400" /> Show Sold-Out Gadget Listings
                  </p>
                  <p className="text-[10px] text-zinc-500 max-w-md">Toggle whether sold out items display in the public catalog storefront.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowSold(!showSold)}
                  className={`w-11 h-6 rounded-full transition-colors relative shrink-0 cursor-pointer ${
                    showSold ? "bg-emerald-500" : "bg-zinc-900 border border-zinc-800"
                  }`}
                >
                  <span className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
                    showSold ? "translate-x-5" : "translate-x-0"
                  }`} />
                </button>
              </div>

              {/* Video Downloads */}
              <div className="flex items-center justify-between py-2 border-t border-zinc-900/60">
                <div className="space-y-0.5">
                  <p className="font-display font-semibold text-xs text-white flex items-center gap-1.5">
                    <Video className="w-4 h-4 text-emerald-400" /> Enable Product Video Clip Downloads
                  </p>
                  <p className="text-[10px] text-zinc-500 max-w-md">Allow visiting resellers to save raw mp4 video clips to share on WhatsApp status.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setAllowVideo(!allowVideo)}
                  className={`w-11 h-6 rounded-full transition-colors relative shrink-0 cursor-pointer ${
                    allowVideo ? "bg-emerald-500" : "bg-zinc-900 border border-zinc-800"
                  }`}
                >
                  <span className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
                    allowVideo ? "translate-x-5" : "translate-x-0"
                  }`} />
                </button>
              </div>

              {/* Photo Downloads */}
              <div className="flex items-center justify-between py-2 border-t border-zinc-900/60">
                <div className="space-y-0.5">
                  <p className="font-display font-semibold text-xs text-white flex items-center gap-1.5">
                    <ImageIcon className="w-4 h-4 text-emerald-400" /> Enable Product Photo Downloads
                  </p>
                  <p className="text-[10px] text-zinc-500 max-w-md">Allow resellers to save original uploaded product images directly.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setAllowImage(!allowImage)}
                  className={`w-11 h-6 rounded-full transition-colors relative shrink-0 cursor-pointer ${
                    allowImage ? "bg-emerald-500" : "bg-zinc-900 border border-zinc-800"
                  }`}
                >
                  <span className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
                    allowImage ? "translate-x-5" : "translate-x-0"
                  }`} />
                </button>
              </div>
            </div>
          </div>

          {/* Unified Save Trigger Button */}
          <div className="flex flex-col sm:flex-row items-center justify-between bg-[#121212] border border-zinc-800 rounded-2xl p-5 gap-4">
            <div>
              {savedSuccess ? (
                <span className="text-xs font-mono font-bold text-emerald-400 animate-pulse flex items-center gap-1">
                  ✓ Profile settings and catalog preferences updated successfully!
                </span>
              ) : (
                <p className="text-[11px] text-zinc-500">Save workspace changes to apply configurations globally.</p>
              )}
            </div>
            <button
              type="submit"
              className="w-full sm:w-auto px-6 py-3.5 bg-emerald-500 hover:bg-emerald-400 text-black rounded-xl font-bold font-display uppercase tracking-wider text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-lg transition-colors"
            >
              <Save className="w-4 h-4" /> Save Configuration
            </button>
          </div>

        </form>

        {/* RIGHT COLUMN: LINK & PUBLICITY DECK */}
        <div className="bg-[#121212] border border-zinc-800 rounded-2xl p-6 shadow-xl space-y-6 h-fit">
          <h3 className="font-display font-black text-xs uppercase tracking-wider text-white">Public Digital Catalog</h3>
          
          <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-900 space-y-3">
            <span className="text-[9px] font-mono uppercase tracking-widest font-bold text-zinc-500">Store Domain</span>
            <div className="font-mono text-xs text-white bg-black border border-zinc-800 rounded-lg p-2.5 flex justify-between items-center gap-2">
              <span className="truncate flex-1 font-semibold">{shop.slug}.restockr.app</span>
              <button
                type="button"
                onClick={handleCopyLink}
                className="p-1 hover:bg-zinc-905 text-zinc-400 hover:text-white rounded shrink-0 cursor-pointer transition-colors"
                title="Copy Store Link"
              >
                {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
            <p className="text-[10px] text-zinc-400 leading-relaxed">
              Resellers and walk-in buyers can browse catalog parameters, inspect specs, condition tags, warranties, and place orders directly on WhatsApp.
            </p>
          </div>

          <div className="border-t border-zinc-900 pt-4 space-y-3 text-xs">
            <p className="font-bold text-white flex items-center gap-1.5 uppercase tracking-wider text-[10px]">
              🚀 Catalog Features
            </p>
            <ul className="space-y-2 text-zinc-400 text-[11px] list-none">
              <li className="flex items-center gap-2">
                <span className="w-1 h-1 rounded-full bg-emerald-400"></span> Filterable stock listings
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1 h-1 rounded-full bg-emerald-400"></span> Instant copy details (WhatsApp optimized)
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1 h-1 rounded-full bg-emerald-400"></span> Demonstration video player
              </li>
            </ul>
          </div>
        </div>

      </div>

    </div>
  );
}
