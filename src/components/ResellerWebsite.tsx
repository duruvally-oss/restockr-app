import React, { useState } from "react";
import { Product, Shop, Category } from "../types";
import { 
  Download, Copy, Check, Video, Image as ImageIcon, Search, Phone, 
  HelpCircle, AlertTriangle, BadgeAlert, Sparkles, ExternalLink, ArrowRight, Play
} from "lucide-react";
import { VideoPlayerModal } from "./VideoPlayerModal";
import { downloadMediaFile } from "../lib/download";
import { db } from "../lib/database";
import QuickTagsBadgeList from "./QuickTagsBadgeList";

interface ResellerWebsiteProps {
  shop: Shop;
  products: Product[];
  isExpired: boolean;
}

export default function ResellerWebsite({
  shop,
  products,
  isExpired
}: ResellerWebsiteProps) {
  const [activeCategory, setActiveCategory] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [selectedVideoUrl, setSelectedVideoUrl] = useState<string | null>(null);
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);

  // Generate plain text description for resellers (no emojis, no markdown)
  const handleCopyDetails = (product: Product) => {
    const batteryText = product.batteryHealth ? `\nBattery: ${product.batteryHealth}` : "";
    const showPrice = shop.websiteSettings.showPrices ?? true;
    const priceLine = showPrice ? `\nPrice: NGN ${product.sellingPrice.toLocaleString()}` : "";
    
    const text = `${product.brand} ${product.model}
Storage: ${product.storage}${priceLine}
Warranty: ${product.warranty}${batteryText}
Condition: ${product.condition.join(", ")}

Contact us on WhatsApp to lock stock:
${shop.whatsappNumber}
Catalog: ${window.location.origin}/#/shop/${shop.slug}`;

    navigator.clipboard.writeText(text);
    setCopiedId(product.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDownloadFile = async (url: string, filename: string) => {
    const res = await downloadMediaFile(url, filename);
    if (!res.success) {
      alert(`Download failed: ${res.error || "The media file could not be retrieved from storage."}`);
    }
  };

  // 1. Check if store is locked/expired
  if (isExpired || shop.subscriptionStatus === "Expired") {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center p-6 text-white" id="website-expired-notice">
        <div className="max-w-md w-full bg-[#1B1B1B] p-8 rounded-3xl border border-[#2A2A2A] text-center space-y-6">
          <div className="w-16 h-16 bg-rose-500/10 text-rose-500 rounded-2xl flex items-center justify-center mx-auto border border-rose-500/25">
            <AlertTriangle className="w-10 h-10" />
          </div>
          <div className="space-y-2">
            <h1 className="font-display font-extrabold text-2xl tracking-tight text-white">{shop.name}</h1>
            <p className="font-mono text-xs text-rose-400 font-bold uppercase tracking-widest">Temporarily Offline</p>
          </div>
          <p className="text-sm text-zinc-400 leading-relaxed">
            This shop's digital catalog is temporarily unavailable. If you are the store owner, please complete subscription renewal in your Restockr billing settings dashboard to restore immediate customer access.
          </p>
        </div>
      </div>
    );
  }

  // 2. Filter products based on available flag & owner preferences
  const visibleProducts = products.filter(product => {
    // Hide sold out if showSoldProducts is false
    const matchesSoldConstraint = shop.websiteSettings.showSoldProducts || product.quantity > 0;
    const matchesCategory = activeCategory === "All" || product.category === activeCategory;
    const matchesSearch = 
      product.model.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.brand.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesSoldConstraint && matchesCategory && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-zinc-100 flex flex-col font-sans" id="reseller-catalog-website">
      
      {/* PUBLIC HEADER */}
      <header className="bg-[#121212]/90 backdrop-blur-md sticky top-0 z-30 border-b border-[#2A2A2A] px-6 py-4 flex justify-between items-center shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#1B1B1B] rounded-2xl border border-[#2A2A2A] flex items-center justify-center font-display font-black text-teal-400 shadow-md">
            R
          </div>
          <div>
            <h1 className="font-display font-extrabold text-base tracking-tight text-white flex items-center gap-1.5 uppercase">
              {shop.name}
            </h1>
            <p className="text-[10px] text-teal-400 font-mono tracking-wider">● ONLINE RESELLER WEB</p>
          </div>
        </div>

        {/* WhatsApp Callout */}
        <a 
          href={`https://wa.me/${shop.whatsappNumber}`}
          className="bg-gradient-to-b from-[#565656] to-[#3A3A3A] hover:from-[#666666] hover:to-[#464646] border border-[#555555] text-white px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow"
        >
          <Phone className="w-4 h-4 text-teal-400" /> Order on WhatsApp
        </a>
      </header>

      {/* FILTER CONTROL RAILS & SEARCH */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 space-y-8">
        
        {/* Banner Section */}
        <div className="text-center max-w-2xl mx-auto py-8 space-y-3">
          <span className="text-[10px] font-mono tracking-widest text-teal-400 uppercase font-bold bg-[#1B1B1B] px-3 py-1.5 rounded-full border border-[#2A2A2A]">
            Reseller Central Catalog
          </span>
          <h2 className="font-display font-extrabold text-3xl text-white tracking-tight">
            Original Gadget Payout Catalog
          </h2>
          <p className="text-sm text-zinc-400">
            No registration needed. Resellers can copy WhatsApp status templates, download original demonstration videos/photos, and lock stock instantly.
          </p>
        </div>

        {/* Search and Categories row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center bg-[#1B1B1B] p-4 rounded-3xl border border-[#2A2A2A]">
          
          <div className="relative md:col-span-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input
              type="text"
              placeholder="Search catalog models..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-black border border-[#2A2A2A] pl-10 pr-4 py-2 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-teal-500 text-white"
            />
          </div>

          <div className="md:col-span-2 flex gap-1.5 overflow-x-auto pr-1">
            <button
              onClick={() => setActiveCategory("All")}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all shrink-0 cursor-pointer ${
                activeCategory === "All" 
                  ? "bg-white text-[#0A0A0A] font-bold" 
                  : "bg-[#121212] border border-[#2A2A2A] text-zinc-400 hover:text-white"
              }`}
            >
              All Products
            </button>
            {Object.values(Category).map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all shrink-0 cursor-pointer ${
                  activeCategory === cat 
                    ? "bg-white text-[#0A0A0A] font-bold" 
                    : "bg-[#121212] border border-[#2A2A2A] text-zinc-400 hover:text-white"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

        </div>

        {/* CATALOG GRID */}
        {visibleProducts.length === 0 ? (
          <div className="text-center py-20 bg-[#1B1B1B]/40 border border-[#2A2A2A] rounded-3xl text-zinc-500">
            <AlertTriangle className="w-12 h-12 text-zinc-700 mx-auto mb-3" />
            <p className="font-display font-bold text-lg">No visible models matching search</p>
            <p className="text-xs text-zinc-600 mt-1">Please explore alternative categories or contact the owner.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {visibleProducts.map(product => {
              const resolvedVideo = db.getResolvedVideoUrl(product) || product.productVideo || "";
              const hasVideo = Boolean(resolvedVideo && resolvedVideo.trim().length > 0);
              return (
                <div 
                  key={product.id} 
                  className={`bg-[#1B1B1B] border border-[#2A2A2A] rounded-3xl overflow-hidden flex flex-col justify-between relative group shadow-lg ${
                    product.quantity === 0 ? "opacity-75" : ""
                  }`}
                  id={`public-card-${product.id}`}
                >
                  
                  {/* Stock Badges */}
                  <div className="absolute top-4 left-4 z-10 flex gap-1.5">
                    {product.quantity > 0 ? (
                      <span className="bg-teal-500/15 border border-teal-500/35 text-teal-400 font-mono text-[9px] uppercase font-bold px-2 py-1 rounded-md backdrop-blur-sm">
                        QTY AVAILABLE: {product.quantity}
                      </span>
                    ) : (
                      <span className="bg-rose-600/20 border border-rose-500/30 text-rose-400 font-mono text-[9px] uppercase font-extrabold px-2 py-1 rounded-md">
                        SOLD OUT
                      </span>
                    )}
                  </div>

                  {/* Media Frame: Image/Video playback */}
                  <div 
                    onClick={() => {
                      if (hasVideo) {
                        setSelectedVideoUrl(resolvedVideo);
                        setIsVideoModalOpen(true);
                      }
                    }}
                    className={`h-56 bg-black overflow-hidden relative flex items-center justify-center border-b border-[#2A2A2A] ${
                      hasVideo ? 'cursor-pointer group/vid' : ''
                    }`}
                  >
                    {product.productImages && product.productImages[0] ? (
                      <img
                        src={product.productImages[0]}
                        alt={product.model}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <Sparkles className="w-12 h-12 text-zinc-800" />
                    )}

                    {/* Demonstration Video tag */}
                    {hasVideo && (
                      <div className="absolute inset-0 bg-black/40 group-hover/vid:bg-black/20 flex items-center justify-center transition-colors">
                        <div className="w-10 h-10 rounded-full bg-teal-500 text-black flex items-center justify-center shadow-lg group-hover/vid:scale-110 transition-transform font-bold">
                          <Play className="w-5 h-5 fill-black ml-0.5" />
                        </div>
                        <span className="absolute bottom-3 right-3 p-1.5 bg-black/80 text-white rounded-lg text-[9px] font-mono uppercase tracking-wider flex items-center gap-1 backdrop-blur-sm border border-[#2A2A2A]">
                          <Video className="w-3.5 h-3.5 text-teal-400 animate-pulse" /> Play Video
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Body Info */}
                  <div className="p-6 flex-1 flex flex-col justify-between space-y-6">
                    <div className="space-y-3">
                      <div>
                        <span className="text-[10px] font-mono font-bold tracking-widest text-teal-400 uppercase">
                          {product.brand}
                        </span>
                        <h3 className="font-display font-extrabold text-xl text-white mt-1 line-clamp-1">
                          {product.model}
                        </h3>
                      </div>

                      {/* Info specifications table */}
                      <div className="grid grid-cols-2 gap-3 text-xs border-y border-[#2A2A2A] py-3 text-zinc-400 font-sans">
                        <p><b className="text-zinc-200">Storage:</b> {product.storage}</p>
                        <p><b className="text-zinc-200">Warranty:</b> {product.warranty}</p>
                        {product.batteryHealth && (
                          <p><b className="text-zinc-200">Battery:</b> {product.batteryHealth}</p>
                        )}
                        <div className="col-span-2 space-y-1">
                          <span className="text-[10px] text-zinc-400 font-mono font-bold uppercase">Condition & Quick Tags</span>
                          <QuickTagsBadgeList 
                            tags={product.condition} 
                            batteryHealth={product.batteryHealth} 
                            variant="dark" 
                          />
                        </div>
                      </div>
                    </div>

                    {/* Pricing & Download Tools */}
                    <div className="space-y-4">
                      
                      {/* Price Tag */}
                      {(shop.websiteSettings.showPrices ?? true) && (
                        <div className="flex justify-between items-baseline">
                          <span className="text-[10px] font-mono text-zinc-500 uppercase font-semibold">Reseller Price</span>
                          <span className="font-mono text-2xl font-black text-white">
                            ₦{product.sellingPrice.toLocaleString()}
                          </span>
                        </div>
                      )}

                      {/* Download Tools Row */}
                      <div className="grid grid-cols-3 gap-2">
                        
                        {/* Copy details */}
                        <button
                          onClick={() => handleCopyDetails(product)}
                          className="flex flex-col items-center justify-center p-2 border border-[#2A2A2A] bg-black text-zinc-300 hover:text-white rounded-xl text-[10px] font-bold cursor-pointer transition-colors"
                          title="Copy details optimized for WhatsApp Status"
                        >
                          {copiedId === product.id ? (
                            <>
                              <Check className="w-4 h-4 text-teal-400 mb-1" />
                              <span className="text-teal-400">Copied!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-4 h-4 text-zinc-400 mb-1" />
                              <span>Copy Text</span>
                            </>
                          )}
                        </button>

                        {/* Download Photo */}
                        <button
                          disabled={!shop.websiteSettings.enableImageDownloads}
                          onClick={() => handleDownloadFile(product.productImages[0], `${product.model}_photo.jpg`)}
                          className="flex flex-col items-center justify-center p-2 border border-[#2A2A2A] bg-black text-zinc-300 hover:text-white rounded-xl text-[10px] font-bold cursor-pointer transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          <ImageIcon className="w-4 h-4 text-zinc-400 mb-1" />
                          <span>Photo</span>
                        </button>

                        {/* Download Video */}
                        <button
                          disabled={!shop.websiteSettings.enableVideoDownloads || !hasVideo}
                          onClick={() => handleDownloadFile(product.productVideo || "", `${product.model}_demonstration.mp4`)}
                          className="flex flex-col items-center justify-center p-2 border border-[#2A2A2A] bg-black text-zinc-300 hover:text-white rounded-xl text-[10px] font-bold cursor-pointer transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          <Video className="w-4 h-4 text-zinc-400 mb-1" />
                          <span>Video</span>
                        </button>

                      </div>

                    </div>
                  </div>

                </div>
              );
            })}
          </div>
        )}

      </main>

      {/* Video Player Modal */}
      {selectedVideoUrl && (
        <VideoPlayerModal
          isOpen={isVideoModalOpen}
          videoUrl={selectedVideoUrl}
          onClose={() => {
            setIsVideoModalOpen(false);
            setSelectedVideoUrl(null);
          }}
        />
      )}

      {/* FOOTER */}
      <footer className="bg-[#121212] border-t border-[#2A2A2A] py-8 px-6 text-center text-zinc-500 text-xs tracking-tight mt-12 shrink-0">
        <p className="font-mono text-[10px]">POWERED BY RESTOCKR v2.0 • NIGERIAN GADGET BUSINESS OPERATING SYSTEM</p>
      </footer>

    </div>
  );
}
