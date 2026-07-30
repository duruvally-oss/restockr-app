import React, { useState, useEffect, useRef } from "react";
import { Product, Sale, Staff, Category, Customer, AuditLog } from "../types";
import { 
  Send, Check, CheckCheck, Smartphone, UserCheck, AlertOctagon, HelpCircle, 
  RefreshCw, Trash2, Edit, ShoppingCart, Eye, ExternalLink, Share2, Info, 
  ArrowRight, ArrowLeft, Play, Plus, UserPlus, History, ClipboardList, ShieldAlert,
  Menu, Package, Receipt
} from "lucide-react";
import { DEVICE_DATABASE, CATEGORY_BRANDS, parseShortenedPriceToNumber, getCategoryQuickTags, getCategoryPlaceholder, WARRANTY_OPTIONS } from "../lib/deviceDb";
import { db } from "../lib/database";
import { uploadFileToSupabase } from "../lib/supabase";
import { VideoPlayerModal } from "./VideoPlayerModal";
import { ImageGalleryModal } from "./ImageGalleryModal";
import QuickTagsBadgeList from "./QuickTagsBadgeList";

interface WhatsAppEmulatorProps {
  shopId?: string;
  products: Product[];
  sales: Sale[];
  staffList: Staff[];
  onSaveProduct: (p: Product) => void;
  onSaveSale: (s: Sale) => void;
  onUndoLastSale: (shopId: string, saleId: string, performer: string) => { success: boolean; message: string };
  isExpired: boolean;
}

interface Message {
  id: string;
  sender: "user" | "bot";
  text: string;
  timestamp: string;
  status: "sent" | "delivered" | "read";
  // Rich payload flags for visual layout overlays in chat
  type?: "text" | "inventory_list" | "recent_sales" | "activity_log";
  productsData?: Product[];
  recentSalesData?: Sale[];
  auditLogsData?: AuditLog[];
}

type FlowType = 
  | "none" 
  | "add_product" 
  | "sell_product" 
  | "find_product" 
  | "update_product"
  | "recent_sales"
  | "activity_log"
  | "help";

interface SessionState {
  currentFlow: FlowType;
  step: number;
  data: Record<string, any>;
}

export default function WhatsAppEmulator({
  shopId = "shop-autogadget",
  products,
  sales,
  staffList,
  onSaveProduct,
  onSaveSale,
  onUndoLastSale,
  isExpired
}: WhatsAppEmulatorProps) {
  
  // Chat identities
  const [selectedSenderId, setSelectedSenderId] = useState<string>("owner");
  const [senderPhone, setSenderPhone] = useState("+2348031234567");
  const [senderName, setSenderName] = useState("Owner");

  // Chat Log State
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "msg-init-1",
      sender: "bot",
      text: "Hi, Welcome to RESTOCKR Assistant.\n\nWhat would you like to do today?",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      status: "read"
    }
  ]);

  const [inputText, setInputText] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  // Guided wizard flow state
  const [session, setSession] = useState<SessionState>({
    currentFlow: "none",
    step: 0,
    data: {}
  });

  // Track page offsets for compact visual listings
  const [inventoryPage, setInventoryPage] = useState(0);

  // High-fidelity Media Upload Tracking States
  const [uploading, setUploading] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [uploadStatusText, setUploadStatusText] = useState<string>("Uploading media...");
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [uploadedVideo, setUploadedVideo] = useState<string>("");

  // Media & Quick Menu Modals
  const [selectedVideoUrl, setSelectedVideoUrl] = useState<string | null>(null);
  const [isVideoModalOpen, setIsVideoModalOpen] = useState<boolean>(false);
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [isImageModalOpen, setIsImageModalOpen] = useState<boolean>(false);
  const [isQuickMenuOpen, setIsQuickMenuOpen] = useState<boolean>(false);
  const [viewingDetailProduct, setViewingDetailProduct] = useState<Product | null>(null);

  // Assistant Draft Preservation
  const DRAFT_STORAGE_KEY = `restockr_assistant_draft_${shopId}_${senderPhone.replace(/\+/g, "")}`;

  const clearAssistantDraft = () => {
    try {
      localStorage.removeItem(DRAFT_STORAGE_KEY);
      localStorage.removeItem(`restockr_assistant_draft_${shopId}`);
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith("restockr_assistant_draft_")) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(k => localStorage.removeItem(k));
    } catch (e) {
      console.warn("Assistant draft clear failed", e);
    }
  };

  const saveAssistantDraft = (
    flow: FlowType, 
    step: number, 
    data: any, 
    images: string[] = uploadedImages, 
    video: string = uploadedVideo
  ) => {
    if (flow === "none" || step === 0) {
      clearAssistantDraft();
      return;
    }
    try {
      localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify({
        flow,
        step,
        data,
        uploadedImages: images,
        uploadedVideo: video,
        senderPhone,
        completed: false,
        updatedAt: new Date().toISOString()
      }));
    } catch (e) {
      console.warn("Assistant draft save failed", e);
    }
  };

  const getAssistantDraft = (): { 
    flow: FlowType; 
    step: number; 
    data: any; 
    uploadedImages?: string[];
    uploadedVideo?: string;
    senderPhone: string;
    completed?: boolean;
  } | null => {
    try {
      const item = localStorage.getItem(DRAFT_STORAGE_KEY);
      if (!item) return null;
      const parsed = JSON.parse(item);
      if (!parsed || parsed.flow === "none" || parsed.step <= 0 || parsed.completed) {
        clearAssistantDraft();
        return null;
      }
      return parsed;
    } catch {
      return null;
    }
  };

  // Component-level sender status and permissions
  const isOwner = selectedSenderId === "owner";
  const staffProfile = staffList.find(
    s => s.id === selectedSenderId || s.phoneNumber.replace(/\s+/g, "") === senderPhone.replace(/\s+/g, "")
  );

  // Dynamic sender details mapper
  useEffect(() => {
    if (selectedSenderId === "owner") {
      setSenderPhone("+2348031234567");
      setSenderName("Owner");
    } else if (selectedSenderId === "unknown") {
      setSenderPhone("+2348123456789");
      setSenderName("Unknown Visitor");
    } else {
      const found = staffList.find(s => s.id === selectedSenderId);
      if (found) {
        setSenderPhone(found.phoneNumber);
        setSenderName(found.fullName);
      } else {
        setSenderPhone("+2348031234567");
        setSenderName("Owner");
        setSelectedSenderId("owner");
      }
    }
  }, [selectedSenderId, staffList]);

  // Scroll to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Reset session when switching user to avoid cross-talk bugs
  const resetMediaUploadStates = () => {
    setUploading(false);
    setUploadProgress(0);
    setUploadError(null);
    setUploadedImages([]);
    setUploadedVideo("");
  };

  const showConfirmationSummary = (currentData: any) => {
    const imagesCount = uploadedImages.length;
    const hasVideo = !!uploadedVideo;
    
    let mediaStatus = "Default Catalog Image 🖼";
    if (hasVideo && imagesCount > 0) {
      mediaStatus = `Custom Video 📹 + ${imagesCount} Photos 🖼`;
    } else if (hasVideo) {
      mediaStatus = "Custom Video 📹";
    } else if (imagesCount > 0) {
      mediaStatus = `${imagesCount} Custom Photos 🖼`;
    }

    const summary = `📋 *RESTOCKR STOCK INTAKE SUMMARY*

• *Category:* ${currentData.category}
• *Device:* ${currentData.brand} ${currentData.model}
• *Specs:* ${currentData.storage} ${currentData.ram ? `/ ${currentData.ram} RAM` : ""} ${currentData.processor ? `(${currentData.processor})` : ""}
• *Color:* ${currentData.color || "Skipped"}
• *Price:* ₦${Number(currentData.sellingPrice).toLocaleString()}
• *Condition:* ${(currentData.condition || []).join(", ") || "Clean Device"}
• *Battery Health:* ${currentData.batteryHealth || "N/A"}
• *Warranty:* ${currentData.warranty || "No Warranty"}
• *Media Attachment:* ${mediaStatus}

Confirm to commit this product directly to your database:`;

    addBotMessageOnly(summary);
  };

  const handleMediaUpload = async (file: File, fileType: "image" | "video") => {
    if (uploading) return;
    setUploading(true);
    setUploadError(null);
    setUploadProgress(10);
    setUploadStatusText(fileType === "video" ? "Uploading video..." : "Uploading images...");
    
    // Progress simulation interval
    const progressInterval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 80) {
          setUploadStatusText("Processing media...");
          clearInterval(progressInterval);
          return 85;
        }
        return prev + 15;
      });
    }, 150);

    try {
      const url = await uploadFileToSupabase(file, fileType);
      clearInterval(progressInterval);
      setUploadProgress(100);
      setUploadStatusText("Upload Complete ✅");
      
      await new Promise(resolve => setTimeout(resolve, 300));
      
      if (fileType === "video") {
        setUploadedVideo(url);
        const updatedData = { ...session.data, productVideo: url, productImages: uploadedImages };
        setSession(prev => ({ ...prev, data: updatedData }));
        saveAssistantDraft(session.currentFlow, session.step, updatedData);
        addBotMessageOnly(`📹 *PRODUCT VIDEO ATTACHED*\n\nVideo clip uploaded successfully.\n\n*Add Media*\nWhat would you like to upload next?\n\nTap *Photos* to attach photos, *Video* to replace video, or *Continue* when finished.`);
      } else {
        const nextImages = [...uploadedImages, url];
        setUploadedImages(nextImages);
        const updatedData = { ...session.data, productImages: nextImages, productVideo: uploadedVideo };
        setSession(prev => ({ ...prev, data: updatedData }));
        saveAssistantDraft(session.currentFlow, session.step, updatedData);
        addBotMessageOnly(`📷 *IMAGE #${nextImages.length} ATTACHED*\n\nPhoto uploaded successfully.\n\n*Add Media*\nWhat would you like to upload next?\n\nTap *Photos* to add more photos, *Video* to attach a video clip, or *Continue* when finished.`);
      }
    } catch (err: any) {
      clearInterval(progressInterval);
      setUploadError(err.message || "Upload failed");
      addBotMessageOnly(`⚠️ *UPLOAD ISSUE*\n\nCould not process attachment: ${err.message || "Network error"}. Please tap Photo or Video to try again, or tap Skip.`);
    } finally {
      setUploading(false);
    }
  };

  useEffect(() => {
    const draft = getAssistantDraft();
    if (draft && draft.flow && draft.flow !== "none" && draft.step > 0 && !draft.completed) {
      setSession({
        currentFlow: draft.flow,
        step: draft.step,
        data: draft.data || {}
      });
      const restoredImgs = draft.uploadedImages || draft.data?.productImages || [];
      const restoredVid = draft.uploadedVideo || draft.data?.productVideo || "";
      setUploadedImages(restoredImgs);
      setUploadedVideo(restoredVid);
      
      const deviceLabel = draft.data?.brand ? `${draft.data.brand} ${draft.data.model || ""}`.trim() : "Device";
      addBotMessageOnly(`🔄 *DRAFT RESTORED*\n\nResuming saved stock intake for *${deviceLabel}* at Step ${draft.step}.\n\nType or tap options below to continue.`);
    } else {
      clearAssistantDraft();
      setSession({ currentFlow: "none", step: 0, data: {} });
      resetMediaUploadStates();
    }
  }, [selectedSenderId, senderPhone]);

  const addMessagePair = (userText: string, botResponseText: string, extra?: Partial<Message>) => {
    const uniqueSuffix = Math.random().toString(36).substring(2, 9);
    const userMsg: Message = {
      id: `msg-${Date.now()}-${uniqueSuffix}-u`,
      sender: "user",
      text: userText,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      status: "read"
    };

    const botMsg: Message = {
      id: `msg-${Date.now()}-${uniqueSuffix}-b`,
      sender: "bot",
      text: botResponseText,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      status: "read",
      ...extra
    };

    setMessages(prev => [...prev, userMsg, botMsg]);
  };

  const addBotMessageOnly = (text: string, extra?: Partial<Message>) => {
    const uniqueSuffix = Math.random().toString(36).substring(2, 9);
    const botMsg: Message = {
      id: `msg-${Date.now()}-${uniqueSuffix}-b`,
      sender: "bot",
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      status: "read",
      ...extra
    };
    setMessages(prev => [...prev, botMsg]);
  };

  const handleSendMessage = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanText = inputText.trim();
    if (!cleanText) return;

    setInputText("");
    processWhatsAppCommand(cleanText);
  };

  // Main command evaluator with NLP trigger matching and role authorization guards
  const processWhatsAppCommand = (text: string) => {
    const textLower = text.toLowerCase().trim();

    // 1. Subscription check
    if (isExpired) {
      addMessagePair(
        text,
        "⚠️ *RESTOCKR SECURITY LOCKOUT*\nYour shop subscription has expired. The WhatsApp Assistant is locked. Please renew your plan on the Owner Dashboard to resume operations."
      );
      return;
    }

    // 2. Sender identification & authorization guards
    if (!isOwner) {
      if (!staffProfile) {
        addMessagePair(
          text,
          `❌ *ACCESS BLOCKED*\nThe number *${senderPhone}* is not recognized as registered staff. Register this number via the owner dashboard to enable mobile operations.`
        );
        return;
      }

      if (staffProfile.status === "Suspended") {
        addMessagePair(
          text,
          "❌ *RESTOCKR SECURITY ALERT*\nYour staff access has been suspended. Please contact the business owner to re-enable your profile."
        );
        return;
      }
    }

    const hasPermission = (key: keyof typeof staffProfile.permissions): boolean => {
      if (isOwner) return true;
      if (!staffProfile) return false;
      return !!staffProfile.permissions[key];
    };

    const permissionRejectedMessage = "You don't have permission to perform this action. Please contact your shop owner.";

    // Global navigation intercepts
    if (textLower === "menu" || textLower === "🏠 menu" || textLower === "home") {
      handleNavigation("home");
      return;
    }
    if (textLower === "back" || textLower === "⬅ back" || textLower === "◀️ back" || textLower === "prev") {
      handleNavigation("back");
      return;
    }
    if (textLower === "cancel" || textLower === "❌ cancel" || textLower === "close") {
      handleNavigation("close");
      return;
    }

    // Process Active Wizards
    if (session.currentFlow === "view_inventory") {
      if (textLower.includes("available")) {
        const available = products.filter(p => p.status !== "SOLD" && p.quantity > 0);
        addMessagePair(
          text,
          `📦 *Available Stock*\nOnly showing active products that can still be sold:`,
          { type: "inventory_list", productsData: available }
        );
        return;
      }
      if (textLower.includes("sold")) {
        const sold = products.filter(p => p.status === "SOLD");
        addMessagePair(
          text,
          `🔴 *Sold Products*\nOnly showing completed sales:`,
          { type: "inventory_list", productsData: sold }
        );
        return;
      }
      if (textLower.includes("all items") || textLower === "all") {
        addMessagePair(
          text,
          `📁 *All Items*\nShowing complete store catalog:`,
          { type: "inventory_list", productsData: products }
        );
        return;
      }
    }

    if (session.currentFlow === "add_product") {
      handleAddProductFlow(text, hasPermission, permissionRejectedMessage);
      return;
    }
    if (session.currentFlow === "sell_product") {
      handleSellProductFlow(text, hasPermission, permissionRejectedMessage);
      return;
    }
    if (session.currentFlow === "find_product") {
      handleFindProductFlow(text, hasPermission, permissionRejectedMessage);
      return;
    }
    if (session.currentFlow === "update_product") {
      handleUpdateProductFlow(text, hasPermission, permissionRejectedMessage);
      return;
    }

    // 4. MAIN MENU / FREE-TEXT NLP TRIGGERS (Only when flow is "none")

    // Intelligent NLP: "I want to add an iPhone"
    if (
      textLower.includes("add") && 
      (textLower.includes("product") || textLower.includes("phone") || textLower.includes("iphone") || textLower.includes("laptop") || textLower.includes("tablet") || textLower.includes("watch"))
    ) {
      if (!hasPermission("addProduct")) {
        addMessagePair(text, `❌ ${permissionRejectedMessage}`);
        return;
      }

      // Extract specific model template if mentioned
      let matchedModel = null;
      let detectedCat = Category.Phones;

      // Smart category mapping
      if (textLower.includes("laptop") || textLower.includes("macbook")) detectedCat = Category.Laptops;
      else if (textLower.includes("tablet") || textLower.includes("ipad")) detectedCat = Category.Tablets;
      else if (textLower.includes("watch")) detectedCat = Category.SmartWatches;
      else if (textLower.includes("console") || textLower.includes("ps5") || textLower.includes("xbox")) detectedCat = Category.GameConsoles;
      else if (textLower.includes("airpods") || textLower.includes("buds")) detectedCat = Category.Accessories;

      // Look for a known model name matching user text
      for (const model of DEVICE_DATABASE) {
        if (textLower.includes(model.name.toLowerCase())) {
          matchedModel = model;
          break;
        }
      }

      if (matchedModel) {
        setSession({
          currentFlow: "add_product",
          step: 3, // skip to storage selection because category & model are known!
          data: {
            category: matchedModel.category,
            brand: matchedModel.brand,
            model: matchedModel.name,
            template: matchedModel
          }
        });
        addMessagePair(
          text,
          `📱 *Guided Stock Intake (NLP Autodetect)*\n\n• *Category:* ${matchedModel.category}\n• *Product:* ${matchedModel.brand} ${matchedModel.name}\n\nSelect official storage capacity option below:`
        );
      } else {
        setSession({ currentFlow: "add_product", step: 1, data: {} });
        addMessagePair(
          text,
          "📱 *Guided Stock Intake*\n\nChoose the device category:"
        );
      }
      return;
    }

    // Intelligent NLP: "I sold an iPhone"
    if (textLower.includes("sold") || textLower.includes("sell") || textLower.includes("sale")) {
      if (!hasPermission("sellProduct")) {
        addMessagePair(text, `❌ ${permissionRejectedMessage}`);
        return;
      }

      // Try to find a matching product that has stock
      const inStock = products.filter(p => p.quantity > 0);
      let foundProd = null;
      for (const p of inStock) {
        const fullName = `${p.brand} ${p.model}`.toLowerCase();
        if (textLower.includes(fullName) || textLower.includes(p.model.toLowerCase())) {
          foundProd = p;
          break;
        }
      }

      if (foundProd) {
        setSession({
          currentFlow: "sell_product",
          step: 2, // jump straight to walk-in sale review
          data: { product: foundProd }
        });
        addMessagePair(
          text,
          `🛒 *Walk-in Sale Logger (NLP Autodetect)*\n\nLet's record the sale of this matching device:\n• *Device:* ${foundProd.brand} ${foundProd.model} (${foundProd.storage})\n• *Price:* ₦${foundProd.sellingPrice.toLocaleString()}`
        );
      } else {
        const available = products.filter(p => p.quantity > 0);
        if (available.length === 0) {
          addMessagePair(text, "⚠️ No products currently in stock to record walk-in sales.");
          return;
        }
        setSession({ currentFlow: "sell_product", step: 1, data: {} });
        addMessagePair(
          text,
          "🛒 *Fast Sale Logger*\n\nSelect a device from available inventory:"
        );
      }
      return;
    }

    // Intelligent NLP: "Find my HP laptop"
    if (textLower.startsWith("find ") || textLower.startsWith("search ") || textLower.startsWith("lookup ")) {
      if (!hasPermission("checkPrices") && !hasPermission("viewProductDetails")) {
        addMessagePair(text, `❌ ${permissionRejectedMessage}`);
        return;
      }

      // Extract search query
      const query = text.replace(/^(find|search|lookup|my|for|a|an)\s+/gi, "").trim();
      if (query) {
        const matches = products.filter(p => 
          p.brand.toLowerCase().includes(query.toLowerCase()) || 
          p.model.toLowerCase().includes(query.toLowerCase()) ||
          p.storage.toLowerCase().includes(query.toLowerCase())
        );

        if (matches.length === 0) {
          setSession({ currentFlow: "find_product", step: 1, data: {} });
          addMessagePair(
            text,
            `🔍 *Search Results*\nNo active inventory matches "${query}".\n\nTry searching again:`,
            { type: "text" }
          );
        } else {
          setSession({ currentFlow: "find_product", step: 2, data: { matches, query } });
          addMessagePair(
            text,
            `🔍 *Search Results for "${query}"*\nSelect a matching product below:`,
            { type: "text" }
          );
        }
      } else {
        setSession({ currentFlow: "find_product", step: 1, data: {} });
        addMessagePair(
          text,
          "🔍 *Search Catalog*\n\nEnter search query (e.g. iPhone, 256GB, or Clean Device):"
        );
      }
      return;
    }

    // Precise Button Command matching
    if (textLower === "add product") {
      if (!hasPermission("addProduct")) {
        addMessagePair(text, `❌ ${permissionRejectedMessage}`);
        return;
      }
      resetMediaUploadStates();
      setSession({ currentFlow: "add_product", step: 1, data: {} });
      addMessagePair(text, "📱 *Guided Stock Intake*\n\nChoose the device category:");
      return;
    }

    if (textLower === "sell product") {
      if (!hasPermission("sellProduct")) {
        addMessagePair(text, `❌ ${permissionRejectedMessage}`);
        return;
      }
      const liveProducts = db.getProducts(shopId);
      const available = liveProducts.filter(p => p.quantity > 0 && p.status === "Available");
      if (available.length === 0) {
        addMessagePair(text, "⚠️ No products currently in stock to sell.");
        return;
      }
      setSession({ currentFlow: "sell_product", step: 1, data: {} });
      addMessagePair(text, "🛒 *Fast Sale Logger*\n\nSelect a device from available inventory:");
      return;
    }

    if (textLower === "find product") {
      if (!hasPermission("checkPrices") && !hasPermission("viewProductDetails")) {
        addMessagePair(text, `❌ ${permissionRejectedMessage}`);
        return;
      }
      setSession({ currentFlow: "find_product", step: 1, data: {} });
      addMessagePair(text, "🔍 *Search Catalog*\n\nEnter search query (e.g. iPhone, 256GB, or Clean Device) or select a category below:");
      return;
    }

    if (textLower.startsWith("update product") || textLower.startsWith("edit product")) {
      if (!hasPermission("editProduct")) {
        addMessagePair(text, `❌ ${permissionRejectedMessage}`);
        return;
      }
      const liveProducts = db.getProducts(shopId);
      if (liveProducts.length === 0) {
        addMessagePair(text, "⚠️ No active inventory items found to update.");
        return;
      }

      // Check if bracketed product name is present, e.g. "Update Product [iPhone 13]"
      const bracketMatch = text.match(/\[(.*?)\]/);
      if (bracketMatch) {
        const query = bracketMatch[1].trim().toLowerCase();
        const found = liveProducts.find(p => `${p.brand} ${p.model}`.toLowerCase().includes(query) || p.model.toLowerCase().includes(query));
        if (found) {
          setSession({ currentFlow: "update_product", step: 2, data: { product: found } });
          addMessagePair(text, `Loaded Product: *${found.brand} ${found.model}* (₦${found.sellingPrice.toLocaleString()})\n\nSelect specification category to update:`);
          return;
        }
      }

      setSession({ currentFlow: "update_product", step: 1, data: {} });
      addMessagePair(text, "⚙️ *Update Stock Spec*\n\nEnter product name or model to search, or select from options below:");
      return;
    }

    if (textLower === "view inventory") {
      if (!hasPermission("viewInventory")) {
        addMessagePair(text, `❌ ${permissionRejectedMessage}`);
        return;
      }
      setSession({ currentFlow: "view_inventory", step: 1, data: {} });
      addMessagePair(
        text, 
        `📋 *RESTOCKR Assistant Inventory*\n\nSelect an option below to view your catalog deck:\n\n• *Available Stock* - Products currently on sale\n• *Sold Products* - Completed sales transactions\n• *All Items* - Complete catalog (both available and sold)`
      );
      return;
    }

    if (textLower === "recent sales") {
      addMessagePair(text, "❌ *Recent Sales* has been removed from the Assistant. Complete sales history is available inside the main web application dashboard.");
      return;
    }

    if (textLower === "activity log") {
      if (!isOwner) {
        addMessagePair(text, "❌ *PERMISSION DENIED*\nOnly the store Owner can audit active staff operations.");
        return;
      }
      const logs = db.getAuditLogs(shopId);
      addMessagePair(
        text, 
        "📝 *Store Activity Log Timeline*\nShowing newest staff actions first:",
        { type: "activity_log", auditLogsData: logs }
      );
      return;
    }

    if (textLower === "help") {
      addMessagePair(
        text,
        "💡 *RESTOCKR Assistant Guide*\n\nI am your automated, direct-sync WhatsApp store manager. Tap quick actions or type commands to manage stock ledger offline:\n\n• *Add Product* - Assisted device stock intake\n• *View Inventory* - Open catalog deck to Sell, Edit, or Delete\n• *Recent Sales* - Walk-in transactions history & refund reversals\n• *Activity Log* - Store operations audit logs"
      );
      return;
    }

    // Default Help Guide if free-text query isn't matched
    addMessagePair(
      text,
      `Hi, Welcome to RESTOCKR Assistant.\n\nI didn't recognize your query *"${text}"*.\n\nWhat would you like to do today?`
    );
  };

  // ----------------------------------------------------
  // NAVIGATION HANDLER FOR BACK/HOME/CLOSE ACTIONS
  // ----------------------------------------------------
  const handleNavigation = (action: "back" | "home" | "close") => {
    if (action === "home") {
      clearAssistantDraft();
      resetMediaUploadStates();
      setSession({ currentFlow: "none", step: 0, data: {} });
      addBotMessageOnly("🏠 *Returned to Home Main Menu*.\nChoose a new action below:");
      return;
    }

    if (action === "close") {
      clearAssistantDraft();
      resetMediaUploadStates();
      setSession({ currentFlow: "none", step: 0, data: {} });
      addBotMessageOnly("❌ *Transaction / Workflow Cancelled*.\nReturned to main menu.");
      return;
    }

    if (action === "back") {
      const { currentFlow, step, data } = session;
      let prevStep = 1;

      if (currentFlow === "add_product") {
        if (step === 15) prevStep = 1;
        else if (step === 2) prevStep = 15;
        else if (step === 3) prevStep = 2;
        else if (step === 35) prevStep = 3;
        else if (step === 4) prevStep = 35;
        else if (step === 45) prevStep = 4;
        else if (step === 5) prevStep = 45;
        else if (step === 6) prevStep = 5;
        else if (step === 7) prevStep = 6;
        else if (step === 8) prevStep = 7;
        else if (step === 9) prevStep = 8;
        else if (step === 10) prevStep = 9;
        else if (step === 11) prevStep = 10;
        else prevStep = 1;

        setSession({ currentFlow, step: prevStep, data });
        addBotMessageOnly(`◀️ *Returned to Step ${prevStep}*`);
      } else if (currentFlow === "update_product") {
        if (step === 15) prevStep = 1;
        else if (step === 2) prevStep = 1;
        else if (step >= 31) prevStep = 2;
        else prevStep = 1;

        setSession({ currentFlow, step: prevStep, data });
        addBotMessageOnly(`◀️ *Returned to Step ${prevStep}*`);
      } else if (currentFlow === "sell_product") {
        if (step === 2) prevStep = 1;
        else if (step === 3) prevStep = 2;
        else if (step === 4) prevStep = 3;
        else if (step === 5) prevStep = 4;
        else if (step === 55) prevStep = 5;
        else prevStep = 1;

        setSession({ currentFlow, step: prevStep, data });
        addBotMessageOnly(`◀️ *Returned to Fast Sale Step ${prevStep}*`);
      } else if (currentFlow === "find_product") {
        if (step === 2) prevStep = 1;
        else if (step === 3) prevStep = 2;
        else prevStep = 1;

        setSession({ currentFlow, step: prevStep, data });
        addBotMessageOnly(`◀️ *Returned to Search Step ${prevStep}*`);
      }
    }
  };

  // ----------------------------------------------------
  // ADD PRODUCT WIZARD FLOW STATE MACHINE
  // ----------------------------------------------------
  const handleAddProductFlow = (text: string, hasPermission: Function, rejection: string) => {
    if (!hasPermission("addProduct")) {
      setSession({ currentFlow: "none", step: 0, data: {} });
      addBotMessageOnly(`❌ ${rejection}`);
      return;
    }

    const step = session.step;
    const data = { ...session.data };
    const textLower = text.toLowerCase().trim();

    // Step 1: Category Selection
    if (step === 1) {
      let selectedCat = Category.Phones;
      if (textLower.includes("tablet") || text === "2") selectedCat = Category.Tablets;
      else if (textLower.includes("laptop") || text === "3") selectedCat = Category.Laptops;
      else if (textLower.includes("watch") || text === "4") selectedCat = Category.SmartWatches;
      else if (textLower.includes("console") || text === "5") selectedCat = Category.GameConsoles;
      else if (textLower.includes("accessories") || text === "6") selectedCat = Category.Accessories;

      data.category = selectedCat;
      setSession({ currentFlow: "add_product", step: 15, data });
      addBotMessageOnly(`Selected Category: *${selectedCat}*\n\nSelect or type Brand (e.g. Apple, Samsung, Tecno):`);
      return;
    }

    // Step 1.5: Brand Selection
    if (step === 15) {
      data.brand = text;
      setSession({ currentFlow: "add_product", step: 2, data });
      addBotMessageOnly(`Selected Brand: *${text}*\n\nChoose model template suggestion or select Custom:`);
      return;
    }

    // Step 2: Model Selection
    if (step === 2) {
      if (textLower === "custom model" || textLower === "other" || textLower === "custom") {
        setSession({ currentFlow: "add_product", step: 25, data });
        addBotMessageOnly("Type the Custom Model of the device (e.g. Galaxy S25 Ultra or Google Pixel 8 Pro):");
        return;
      }

      // Look up pre-defined model matching selected brand
      const template = DEVICE_DATABASE.find(
        d => d.category === data.category && 
             d.brand.toLowerCase() === data.brand.toLowerCase() && 
             (d.name.toLowerCase() === textLower || textLower.includes(d.name.toLowerCase()))
      );

      if (template) {
        data.model = template.name;
        data.template = template;
        setSession({ currentFlow: "add_product", step: 3, data });
        addBotMessageOnly(`Loaded Product: *${template.brand} ${template.name}*\n\nSelect Storage capacity size:`);
      } else {
        data.model = text;
        setSession({ currentFlow: "add_product", step: 3, data });
        addBotMessageOnly(`Configured Model: *${text}*\n\nSelect Storage capacity option:`);
      }
      return;
    }

    // Step 2.5: Custom Model text input
    if (step === 25) {
      data.model = text;
      setSession({ currentFlow: "add_product", step: 3, data });
      addBotMessageOnly(`Configured Custom Model: *${text}*\n\nSelect Storage capacity option:`);
      return;
    }

    // Step 3: Choose Storage
    if (step === 3) {
      if (textLower === "custom") {
        setSession({ currentFlow: "add_product", step: 301, data });
        addBotMessageOnly("Type custom storage capacity size (e.g. 2TB, 128GB Flash, 512GB SSD):");
        return;
      }
      data.storage = textLower === "skip" ? "Standard" : text;
      
      // Determine if there are official rams or if it's a Laptop
      const hasRams = data.template && data.template.rams && data.template.rams.length > 0;
      if (data.category === Category.Laptops || hasRams) {
        setSession({ currentFlow: "add_product", step: 35, data });
        addBotMessageOnly("Choose RAM size option:");
      } else {
        setSession({ currentFlow: "add_product", step: 4, data });
        addBotMessageOnly("Choose Colour option:");
      }
      return;
    }

    if (step === 301) {
      data.storage = textLower === "skip" ? "Standard" : text;
      const hasRams = data.template && data.template.rams && data.template.rams.length > 0;
      if (data.category === Category.Laptops || hasRams) {
        setSession({ currentFlow: "add_product", step: 35, data });
        addBotMessageOnly("Choose RAM size option:");
      } else {
        setSession({ currentFlow: "add_product", step: 4, data });
        addBotMessageOnly("Choose Colour option:");
      }
      return;
    }

    // Step 3.5: Choose RAM
    if (step === 35) {
      if (textLower === "custom") {
        setSession({ currentFlow: "add_product", step: 351, data });
        addBotMessageOnly("Type custom RAM capacity (e.g. 24GB, 64GB):");
        return;
      }
      data.ram = textLower === "skip" ? "" : text;
      setSession({ currentFlow: "add_product", step: 4, data });
      addBotMessageOnly("Choose Colour option:");
      return;
    }

    if (step === 351) {
      data.ram = textLower === "skip" ? "" : text;
      setSession({ currentFlow: "add_product", step: 4, data });
      addBotMessageOnly("Choose Colour option:");
      return;
    }

    // Step 4: Choose Colour
    if (step === 4) {
      if (textLower === "custom") {
        setSession({ currentFlow: "add_product", step: 401, data });
        addBotMessageOnly("Type custom device colour:");
        return;
      }
      data.color = textLower === "skip" ? "Default" : text;
      if (data.category === Category.Laptops) {
        setSession({ currentFlow: "add_product", step: 45, data });
        addBotMessageOnly("Choose Processor type:");
      } else {
        setSession({ currentFlow: "add_product", step: 5, data });
        addBotMessageOnly("Choose Selling Price (₦) or tap a quick chip:");
      }
      return;
    }

    if (step === 401) {
      data.color = textLower === "skip" ? "Default" : text;
      if (data.category === Category.Laptops) {
        setSession({ currentFlow: "add_product", step: 45, data });
        addBotMessageOnly("Choose Processor type:");
      } else {
        setSession({ currentFlow: "add_product", step: 5, data });
        addBotMessageOnly("Choose Selling Price (₦) or tap a quick chip:");
      }
      return;
    }

    // Step 4.5: Choose Processor
    if (step === 45) {
      data.processor = textLower === "skip" ? "" : text;
      setSession({ currentFlow: "add_product", step: 5, data });
      addBotMessageOnly("Choose Selling Price (₦) or tap a quick chip:");
      return;
    }

    // Step 5: Choose Price
    if (step === 5) {
      let parsedPrice = parseShortenedPriceToNumber(text);
      if (parsedPrice === 0) {
        addBotMessageOnly("⚠️ Invalid price value. Please enter a valid amount (e.g. 500000 or 500K):");
        return;
      }
      data.sellingPrice = parsedPrice;
      setSession({ currentFlow: "add_product", step: 7, data });
      addBotMessageOnly(`Price set to: *₦${parsedPrice.toLocaleString()}*\n\nSelect Warranty period option:`);
      return;
    }

    // Step 6: Legacy step bypassed
    if (step === 6) {
      setSession({ currentFlow: "add_product", step: 7, data });
      addBotMessageOnly("Select Warranty period option:");
      return;
    }

    // Step 7: Choose Warranty
    if (step === 7) {
      if (textLower === "custom") {
        setSession({ currentFlow: "add_product", step: 701, data });
        addBotMessageOnly("Type custom warranty period (e.g. 1 Year Official Apple Warranty):");
        return;
      }
      data.warranty = textLower === "skip" ? "No Warranty" : text;
      setSession({ currentFlow: "add_product", step: 8, data });
      saveAssistantDraft("add_product", 8, data);
      addBotMessageOnly("Select device Condition Tag (Select one or multiple tags, or tap Done):");
      return;
    }

    if (step === 701) {
      data.warranty = textLower === "skip" ? "No Warranty" : text;
      setSession({ currentFlow: "add_product", step: 8, data });
      saveAssistantDraft("add_product", 8, data);
      addBotMessageOnly("Select device Condition Tag (Select one or multiple tags, or tap Done):");
      return;
    }

    // Step 8: Choose Condition Tags (Multi-Select Fix)
    if (step === 8) {
      const cleanTagText = text.replace(/^[✓\s\[\]]+/g, "").trim();
      const cleanLower = cleanTagText.toLowerCase();
      const availableTags = getCategoryQuickTags(data.category, data.brand);
      const selected = Array.isArray(data.condition) ? [...data.condition] : [];

      if ((cleanLower === "skip" || cleanLower === "done") && selected.length === 0) {
        data.condition = ["Clean Device"];
      } else if (cleanLower === "done" || cleanLower === "skip") {
        data.condition = selected.length > 0 ? selected : ["Clean Device"];
      } else if (cleanLower === "other") {
        setSession({ currentFlow: "add_product", step: 81, data });
        saveAssistantDraft("add_product", 81, data);
        addBotMessageOnly("Type custom quick condition tag:");
        return;
      } else {
        // Find matching tag ignoring checkmark formatting
        const matchedTag = availableTags.find(t => t.toLowerCase() === cleanLower) || cleanTagText;
        if (selected.includes(matchedTag)) {
          // Deselect tag
          const updated = selected.filter(t => t !== matchedTag);
          data.condition = updated;
          setSession({ currentFlow: "add_product", step: 8, data });
          saveAssistantDraft("add_product", 8, data);
          addBotMessageOnly(`Deselected: *${matchedTag}*\n\n*Selected Tags:* ${updated.length > 0 ? updated.join(", ") : "_None_"}\n\nSelect another tag or tap *Done* when finished.`);
          return;
        } else {
          // Select tag
          const updated = [...selected, matchedTag];
          data.condition = updated;
          setSession({ currentFlow: "add_product", step: 8, data });
          saveAssistantDraft("add_product", 8, data);
          addBotMessageOnly(`Selected: *${matchedTag}*\n\n*Selected Tags:* ${updated.join(", ")}\n\nSelect another tag or tap *Done* when finished.`);
          return;
        }
      }

      // Proceed to Battery Health or Media
      const isBatteryApplicable = data.category === Category.Phones && (data.brand || "").toLowerCase() === "apple";
      if (isBatteryApplicable) {
        setSession({ currentFlow: "add_product", step: 9, data });
        saveAssistantDraft("add_product", 9, data);
        addBotMessageOnly("Select Battery Health percentage:");
      } else {
        setSession({ currentFlow: "add_product", step: 10, data });
        saveAssistantDraft("add_product", 10, data);
        addBotMessageOnly(`*Add Media*\n\nWhat would you like to upload?`);
      }
      return;
    }

    if (step === 81) {
      const selected = Array.isArray(data.condition) ? [...data.condition] : [];
      const trimmed = text.trim();
      if (trimmed && trimmed.toLowerCase() !== "skip" && trimmed.toLowerCase() !== "done" && trimmed.toLowerCase() !== "other") {
        if (!selected.includes(trimmed)) {
          selected.push(trimmed);
        }
      }
      data.condition = selected;
      setSession({ currentFlow: "add_product", step: 8, data });
      saveAssistantDraft("add_product", 8, data);
      addBotMessageOnly(`Added Custom Tag: *${trimmed}*\n\n*Selected Tags:* ${selected.join(", ")}\n\nSelect another tag or tap *Done* when finished.`);
      return;
    }

    // Step 9: Choose Battery Health
    if (step === 9) {
      if (textLower === "custom") {
        setSession({ currentFlow: "add_product", step: 901, data });
        addBotMessageOnly("Type custom battery health percentage (e.g. 97% or Replaceable):");
        return;
      }
      data.batteryHealth = textLower === "skip" ? "" : text;
      setSession({ currentFlow: "add_product", step: 10, data });
      saveAssistantDraft("add_product", 10, data);
      addBotMessageOnly(`*Add Media*\n\nWhat would you like to upload?`);
      return;
    }

    if (step === 901) {
      data.batteryHealth = textLower === "skip" ? "" : text;
      setSession({ currentFlow: "add_product", step: 10, data });
      saveAssistantDraft("add_product", 10, data);
      addBotMessageOnly(`*Add Media*\n\nWhat would you like to upload?`);
      return;
    }

    // Step 10: Simplified Media Upload Section
    if (step === 10 || step === 101 || step === 102 || step === 103 || step === 104) {
      if (textLower === "skip" || textLower === "done" || textLower === "continue" || textLower === "⏭ skip") {
        const finalImages = uploadedImages;
        const finalVideo = uploadedVideo;
        data.productImages = finalImages;
        data.productVideo = finalVideo;
        setSession({ currentFlow: "add_product", step: 11, data });
        saveAssistantDraft("add_product", 11, data, finalImages, finalVideo);
        showConfirmationSummary(data);
      } else if (textLower.includes("photo") || text === "📷 Photos" || text === "Photos") {
        if (photoInputRef.current) photoInputRef.current.click();
      } else if (textLower.includes("video") || text === "🎥 Video" || text === "Video") {
        if (videoInputRef.current) videoInputRef.current.click();
      } else {
        addBotMessageOnly(`*Add Media*\n\nWhat would you like to upload?`);
      }
      return;
    }

    // Step 11: Confirmation Commit to Database
    if (step === 11) {
      if (textLower.includes("save") || textLower === "yes" || textLower === "confirm" || textLower.includes("commit")) {
        const finalVid = uploadedVideo || data.productVideo;

        // Build image list (preserve uploaded images without injecting demo placeholders if media was uploaded)
        let imagesList: string[] = [];
        if (uploadedImages && uploadedImages.length > 0) {
          imagesList = uploadedImages;
        } else if (data.productImages && Array.isArray(data.productImages) && data.productImages.length > 0) {
          imagesList = data.productImages;
        }

        try {
          // Double-check required validation fields
          if (!data.category || !data.brand || !data.model || !data.storage || !data.sellingPrice) {
            throw new Error("Required field validation failed. (Missing Category, Brand, Model, Storage, or Selling Price).");
          }

          const finalVariant = [data.color, data.ram ? `${data.ram} RAM` : "", data.processor].filter(Boolean).join(", ");

          // Create the real synchronized product record
          const newProduct: Product = {
            id: `prod-${Date.now()}`,
            shop_id: shopId,
            category: data.category,
            brand: data.brand,
            model: data.model,
            storage: data.storage,
            quantity: 1,
            sellingPrice: Number(data.sellingPrice),
            warranty: data.warranty || "No Warranty",
            condition: Array.isArray(data.condition) ? data.condition : ["Clean Device"],
            variant: finalVariant || undefined,
            batteryHealth: data.category === Category.Phones && data.brand.toLowerCase() === "apple" ? (data.batteryHealth || undefined) : undefined,
            productVideo: finalVid,
            productImages: imagesList,
            status: "Available",
            createdAt: new Date().toISOString()
          };

          // 1. Save directly to real database
          onSaveProduct(newProduct);

          // 2. Track Audit logs
          db.addAuditLog(
            shopId,
            senderName,
            senderPhone,
            "WhatsApp Stock Uploaded",
            `Committed product: ${newProduct.brand} ${newProduct.model} (${newProduct.storage}) @ ₦${newProduct.sellingPrice.toLocaleString()}`
          );

          // 3. Add System notifications
          db.addNotification(
            shopId,
            "WhatsApp Stock Intake Added",
            `${senderName} added ${newProduct.brand} ${newProduct.model} to store ledger via WhatsApp.`,
            "success"
          );

          // 4. DELETE ASSISTANT DRAFT IMMEDIATELY! (Guarantees completed product never reopens as draft)
          clearAssistantDraft();

          // 5. Reset wizard state
          setSession({ currentFlow: "none", step: 0, data: {} });
          resetMediaUploadStates();

          addBotMessageOnly(`✅ *Product Added Successfully*\n\nStock code *${newProduct.id}* is now live in your store database. Resellers and customers can view this item immediately.`);
        } catch (err: any) {
          addBotMessageOnly(`❌ *DATABASE INSERT FAILED*\n\nError: ${err.message || "Unable to write stock to database."}\n\nType/Tap *Retry* to try saving again, or *Cancel* to abort.`);
        }
      } else if (textLower === "edit" || textLower.includes("restart")) {
        clearAssistantDraft();
        resetMediaUploadStates();
        setSession({ currentFlow: "add_product", step: 1, data: {} });
        addBotMessageOnly("🔄 Restarting stock intake. Choose Category:");
      } else {
        clearAssistantDraft();
        resetMediaUploadStates();
        setSession({ currentFlow: "none", step: 0, data: {} });
        addBotMessageOnly("❌ Stock intake cancelled. Returned to main menu.");
      }
    }
  };

  // ----------------------------------------------------
  // SELL PRODUCT WIZARD FLOW STATE MACHINE
  // ----------------------------------------------------
  const handleSellProductFlow = (text: string, hasPermission: Function, rejection: string) => {
    if (!hasPermission("sellProduct")) {
      setSession({ currentFlow: "none", step: 0, data: {} });
      addBotMessageOnly(`❌ ${rejection}`);
      return;
    }

    const step = session.step;
    const data = { ...session.data };

    // Step 1: Product Selection
    if (step === 1) {
      if (text.toLowerCase().includes("search") || text.toLowerCase() === "other") {
        setSession({ currentFlow: "sell_product", step: 15, data });
        addBotMessageOnly("Type keywords to filter active stock (e.g., iPhone 13):");
        return;
      }

      const idx = parseInt(text) - 1;
      const liveProducts = db.getProducts(shopId);
      const inStock = data.list && data.list.length > 0
        ? data.list
        : liveProducts.filter(p => p.quantity > 0 && p.status === "Available");

      if (isNaN(idx) || idx < 0 || idx >= inStock.length) {
        addBotMessageOnly(`⚠️ Invalid index choice. Enter a number between 1 and ${inStock.length}:`);
        return;
      }

      const selected = inStock[idx];
      data.product = selected;
      setSession({ currentFlow: "sell_product", step: 2, data });
      
      const summary = `📋 *WALK-IN SALE REVIEW*

• *Device:* ${selected.brand} ${selected.model} (${selected.storage})
• *Price:* ₦${selected.sellingPrice.toLocaleString()}
• *Condition:* ${selected.condition?.join(", ") || "Clean Device"}

Do you want to continue recording the sale?`;

      addBotMessageOnly(summary);
      return;
    }

    // Step 1.5: Free-text Search Filter for product
    if (step === 15) {
      const query = text.toLowerCase().trim();
      const liveProducts = db.getProducts(shopId);
      const matches = liveProducts.filter(p => p.quantity > 0 && p.status === "Available" && (
        p.brand.toLowerCase().includes(query) || 
        p.model.toLowerCase().includes(query) ||
        p.storage.toLowerCase().includes(query) ||
        (p.category && p.category.toLowerCase().includes(query))
      ));

      if (matches.length === 0) {
        addBotMessageOnly(`❌ No active matching products found for "${text}". Try searching again:`);
      } else {
        // Feed matching products back as index selection options
        data.list = matches;
        setSession({ currentFlow: "sell_product", step: 1, data });
        const opts = matches.map((m, idx) => `*[${idx + 1}]* ${m.brand} ${m.model} (${m.storage}) - ₦${m.sellingPrice.toLocaleString()}`).join("\n");
        addBotMessageOnly(`🔍 Matches found:\n\n${opts}\n\nType the option number to select:`);
      }
      return;
    }

    // Step 2: Sale Review Confirmation
    if (step === 2) {
      if (text.toLowerCase().includes("continue") || text.toLowerCase() === "yes") {
        setSession({ currentFlow: "sell_product", step: 3, data });
        addBotMessageOnly("Enter walk-in Customer's Name:");
      } else {
        setSession({ currentFlow: "none", step: 0, data: {} });
        addBotMessageOnly("❌ Sale process cancelled.");
      }
      return;
    }

    // Step 3: Customer Name input
    if (step === 3) {
      data.customerName = text.toLowerCase() === "skip" ? "Walk-in Customer" : text;
      setSession({ currentFlow: "sell_product", step: 4, data });
      addBotMessageOnly("Enter walk-in Customer's Phone number:");
      return;
    }

    // Step 4: Customer Phone input
    if (step === 4) {
      data.customerPhone = text.toLowerCase() === "skip" ? "N/A" : text;
      setSession({ currentFlow: "sell_product", step: 5, data });
      addBotMessageOnly("Select Payment Method option:");
      return;
    }

    // Step 5: Payment Selection
    if (step === 5) {
      let payMethod: "Cash" | "Transfer" | "POS" | "Split" = "Transfer";
      
      if (text.toLowerCase() === "cash" || text === "1") payMethod = "Cash";
      else if (text.toLowerCase() === "pos" || text === "3") payMethod = "POS";
      else if (text.toLowerCase().includes("split") || text === "4") {
        setSession({ currentFlow: "sell_product", step: 55, data });
        addBotMessageOnly("Choose split combination option:");
        return;
      }

      data.payMethod = payMethod;
      completeSaleTransaction(data);
    }

    // Step 5.5: Split Payment Combination Choice
    if (step === 55) {
      data.payMethod = "Split";
      data.splitDesc = text; // Save split detail string (e.g. "Cash + Transfer")
      completeSaleTransaction(data);
    }
  };

  const completeSaleTransaction = (data: Record<string, any>) => {
    const prod = data.product as Product;
    const totalAmount = prod.sellingPrice * 1;

    // 1. Create walk-in Sale record
    const saleObj: Sale = {
      id: `rec-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
      shop_id: shopId,
      productId: prod.id,
      productName: `${prod.brand} ${prod.model} (${prod.storage})`,
      quantity: 1,
      unitPrice: prod.sellingPrice,
      totalAmount,
      paymentMethod: data.payMethod,
      customerName: data.customerName,
      customerPhone: data.customerPhone,
      soldBy: senderName,
      soldByPhone: senderPhone,
      createdAt: new Date().toISOString()
    };

    onSaveSale(saleObj);

    // 2. Decrement or update the product inventory quantity
    const updatedQty = Math.max(0, prod.quantity - 1);
    const updatedProd: Product = {
      ...prod,
      quantity: updatedQty,
      status: updatedQty === 0 ? "Sold Out" : "Available"
    };
    onSaveProduct(updatedProd);

    // 3. Clear session
    setSession({ currentFlow: "none", step: 0, data: {} });

    // 4. Trigger persistent shop alerts and audit trails
    db.addNotification(
      shopId,
      "Staff Logged Sale via WhatsApp",
      `${senderName} sold ${prod.brand} ${prod.model} to ${data.customerName} for ₦${totalAmount.toLocaleString()}`,
      "success"
    );

    db.addAuditLog(
      shopId,
      senderName,
      senderPhone,
      "WhatsApp Sale Recorded",
      `Walk-in Sale invoice registered: ${saleObj.id} for ${prod.brand} ${prod.model}`
    );

    // Add customer walk-in ledger if not already there
    const existingCustomers = db.getCustomers(shopId);
    const customerExists = existingCustomers.find(
      c => c.phoneNumber.replace(/\D/g, "") === data.customerPhone.replace(/\D/g, "")
    );
    if (!customerExists && data.customerPhone !== "N/A") {
      const newCust: Customer = {
        id: `cust-${Date.now()}`,
        shop_id: shopId,
        name: data.customerName,
        phoneNumber: data.customerPhone,
        purchaseCount: 1,
        totalSpent: totalAmount,
        notes: "Registered via WhatsApp Sale transaction"
      };
      db.saveCustomer(newCust);
    }

    const receiptMsg = `🎉 *WALK-IN SALE REGISTERED*

Invoice logged successfully in direct-sync database.

• *Receipt ID:* ${saleObj.id}
• *Device:* ${saleObj.productName}
• *Price:* ₦${saleObj.totalAmount.toLocaleString()}
• *Payment:* ${saleObj.paymentMethod} ${data.splitDesc ? `(${data.splitDesc})` : ""}
• *Customer:* ${saleObj.customerName} (${saleObj.customerPhone})
• *Sold By:* ${senderName}

Ledger updated instantly. Product stock decreased.`;

    addBotMessageOnly(receiptMsg);
  };

  // ----------------------------------------------------
  // FIND PRODUCT WIZARD FLOW STATE MACHINE
  // ----------------------------------------------------
  const handleFindProductFlow = (text: string, hasPermission: Function, rejection: string) => {
    if (!hasPermission("checkPrices") && !hasPermission("viewProductDetails")) {
      setSession({ currentFlow: "none", step: 0, data: {} });
      addBotMessageOnly(`❌ ${rejection}`);
      return;
    }

    const step = session.step;
    const data = { ...session.data };

    // Step 1: Perform query search
    if (step === 1) {
      const keyword = text.toLowerCase().trim();
      const liveProducts = db.getProducts(shopId);
      const matches = liveProducts.filter(p => 
        p.brand.toLowerCase().includes(keyword) || 
        p.model.toLowerCase().includes(keyword) ||
        p.storage.toLowerCase().includes(keyword) ||
        (p.category && p.category.toLowerCase().includes(keyword))
      );

      if (matches.length === 0) {
        setSession({ currentFlow: "find_product", step: 1, data: {} });
        addBotMessageOnly(`Product not found.\n\nTry searching again or type "Return Home":`);
      } else {
        setSession({ currentFlow: "find_product", step: 2, data: { matches, query: text } });
        const opts = matches.map((m, idx) => `*[${idx + 1}]* ${m.brand} ${m.model} (${m.storage}) - ₦${m.sellingPrice.toLocaleString()}`).join("\n");
        addBotMessageOnly(`🔍 Found ${matches.length} matches for "${text}":\n\n${opts}\n\nType the list number to inspect:`);
      }
      return;
    }

    // Step 2: Choose match
    if (step === 2) {
      if (text.toLowerCase() === "search again") {
        setSession({ currentFlow: "find_product", step: 1, data: {} });
        addBotMessageOnly("🔍 Enter search keyword (e.g. iPhone, 256GB, or Clean Device):");
        return;
      }

      const idx = parseInt(text) - 1;
      const list = data.matches as Product[];
      if (isNaN(idx) || idx < 0 || idx >= list.length) {
        addBotMessageOnly(`⚠️ Invalid choice. Select a number between 1 and ${list.length}:`);
        return;
      }

      const selected = list[idx];
      data.product = selected;
      setSession({ currentFlow: "find_product", step: 3, data });
      
      const details = `🔍 *PRODUCT SPECIFICATION CARD*

• *Device:* ${selected.brand} ${selected.model}
• *Storage:* ${selected.storage}
• *Price:* ₦${selected.sellingPrice.toLocaleString()}
• *Stock Code:* ${selected.id}
• *Current Stock:* ${selected.quantity > 0 ? `${selected.quantity} units` : "SOLD OUT 🔴"}
• *Condition:* ${selected.condition?.join(", ") || "Clean Device"}
• *Battery Health:* ${selected.batteryHealth || "N/A"}
• *Warranty Period:* ${selected.warranty || "No Warranty"}

Choose action below for this item:`;

      addBotMessageOnly(details);
      return;
    }

    // Step 3: Trigger action on search hit
    if (step === 3) {
      const selected = data.product as Product;
      if (text.toLowerCase() === "sell" || text === "Sell Product") {
        setSession({ currentFlow: "sell_product", step: 2, data: { product: selected } });
        addBotMessageOnly(`🛒 Entering walking-in sale workflow for *${selected.brand} ${selected.model}*.\n\nConfirm to continue:`);
      } else if (text.toLowerCase() === "edit" || text === "Edit Product") {
        setSession({ currentFlow: "update_product", step: 2, data: { product: selected } });
        addBotMessageOnly(`⚙️ Updating stock details for *${selected.brand} ${selected.model}*.\n\nSelect spec category to edit:`);
      } else if (text.toLowerCase() === "share" || text === "Share Quote") {
        setSession({ currentFlow: "none", step: 0, data: {} });
        const quote = `🔥 *HOT OFFER FROM OUR LEDGER* 🔥

📱 *${selected.brand} ${selected.model} (${selected.storage})*
• Nigerian Condition: ${selected.condition?.join(", ") || "Super Clean"}
• Warranty Status: ${selected.warranty || "Guaranteed"}
• Specs Extension: ${selected.variant || "Standard"}
• Battery Performance: ${selected.batteryHealth ? `${selected.batteryHealth} Capacity` : "Excellent"}

💵 Premium Walk-in Offer: *₦${selected.sellingPrice.toLocaleString()}*

_Message us now to reserve this device in stock!_`;
        addBotMessageOnly(`📱 Here is a copyable formatted quote you can broadcast directly to customers:\n\n---\n${quote}\n---`);
      } else {
        setSession({ currentFlow: "none", step: 0, data: {} });
        addBotMessageOnly("Returned to main menu.");
      }
    }
  };

  // ----------------------------------------------------
  // UPDATE PRODUCT WIZARD FLOW STATE MACHINE
  // ----------------------------------------------------
  const handleUpdateProductFlow = (text: string, hasPermission: Function, rejection: string) => {
    if (!hasPermission("editProduct")) {
      setSession({ currentFlow: "none", step: 0, data: {} });
      addBotMessageOnly(`❌ ${rejection}`);
      return;
    }

    const step = session.step;
    const data = { ...session.data };
    const textLower = text.toLowerCase().trim();

    // Step 1: Search-First Flow or Chip Selection
    if (step === 1) {
      const liveProducts = db.getProducts(shopId);

      // Check if user tapped a numbered option chip like "[1] iPhone 13" or typed "1"
      let selectedProduct: Product | undefined;
      const numMatch = text.match(/^\[?(\d+)\]?/);
      if (numMatch) {
        const index = parseInt(numMatch[1], 10) - 1;
        if (index >= 0 && index < liveProducts.length) {
          selectedProduct = liveProducts[index];
        }
      }

      if (!selectedProduct) {
        const matches = liveProducts.filter(p => 
          p.brand.toLowerCase().includes(textLower) || 
          p.model.toLowerCase().includes(textLower) ||
          p.id.toLowerCase().includes(textLower) ||
          (p.variant && p.variant.toLowerCase().includes(textLower))
        );

        if (matches.length === 0) {
          addBotMessageOnly(`⚠️ No matching products found for "${text}". Please enter another search term (name or model):`);
          return;
        }

        if (matches.length === 1) {
          selectedProduct = matches[0];
        } else {
          data.matches = matches;
          setSession({ currentFlow: "update_product", step: 15, data });
          const listText = matches.map((m, idx) => `*[${idx + 1}]* ${m.brand} ${m.model} (${m.storage} • ₦${m.sellingPrice.toLocaleString()})`).join("\n");
          addBotMessageOnly(`Multiple matches found. Select a number corresponding to the device:\n\n${listText}`);
          return;
        }
      }

      data.product = selectedProduct;
      setSession({ currentFlow: "update_product", step: 2, data });
      addBotMessageOnly(`Loaded Product: *${selectedProduct.brand} ${selectedProduct.model}* (₦${selectedProduct.sellingPrice.toLocaleString()})\n\nSelect specification category to update:`);
      return;
    }

    // Step 1.5: Select from multiple matching options
    if (step === 15) {
      const idx = parseInt(text) - 1;
      const matches = data.matches as Product[];
      if (isNaN(idx) || idx < 0 || idx >= matches.length) {
        addBotMessageOnly(`⚠️ Invalid choice. Select a number between 1 and ${matches.length}:`);
        return;
      }
      const selected = matches[idx];
      data.product = selected;
      setSession({ currentFlow: "update_product", step: 2, data });
      addBotMessageOnly(`Loaded Product: *${selected.brand} ${selected.model}*\n\nSelect specification category to update:`);
      return;
    }

    // Step 2: Choose specification field to modify
    if (step === 2) {
      const choice = text.toLowerCase();
      const p = data.product as Product;

      if (choice.includes("price") || text === "Price") {
        setSession({ currentFlow: "update_product", step: 31, data });
        addBotMessageOnly(`Editing Price for *${p.brand} ${p.model}*.\n\nEnter or select new selling price (₦):`);
      } else if (choice.includes("warranty") || text === "Warranty") {
        setSession({ currentFlow: "update_product", step: 32, data });
        addBotMessageOnly(`Editing Warranty for *${p.brand} ${p.model}*.\n\nSelect new warranty period:`);
      } else if (choice.includes("condition") || text === "Condition") {
        setSession({ currentFlow: "update_product", step: 33, data });
        addBotMessageOnly(`Editing Condition for *${p.brand} ${p.model}*.\n\nSelect device Condition Tag:`);
      } else if (choice.includes("media") || text === "Media") {
        setSession({ currentFlow: "update_product", step: 34, data });
        addBotMessageOnly(`Editing Media files for *${p.brand} ${p.model}*.\n\nConfigure attachments options (Upload file or select Skip):`);
      } else if (choice.includes("note") || text === "Notes") {
        setSession({ currentFlow: "update_product", step: 35, data });
        addBotMessageOnly(`Editing custom ledger notes for *${p.brand} ${p.model}*.\n\nEnter custom specs / notes:`);
      } else if (choice.includes("storage") || text === "Storage") {
        setSession({ currentFlow: "update_product", step: 36, data });
        addBotMessageOnly(`Editing Storage for *${p.brand} ${p.model}*.\n\nEnter or select new storage (e.g. 256GB):`);
      } else if (choice.includes("colour") || choice.includes("color") || text === "Colour") {
        setSession({ currentFlow: "update_product", step: 37, data });
        addBotMessageOnly(`Editing Color for *${p.brand} ${p.model}*.\n\nEnter or select new color:`);
      } else if (choice.includes("ram") || text === "RAM") {
        setSession({ currentFlow: "update_product", step: 38, data });
        addBotMessageOnly(`Editing RAM size for *${p.brand} ${p.model}*.\n\nEnter or select RAM size:`);
      } else if (choice.includes("tag") || text === "Tags") {
        setSession({ currentFlow: "update_product", step: 41, data });
        addBotMessageOnly(`Editing Quick Tags for *${p.brand} ${p.model}*.\n\nSelect a tag to toggle/add:`);
      } else if (choice.includes("delete")) {
        // Direct delete operation
        db.deleteProduct(shopId, p.id);
        db.addAuditLog(shopId, senderName, senderPhone, "Product Removed", `Deleted ${p.brand} ${p.model} (${p.storage}) via WhatsApp.`);
        setSession({ currentFlow: "none", step: 0, data: {} });
        addBotMessageOnly(`🗑️ *PRODUCT REMOVED SUCCESSFUL*\n\nDeleted product line *${p.brand} ${p.model}* from catalog database.`);
      } else if (choice.includes("duplicate")) {
        // Direct duplicate operation
        const dupe: Product = {
          ...p,
          id: `prod-${Date.now()}`,
          model: `${p.model} - Copy`,
          quantity: 1,
          status: "Available",
          createdAt: new Date().toISOString()
        };
        onSaveProduct(dupe);
        db.addAuditLog(shopId, senderName, senderPhone, "Product Duplicated", `Duplicated ${p.brand} ${p.model} via WhatsApp.`);
        setSession({ currentFlow: "none", step: 0, data: {} });
        addBotMessageOnly(`📋 *PRODUCT DUPLICATED SUCCESSFUL*\n\nCreated identical copy *${dupe.brand} ${dupe.model}* in database.`);
      } else {
        setSession({ currentFlow: "none", step: 0, data: {} });
        addBotMessageOnly("❌ Modifications cancelled. Returned to main menu.");
      }
      return;
    }

    const product = data.product as Product;

    // 31: Price Update
    if (step === 31) {
      const amt = parseShortenedPriceToNumber(text);
      if (amt === 0) {
        addBotMessageOnly("⚠️ Invalid price value. Please enter a valid number (e.g. 500K or 500000):");
        return;
      }
      const updated = { ...product, sellingPrice: amt };
      onSaveProduct(updated);
      commitUpdateLogs("Price", `₦${product.sellingPrice.toLocaleString()} -> ₦${amt.toLocaleString()}`);
      return;
    }

    // 32: Warranty Update
    if (step === 32) {
      const updated = { ...product, warranty: textLower === "skip" ? "No Warranty" : text };
      onSaveProduct(updated);
      commitUpdateLogs("Warranty Period", `"${product.warranty}" -> "${text}"`);
      return;
    }

    // 33: Condition Tag Update
    if (step === 33) {
      const updated = { ...product, condition: [text] };
      onSaveProduct(updated);
      commitUpdateLogs("Condition Tag", `"${product.condition?.join(", ")}" -> "${text}"`);
      return;
    }

    // 34: Media File/Video Update
    if (step === 34) {
      let simulatedMedia = "";
      if (text.startsWith("data:")) {
        simulatedMedia = text;
        addBotMessageOnly("📸 *CUSTOM MEDIA ATTACHED SUCCESSFUL*");
      } else if (textLower.includes("video")) {
        simulatedMedia = "https://assets.mixkit.co/videos/preview/mixkit-holding-a-smartphone-in-hand-40810-large.mp4";
      } else if (textLower.includes("photo")) {
        simulatedMedia = "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&q=80&w=600";
      }

      if (textLower === "skip" || !simulatedMedia) {
        setSession({ currentFlow: "none", step: 0, data: {} });
        addBotMessageOnly("No changes made to media files.");
        return;
      }

      const updated = { 
        ...product, 
        productVideo: simulatedMedia.startsWith("data:video") || simulatedMedia.endsWith(".mp4") ? simulatedMedia : product.productVideo,
        productImages: simulatedMedia.startsWith("data:image") || !simulatedMedia.endsWith(".mp4") ? [simulatedMedia] : product.productImages
      };
      onSaveProduct(updated);
      commitUpdateLogs("Media Attachments", "Catalog files updated via WhatsApp emulator.");
      return;
    }

    // 35: Ledger Notes Update
    if (step === 35) {
      const notes = textLower === "none" || textLower === "skip" ? "" : text;
      const updated = { ...product, variant: notes || undefined };
      onSaveProduct(updated);
      commitUpdateLogs("Ledger Notes", `Set custom notes to: "${notes}"`);
      return;
    }

    // 36: Storage Update
    if (step === 36) {
      const updated = { ...product, storage: text };
      onSaveProduct(updated);
      commitUpdateLogs("Storage", `"${product.storage}" -> "${text}"`);
      return;
    }

    // 37: Colour Update
    if (step === 37) {
      const parts = (product.variant || "").split(", ");
      const ramPart = parts[1] || "";
      const updatedVariant = text + (ramPart ? `, ${ramPart}` : "");
      const updated = { ...product, variant: updatedVariant };
      onSaveProduct(updated);
      commitUpdateLogs("Color", `Updated color spec to "${text}"`);
      return;
    }

    // 38: RAM Update
    if (step === 38) {
      const parts = (product.variant || "").split(", ");
      const colorPart = parts[0] || "Default";
      const updatedVariant = colorPart + `, ${text} RAM`;
      const updated = { ...product, variant: updatedVariant };
      onSaveProduct(updated);
      commitUpdateLogs("RAM", `Updated RAM size to "${text}"`);
      return;
    }

    // 41: Toggle Quick Tags
    if (step === 41) {
      if (textLower === "skip" || textLower === "done") {
        setSession({ currentFlow: "none", step: 0, data: {} });
        addBotMessageOnly("Tags update saved. Returned to main menu.");
        return;
      }
      const existing = product.condition || [];
      const updatedTags = existing.includes(text) 
        ? existing.filter(t => t !== text) 
        : [...existing, text];

      const updated = { ...product, condition: updatedTags };
      onSaveProduct(updated);
      data.product = updated;
      setSession({ currentFlow: "update_product", step: 41, data });
      addBotMessageOnly(`Toggled Quick Tag: *"${text}"*\n\nActive tags: ${updatedTags.join(", ") || "None"}\n\nChoose another tag to toggle or select Done:`);
      return;
    }
  };

  const commitUpdateLogs = (field: string, desc: string) => {
    const product = session.data.product as Product;
    clearAssistantDraft();
    setSession({ currentFlow: "none", step: 0, data: {} });
    resetMediaUploadStates();

    db.addNotification(
      shopId,
      "WhatsApp Product Spec Modified",
      `Staff member ${senderName} modified ${field} on product: ${product.brand} ${product.model}.`,
      "info"
    );

    db.addAuditLog(
      shopId,
      senderName,
      senderPhone,
      "Product Modified",
      `WhatsApp edit [${field}] on ${product.brand} ${product.model} (${product.storage}): ${desc}`
    );

    addBotMessageOnly(`✅ *SPECIFICATION UPDATED SUCCESSFUL*\n\nModified *${field}* for *${product.brand} ${product.model}* successfully:\n${desc}`);
  };

  // ----------------------------------------------------
  // INTERACTIVE OPTION CHIPS CALCULATIONS
  // ----------------------------------------------------
  const getActiveWizardOptions = (): string[] => {
    const isOwner = selectedSenderId === "owner";
    const staffProfile = staffList.find(s => s.id === selectedSenderId);

    const hasPerm = (key: string): boolean => {
      if (isOwner) return true;
      if (!staffProfile) return false;
      return !!staffProfile.permissions[key];
    };

    if (session.currentFlow === "none") {
      const initialActions = [];
      if (hasPerm("addProduct")) initialActions.push("Add Product");
      if (hasPerm("viewInventory")) initialActions.push("View Inventory");
      if (isOwner) {
        initialActions.push("Activity Log");
      }
      initialActions.push("Help");
      return initialActions;
    }

    if (session.currentFlow === "view_inventory") {
      return ["Available Stock", "Sold Products", "All Items", "🏠 Menu"];
    }

    if (session.currentFlow === "add_product") {
      const step = session.step;
      const data = session.data;
      let baseOptions: string[] = [];

      if (step === 1) {
        baseOptions = ["Phones", "Tablets", "Laptops", "Smart Watches", "Gaming Consoles", "Accessories"];
        return [...baseOptions, "❌ Cancel"];
      }

      if (step === 15) {
        if (data.category === Category.Phones) baseOptions = ["Apple", "Samsung", "Tecno", "Infinix", "Xiaomi", "Google", "Custom Brand"];
        else if (data.category === Category.Tablets) baseOptions = ["Apple", "Samsung", "Lenovo", "Custom Brand"];
        else if (data.category === Category.Laptops) baseOptions = ["Apple", "HP", "Dell", "ASUS", "Lenovo", "Custom Brand"];
        else if (data.category === Category.SmartWatches) baseOptions = ["Apple", "Samsung", "Garmin", "Fitbit", "Custom Brand"];
        else if (data.category === Category.GameConsoles) baseOptions = ["Sony PlayStation", "Microsoft Xbox", "Nintendo"];
        else baseOptions = ["Apple", "Samsung", "Oraimo", "Anker", "JBL", "Custom Brand"];
      }
      else if (step === 2) {
        const matches = DEVICE_DATABASE.filter(
          d => d.category === data.category && d.brand.toLowerCase() === (data.brand || "").toLowerCase()
        ).slice(0, 5);
        const names = matches.map(m => m.name);
        baseOptions = [...names, "Custom Model"];
      }
      else if (step === 3) {
        baseOptions = data.template && data.template.storages ? [...data.template.storages, "Custom", "Skip"] : ["64GB", "128GB", "256GB", "512GB", "1TB", "Custom", "Skip"];
      }
      else if (step === 35) {
        baseOptions = data.template && data.template.rams ? [...data.template.rams, "Custom", "Skip"] : ["4GB", "6GB", "8GB", "12GB", "16GB", "Custom", "Skip"];
      }
      else if (step === 4) {
        baseOptions = data.template && data.template.colors ? [...data.template.colors, "Custom", "Skip"] : ["Space Gray", "Silver", "Midnight", "Titanium", "Gold", "Custom", "Skip"];
      }
      else if (step === 45) {
        baseOptions = ["Intel Core i5", "Intel Core i7", "Intel Core i9", "Apple M1", "Apple M2", "Apple M3", "Custom", "Skip"];
      }
      else if (step === 5) {
        baseOptions = ["100K", "200K", "300K", "500K", "750K", "1M"];
      }
      else if (step === 6) baseOptions = ["Skip"];
      else if (step === 7) baseOptions = ["No Warranty", "7 Days", "14 Days", "30 Days", "60 Days", "90 Days", "6 Months", "1 Year", "Custom", "Skip"];
      else if (step === 8) {
        const selected = Array.isArray(data.condition) ? data.condition : [];
        const tags = getCategoryQuickTags(data.category, data.brand);
        baseOptions = tags.map(t => selected.includes(t) ? `✓ ${t}` : t);
        if (!baseOptions.includes("Other")) baseOptions.push("Other");
        if (selected.length > 0) baseOptions.push("Done");
        if (!baseOptions.includes("Skip")) baseOptions.push("Skip");
      }
      else if (step === 81) {
        baseOptions = ["Skip"];
      }
      else if (step === 9) baseOptions = ["100%", "99%", "95%+", "90%+", "85%+", "80%+", "Below 80%", "Custom", "Skip"];
      else if (step === 10 || step === 101 || step === 102 || step === 103 || step === 104) {
        const hasMedia = uploadedImages.length > 0 || Boolean(uploadedVideo);
        const savedTab = localStorage.getItem("restockr_last_media_tab");
        const isVideoFirst = savedTab === "video";
        baseOptions = isVideoFirst 
          ? ["🎥 Video", "📷 Photos", hasMedia ? "Continue" : "Skip"]
          : ["📷 Photos", "🎥 Video", hasMedia ? "Continue" : "Skip"];
      }
      else if (step === 11) baseOptions = ["Save Product", "Edit / Restart"];

      return [...baseOptions, "⬅ Back", "🏠 Menu"];
    }

    if (session.currentFlow === "sell_product") {
      const step = session.step;
      const data = session.data;
      let baseOptions: string[] = [];

      if (step === 1) {
        const liveProducts = db.getProducts(shopId);
        const inStock = data.list && data.list.length > 0
          ? data.list
          : liveProducts.filter(p => p.quantity > 0 && p.status === "Available");
        const opts = inStock.slice(0, 5).map((p, idx) => `[${idx + 1}] ${p.brand} ${p.model}`);
        return [...opts, "Search Product", "❌ Cancel"];
      }
      if (step === 2) baseOptions = ["Continue Sale"];
      else if (step === 3 || step === 4) baseOptions = ["Skip"];
      else if (step === 5) baseOptions = ["Cash", "Transfer", "POS", "Split Payment"];
      else if (step === 55) baseOptions = ["Cash + Transfer", "Transfer + POS", "Cash + POS"];

      return [...baseOptions, "⬅ Back", "❌ Cancel"];
    }

    if (session.currentFlow === "find_product") {
      const step = session.step;
      const data = session.data;

      if (step === 1) {
        return ["Phones", "Tablets", "Laptops", "Smart Watches", "Gaming Consoles", "Accessories", "🏠 Menu"];
      }
      if (step === 2) {
        const list = data.matches as Product[];
        const opts = list.slice(0, 5).map((p, idx) => `[${idx + 1}] ${p.brand} ${p.model}`);
        return [...opts, "Search Again", "⬅ Back", "🏠 Menu"];
      }
      if (step === 3) {
        return ["Sell Product", "Edit Product", "Share Quote", "⬅ Back", "🏠 Menu"];
      }
    }

    if (session.currentFlow === "update_product") {
      const step = session.step;
      const data = session.data;
      let baseOptions: string[] = [];

      if (step === 1) {
        const liveProducts = db.getProducts(shopId);
        const opts = liveProducts.slice(0, 5).map((m, idx) => `[${idx + 1}] ${m.brand} ${m.model}`);
        return [...opts, "❌ Cancel"];
      }
      
      if (step === 15) {
        const list = data.matches as Product[];
        baseOptions = list.slice(0, 6).map((m, idx) => `[${idx + 1}] ${m.brand} ${m.model}`);
        return [...baseOptions, "⬅ Back", "❌ Cancel"];
      }

      if (step === 2) {
        baseOptions = ["Price", "Storage", "Colour", "RAM", "Condition", "Media", "Warranty", "Tags", "Notes", "Delete Product", "Duplicate Product"];
        return [...baseOptions, "⬅ Back", "❌ Cancel"];
      }

      if (step === 31) baseOptions = ["100K", "200K", "300K", "500K", "750K", "1M"];
      else if (step === 32) baseOptions = ["No Warranty", "7 Days", "14 Days", "30 Days", "60 Days", "90 Days", "Custom", "Skip"];
      else if (step === 33) baseOptions = ["Brand New", "Like New", "A-Grade Clean", "B-Grade Clean"];
      else if (step === 34) baseOptions = ["Upload Product Video", "Upload Photos", "Skip"];
      else if (step === 35) baseOptions = ["None", "Skip"];
      else if (step === 36) baseOptions = ["128GB", "256GB", "512GB", "1TB", "Skip"];
      else if (step === 37) baseOptions = ["Space Gray", "Silver", "Midnight", "Titanium", "Gold", "Skip"];
      else if (step === 38) baseOptions = ["4GB", "6GB", "8GB", "12GB", "16GB", "Skip"];
      else if (step === 41) {
        baseOptions = ["Original Screen", "Dual SIM", "No Face ID", "Factory Unlocked", "Minor Scratches", "Done"];
      }

      return [...baseOptions, "⬅ Back", "❌ Cancel"];
    }

    return [];
  };

  const handleOptionClick = (opt: string) => {
    let cleanText = opt;

    // Map displayed bracket index values
    if (opt.startsWith("[")) {
      const match = opt.match(/\[(\d+)\]/);
      if (match) cleanText = match[1];
    }

    // Visual append user chat bubble
    const userMsg: Message = {
      id: `msg-${Date.now()}-u`,
      sender: "user",
      text: opt,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      status: "read"
    };

    setMessages(prev => [...prev, userMsg]);

    setTimeout(() => {
      processWhatsAppCommand(cleanText);
    }, 120);
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 animate-fade-in text-slate-800" id="whatsapp-emulator-layout">
      
      {/* SIDEBAR: SENDER CHAT IDENTITY & CONTROL SUITE */}
      <div className="lg:w-1/3 space-y-4">
        <div>
          <h2 className="text-xs font-mono font-bold uppercase text-slate-400 tracking-widest flex items-center gap-1">
            <Smartphone className="w-4 h-4 text-emerald-600 animate-pulse" /> Mobile Testing Suite
          </h2>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
            RESTOCKR provides complete direct database synchronization. Staff members log sales, add products, or check prices using WhatsApp guided visual interfaces.
          </p>
        </div>

        {/* CHAT IDENTITY SELECTOR CARD */}
        <div className="bg-white border border-slate-200/80 p-4 rounded-2xl shadow-sm space-y-3">
          <p className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest">
            Select Live Chat Sender
          </p>

          <div className="space-y-1.5 max-h-[340px] overflow-y-auto pr-1">
            
            {/* Shop Owner */}
            <button
              onClick={() => setSelectedSenderId("owner")}
              className={`w-full p-2.5 border rounded-xl text-left text-xs transition-all cursor-pointer flex justify-between items-center ${
                selectedSenderId === "owner" 
                  ? "border-emerald-600 bg-emerald-50/30 font-bold shadow-sm" 
                  : "border-slate-100 hover:bg-slate-50"
              }`}
            >
              <div>
                <p className="text-slate-900 font-bold flex items-center gap-1">
                  Shop Owner <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full shrink-0" />
                </p>
                <p className="text-[10px] text-slate-400 font-mono mt-0.5">+234 803 123 4567</p>
              </div>
              <span className="text-[9px] bg-slate-900 text-white px-2 py-0.5 rounded font-mono uppercase font-black">Owner</span>
            </button>

            {/* Dynamic Staff Profiles list */}
            {staffList.map(member => (
              <button
                key={member.id}
                onClick={() => setSelectedSenderId(member.id)}
                className={`w-full p-2.5 border rounded-xl text-left text-xs transition-all cursor-pointer flex justify-between items-center ${
                  selectedSenderId === member.id 
                    ? "border-emerald-600 bg-emerald-50/30 font-bold shadow-sm" 
                    : "border-slate-100 hover:bg-slate-50"
                }`}
              >
                <div>
                  <p className="text-slate-900 font-bold truncate max-w-[130px] flex items-center gap-1">
                    {member.fullName}
                    <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${member.status === "Active" ? "bg-emerald-500" : "bg-rose-500"}`} />
                  </p>
                  <p className="text-[10px] text-slate-400 font-mono mt-0.5">{member.phoneNumber}</p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className={`text-[9px] px-1.5 py-0.5 rounded font-mono uppercase font-bold border ${
                    member.status === "Active" 
                      ? "bg-emerald-50 text-emerald-700 border-emerald-100" 
                      : "bg-rose-50 text-rose-700 border-rose-100"
                  }`}>
                    {member.status}
                  </span>
                </div>
              </button>
            ))}

            {/* Unknown Unregistered Number */}
            <button
              onClick={() => setSelectedSenderId("unknown")}
              className={`w-full p-2.5 border rounded-xl text-left text-xs transition-all cursor-pointer flex justify-between items-center ${
                selectedSenderId === "unknown" 
                  ? "border-emerald-600 bg-emerald-50/30 font-bold shadow-sm" 
                  : "border-slate-100 hover:bg-slate-50"
              }`}
            >
              <div>
                <p className="text-slate-900 font-bold">Unregistered Number</p>
                <p className="text-[10px] text-slate-400 font-mono mt-0.5">+234 812 345 6789</p>
              </div>
              <span className="text-[9px] bg-zinc-100 text-zinc-500 border border-zinc-200 px-1.5 py-0.5 rounded font-mono uppercase font-bold">Unknown</span>
            </button>

          </div>
        </div>

        {/* COMPACT PERMISSIONS OVERVIEW */}
        {!isOwner && staffProfile && (
          <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-2xl text-xs space-y-1.5">
            <p className="font-mono font-bold text-slate-500 text-[10px] uppercase tracking-wider flex items-center gap-1">
              <UserCheck className="w-3.5 h-3.5 text-emerald-600" /> Active WhatsApp Permissions
            </p>
            <div className="grid grid-cols-2 gap-1.5 text-[10px] pt-1">
              <span className={`flex items-center gap-1 font-medium ${staffProfile.permissions.addProduct ? "text-slate-800" : "text-slate-400 line-through"}`}>
                • Add Products
              </span>
              <span className={`flex items-center gap-1 font-medium ${staffProfile.permissions.sellProduct ? "text-slate-800" : "text-slate-400 line-through"}`}>
                • Sell Products
              </span>
              <span className={`flex items-center gap-1 font-medium ${staffProfile.permissions.viewInventory ? "text-slate-800" : "text-slate-400 line-through"}`}>
                • View Inventory
              </span>
              <span className={`flex items-center gap-1 font-medium ${staffProfile.permissions.editProduct ? "text-slate-800" : "text-slate-400 line-through"}`}>
                • Edit Products
              </span>
            </div>
          </div>
        )}

        <div className="bg-[#121212] border border-zinc-800 p-4 rounded-2xl text-[11px] leading-relaxed text-[#B7BCC7]">
          <p className="font-bold text-white font-mono uppercase tracking-wider mb-1 flex items-center gap-1 text-[10px]">
            <AlertOctagon className="w-3.5 h-3.5 text-teal-400 shrink-0" /> Shared Ledger Rules
          </p>
          <ul className="list-disc pl-3.5 space-y-1">
            <li>Any update in the WhatsApp assistant modifies the core database.</li>
            <li>No duplicate datastores, background jobs, or synchronization queues are used.</li>
          </ul>
        </div>
      </div>

      {/* PHONE FRAME CHAT ENGINE */}
      <div className="flex-1 flex justify-center">
        
        <div className="w-full max-w-sm h-[620px] border-[10px] border-slate-900 bg-[#E5DDD5] rounded-[38px] shadow-2xl flex flex-col relative overflow-hidden">
          
          {/* Top Notch cover */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-28 h-5 bg-slate-900 rounded-b-xl z-20 flex items-center justify-center">
            <span className="w-3 h-1 bg-zinc-800 rounded-full" />
          </div>

          {/* Interactive Chat Header */}
          <div className="bg-[#075E54] text-white pt-6 pb-3 px-4 flex items-center gap-3 shadow z-10 shrink-0">
            <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 font-display font-black flex items-center justify-center text-xs shadow-sm">
              R
            </div>
            <div>
              <h4 className="font-sans font-bold text-xs flex items-center gap-1">
                RESTOCKR Assistant
                <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-ping shrink-0" />
              </h4>
              <p className="text-[9px] text-emerald-200">Online • direct-sync active</p>
            </div>
          </div>

          {/* Active Wizard Progress & Navigation */}
          {session.currentFlow !== "none" && (
            <div className="bg-[#128C7E] border-b border-emerald-800 text-white flex flex-col shrink-0 z-10">
              {/* Progress bar */}
              {session.currentFlow === "add_product" && (
                <div className="px-4 py-1 flex justify-between items-center text-[9px] font-mono text-emerald-100 border-b border-emerald-800">
                  <span>Stock Intake Step {session.step} / 11</span>
                  <div className="w-20 bg-emerald-900 rounded-full h-1 overflow-hidden">
                    <div className="bg-emerald-300 h-1 transition-all duration-300" style={{ width: `${(session.step / 11) * 100}%` }} />
                  </div>
                </div>
              )}
              {session.currentFlow === "update_product" && (
                <div className="px-4 py-1 flex justify-between items-center text-[9px] font-mono text-emerald-100 border-b border-emerald-800">
                  <span>Edit Product Step {session.step}</span>
                </div>
              )}
              {session.currentFlow === "sell_product" && (
                <div className="px-4 py-1 flex justify-between items-center text-[9px] font-mono text-emerald-100 border-b border-emerald-800">
                  <span>Fast Sale Step {session.step}</span>
                </div>
              )}
              {session.currentFlow === "find_product" && (
                <div className="px-4 py-1 flex justify-between items-center text-[9px] font-mono text-emerald-100 border-b border-emerald-800">
                  <span>Search Step {session.step}</span>
                </div>
              )}

              {/* Navigation Bar */}
              <div className="px-4 py-2 flex justify-between items-center bg-slate-100 border-b border-slate-200 text-xs font-bold shrink-0">
                <button
                  type="button"
                  onClick={() => handleNavigation("back")}
                  className="flex items-center gap-1 text-slate-700 hover:text-slate-900 cursor-pointer min-h-[36px] px-2.5 py-1 rounded-lg hover:bg-slate-200 transition-colors"
                >
                  <ArrowLeft className="w-4 h-4 text-slate-600" /> Back
                </button>
                <button
                  type="button"
                  onClick={() => handleNavigation("home")}
                  className="flex items-center gap-1 text-slate-700 hover:text-slate-900 cursor-pointer min-h-[36px] px-2.5 py-1 rounded-lg hover:bg-slate-200 transition-colors"
                >
                  🏠 Main Menu
                </button>
                <button
                  type="button"
                  onClick={() => setIsQuickMenuOpen(true)}
                  className="flex items-center gap-1 text-emerald-800 font-black cursor-pointer min-h-[36px] px-2.5 py-1 rounded-lg hover:bg-emerald-100 transition-colors"
                >
                  ☰ Menu
                </button>
              </div>
            </div>
          )}

          {/* Chat Messages Log list */}
          <div className="flex-1 overflow-y-auto p-3.5 space-y-3.5 bg-[#E5DDD5]" id="chat-scroller">
            {messages.map(msg => (
              <div 
                key={msg.id} 
                className={`flex flex-col max-w-[90%] ${msg.sender === "user" ? "ml-auto items-end" : "mr-auto items-start"}`}
              >
                <div className={`p-3 rounded-2xl shadow-sm text-xs leading-relaxed relative ${
                  msg.sender === "user" 
                    ? "bg-[#DCF8C6] text-slate-800 rounded-tr-none" 
                    : "bg-white text-slate-800 rounded-tl-none w-full"
                }`}>
                  
                  {/* Message body text */}
                  <div className="whitespace-pre-wrap">{msg.text}</div>

                  {/* -------------------------------------------------------- */}
                  {/* RICH VIEW: REDESIGNED PRODUCT CARDS IN CATALOG */}
                  {/* -------------------------------------------------------- */}
                  {msg.type === "inventory_list" && msg.productsData && (
                    <div className="mt-3 border-t border-slate-100 pt-3 space-y-3.5 max-h-[320px] overflow-y-auto">
                      {msg.productsData.length === 0 ? (
                        <p className="text-[10px] text-slate-400 italic">No products found in the catalog.</p>
                      ) : (
                        msg.productsData.slice(inventoryPage * 3, (inventoryPage + 1) * 3).map(prod => (
                          <div key={prod.id} className="bg-slate-50 border border-slate-200 p-3 rounded-2xl flex flex-col gap-2.5 relative shadow-sm">
                            <div className="flex gap-2.5">
                              {/* Photo / Video preview */}
                              <div className="relative shrink-0">
                                <img 
                                  src={prod.productImages[0]?.startsWith("db:") ? (db.getProductById(prod.id)?.productImages[0] || "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&q=80&w=150") : (prod.productImages[0] || "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&q=80&w=150")} 
                                  referrerPolicy="no-referrer"
                                  className="w-16 h-16 object-cover rounded-xl border border-slate-200 bg-white" 
                                />
                                {Boolean(prod.productVideo && prod.productVideo.trim().length > 0) && (
                                  <span className="absolute bottom-1 left-1 bg-slate-900/90 text-white px-1 py-0.5 rounded text-[7px] font-bold flex items-center gap-0.5">
                                    <Play className="w-1.5 h-1.5 fill-white text-white" /> Video
                                  </span>
                                )}
                              </div>

                              <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-start gap-1">
                                  <h5 className="font-extrabold text-slate-900 truncate text-[11px]">{prod.brand} {prod.model}</h5>
                                  <span className={`text-[7px] px-1.5 py-0.5 rounded font-mono font-extrabold uppercase shrink-0 ${
                                    prod.status === "Available" 
                                      ? "bg-emerald-100 text-emerald-800 border border-emerald-200" 
                                      : "bg-rose-100 text-rose-800 border border-rose-200"
                                  }`}>
                                    {prod.status}
                                  </span>
                                </div>
                                <p className="font-mono text-[9px] text-slate-500 font-bold mt-0.5">
                                  {prod.storage} {prod.variant ? `• ${prod.variant}` : ""}
                                </p>
                                <p className="text-[11px] font-black text-emerald-700 mt-1">₦{prod.sellingPrice.toLocaleString()}</p>
                              </div>
                            </div>

                            {/* Additional details row */}
                            <div className="border-t border-slate-200/60 pt-1.5 flex flex-wrap gap-1 items-center justify-between text-[8px] text-slate-500 font-mono">
                              <div className="flex gap-1.5 items-center">
                                <span>🛡️ {prod.warranty || "No Warranty"}</span>
                              </div>
                              <QuickTagsBadgeList 
                                tags={prod.condition} 
                                batteryHealth={prod.batteryHealth} 
                                variant="light" 
                              />
                            </div>

                            {/* Redesigned card action buttons list */}
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 pt-1.5 border-t border-slate-200/60">
                              {Boolean(prod.productVideo && prod.productVideo.trim().length > 0) && (
                                <button 
                                  onClick={() => {
                                    const vUrl = db.getResolvedVideoUrl(prod) || prod.productVideo || "";
                                    if (vUrl) {
                                      setSelectedVideoUrl(vUrl);
                                      setIsVideoModalOpen(true);
                                    }
                                  }}
                                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-[8px] py-1.5 rounded-md font-extrabold cursor-pointer flex items-center justify-center gap-1 shadow-xs col-span-2 sm:col-span-1"
                                >
                                  <Play className="w-2.5 h-2.5 fill-white text-white" /> Play Video
                                </button>
                              )}
                              <button 
                                disabled={prod.quantity === 0}
                                onClick={() => handleOptionClick(`Update Product [${prod.brand} ${prod.model}]`)}
                                className={`text-[8px] py-1.5 rounded-md font-extrabold flex items-center justify-center gap-1 border ${
                                  prod.quantity === 0 
                                    ? "bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed" 
                                    : "bg-white hover:bg-slate-100 border-slate-200 text-slate-700 cursor-pointer"
                                }`}
                              >
                                <Edit className="w-2.5 h-2.5 text-blue-500" /> Edit
                              </button>
                              <button 
                                disabled={prod.quantity === 0 || prod.status !== "Available"}
                                onClick={() => handleOptionClick(`Sell Product [${prod.brand} ${prod.model}]`)}
                                className={`text-[8px] py-1.5 rounded-md font-extrabold flex items-center justify-center gap-1 ${
                                  prod.quantity === 0 || prod.status !== "Available"
                                    ? "bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed" 
                                    : "bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer"
                                }`}
                              >
                                <ShoppingCart className="w-2.5 h-2.5 text-white" /> Sell
                              </button>
                              {isOwner && (
                                <button 
                                  disabled={prod.quantity === 0}
                                  onClick={() => {
                                    if (confirm(`Are you sure you want to delete ${prod.brand} ${prod.model}?`)) {
                                      db.deleteProduct(shopId || "", prod.id);
                                      db.addAuditLog(shopId || "", senderName, senderPhone, "Product Removed", `Deleted ${prod.brand} ${prod.model} via WhatsApp Assistant.`);
                                      addBotMessageOnly(`🗑️ *PRODUCT REMOVED SUCCESSFUL*\n\nDeleted *${prod.brand} ${prod.model}* from your live catalog database.`);
                                    }
                                  }}
                                  className={`text-[8px] py-1.5 rounded-md font-extrabold flex items-center justify-center gap-1 border ${
                                    prod.quantity === 0 
                                      ? "bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed" 
                                      : "bg-rose-50 hover:bg-rose-100 border-rose-200 text-rose-700 cursor-pointer"
                                  }`}
                                >
                                  <Trash2 className="w-2.5 h-2.5 text-rose-500" /> Delete
                                </button>
                              )}
                              <button 
                                onClick={() => {
                                  const copy: Product = {
                                    ...prod,
                                    id: `prod-${Date.now()}`,
                                    model: `${prod.model} - Copy`,
                                    quantity: 1,
                                    status: "Available",
                                    createdAt: new Date().toISOString()
                                  };
                                  onSaveProduct(copy);
                                  db.addAuditLog(shopId || "", senderName, senderPhone, "Product Duplicated", `Duplicated ${prod.brand} ${prod.model} via WhatsApp Assistant.`);
                                  addBotMessageOnly(`📋 *PRODUCT DUPLICATED SUCCESSFUL*\n\nCreated identical duplicate: *${copy.brand} ${copy.model}* successfully.`);
                                }}
                                className="bg-slate-100 hover:bg-slate-200 border border-slate-200 text-[8px] py-1.5 rounded-md font-extrabold text-slate-700 cursor-pointer flex items-center justify-center gap-1"
                              >
                                <ClipboardList className="w-2.5 h-2.5 text-slate-500" /> Duplicate
                              </button>
                            </div>
                          </div>
                        ))
                      )}

                      {/* Compact pagination controls */}
                      {msg.productsData.length > 3 && (
                        <div className="flex justify-between items-center pt-1.5">
                          <button
                            disabled={inventoryPage === 0}
                            onClick={() => setInventoryPage(p => Math.max(0, p - 1))}
                            className="text-[9px] font-bold text-emerald-700 disabled:text-slate-300 flex items-center gap-0.5 cursor-pointer"
                          >
                            <ArrowLeft className="w-3 h-3" /> Prev
                          </button>
                          <span className="text-[9px] font-mono text-slate-400">Page {inventoryPage + 1}</span>
                          <button
                            disabled={(inventoryPage + 1) * 3 >= msg.productsData.length}
                            onClick={() => setInventoryPage(p => p + 1)}
                            className="text-[9px] font-bold text-emerald-700 disabled:text-slate-300 flex items-center gap-0.5 cursor-pointer"
                          >
                            Next <ArrowRight className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* -------------------------------------------------------- */}
                  {/* RICH VIEW: RECENT SALES RECEIPTS OVERLAYS */}
                  {/* -------------------------------------------------------- */}
                  {msg.type === "recent_sales" && msg.recentSalesData && (
                    <div className="mt-3 border-t border-slate-100 pt-3 space-y-2 max-h-[300px] overflow-y-auto">
                      {msg.recentSalesData.length === 0 ? (
                        <p className="text-[10px] text-slate-400 font-mono italic">No walk-in sales receipts registered today.</p>
                      ) : (
                        msg.recentSalesData.slice(0, 4).map(sale => (
                          <div key={sale.id} className="bg-slate-50 border border-slate-100 p-2.5 rounded-xl text-[11px] space-y-1">
                            <div className="flex justify-between items-center font-mono text-[9px] text-slate-400">
                              <span>{sale.id}</span>
                              <span>{new Date(sale.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                            </div>
                            <p className="font-bold text-slate-900">{sale.productName}</p>
                            <p className="text-[10px] text-slate-500">Customer: *{sale.customerName}*</p>
                            <div className="flex justify-between items-center pt-1">
                              <span className="text-emerald-700 font-black">₦{sale.totalAmount.toLocaleString()}</span>
                              <span className="bg-emerald-50 text-emerald-700 text-[8px] font-mono border border-emerald-100 px-1 py-0.2 rounded font-bold uppercase">{sale.paymentMethod}</span>
                            </div>
                            
                            {/* Staff Action Button */}
                            <div className="flex justify-end pt-1">
                              <button
                                onClick={() => {
                                  const res = onUndoLastSale(shopId || "", sale.id, senderName);
                                  addBotMessageOnly(res.message);
                                }}
                                className="text-[8px] font-bold text-rose-600 bg-rose-50 border border-rose-100 px-2 py-0.5 rounded hover:bg-rose-100 cursor-pointer"
                              >
                                Void Sale / Refund
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}

                  {/* -------------------------------------------------------- */}
                  {/* RICH VIEW: TIMELINE AUDIT OPERATIONS OVERLAYS */}
                  {/* -------------------------------------------------------- */}
                  {msg.type === "activity_log" && msg.auditLogsData && (
                    <div className="mt-3 border-t border-slate-100 pt-3 space-y-2.5 max-h-[300px] overflow-y-auto">
                      {msg.auditLogsData.length === 0 ? (
                        <p className="text-[10px] text-slate-400 italic">No shop staff audit records logged yet.</p>
                      ) : (
                        msg.auditLogsData.slice(0, 6).map(log => (
                          <div key={log.id} className="border-l-2 border-emerald-600 pl-2 text-[10px] space-y-0.5">
                            <p className="font-bold text-slate-800">{log.userName} added action:</p>
                            <p className="text-[9px] text-slate-400 font-mono italic">{log.action}</p>
                            <p className="text-slate-500 text-[9px]">{log.details}</p>
                          </div>
                        ))
                      )}
                    </div>
                  )}

                  {/* Interactive Options Chips inside the chat bubble */}
                  {msg.sender === "bot" && msg.id === messages[messages.length - 1]?.id && (() => {
                    const currentOpts = getActiveWizardOptions();
                    if (currentOpts.length === 0) return null;

                    const getOptionButtonClass = (opt: string) => {
                      const lower = opt.trim().toLowerCase();

                      // ✅ Save Product / Done → RESTOCKR Green (Primary action)
                      if (
                        lower === "save product" || 
                        lower === "save" || 
                        lower === "done" || 
                        lower === "confirm" || 
                        lower === "yes" || 
                        lower === "commit" ||
                        lower === "save changes"
                      ) {
                        return "bg-[#075E54] hover:bg-[#008069] active:bg-[#054c44] text-white border border-[#075E54] text-xs sm:text-sm font-extrabold px-4 py-2.5 rounded-2xl cursor-pointer transition-all shadow-md hover:shadow-lg shrink-0 min-h-[44px] flex items-center justify-center tracking-wide";
                      }

                      // ↩ Back → Blue
                      if (
                        lower === "back" || 
                        lower === "go back" || 
                        lower === "previous" || 
                        lower.includes("edit / restart") || 
                        lower === "edit" || 
                        lower === "restart"
                      ) {
                        return "bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white border border-blue-600 text-xs sm:text-sm font-extrabold px-4 py-2.5 rounded-2xl cursor-pointer transition-all shadow-md hover:shadow-lg shrink-0 min-h-[44px] flex items-center justify-center tracking-wide";
                      }

                      // 🏠 Main Menu / Menu → Dark Gray / Slate
                      if (
                        lower === "main menu" || 
                        lower === "menu" || 
                        lower === "home" || 
                        lower === "dashboard"
                      ) {
                        return "bg-slate-700 hover:bg-slate-800 active:bg-slate-900 text-white border border-slate-700 text-xs sm:text-sm font-extrabold px-4 py-2.5 rounded-2xl cursor-pointer transition-all shadow-md hover:shadow-lg shrink-0 min-h-[44px] flex items-center justify-center tracking-wide";
                      }

                      // ✏️ Custom → Orange
                      if (
                        lower === "custom" || 
                        lower.startsWith("custom ") ||
                        lower === "other"
                      ) {
                        return "bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white border border-amber-600 text-xs sm:text-sm font-extrabold px-4 py-2.5 rounded-2xl cursor-pointer transition-all shadow-md hover:shadow-lg shrink-0 min-h-[44px] flex items-center justify-center tracking-wide";
                      }

                      // ⏭ Skip → Light Gray
                      if (
                        lower === "skip" || 
                        lower === "next" || 
                        lower === "pass"
                      ) {
                        return "bg-slate-200 hover:bg-slate-300 active:bg-slate-400 text-slate-800 border border-slate-300 text-xs sm:text-sm font-extrabold px-4 py-2.5 rounded-2xl cursor-pointer transition-all shadow-xs shrink-0 min-h-[44px] flex items-center justify-center tracking-wide";
                      }

                      // ❌ Cancel / Delete → Red
                      if (
                        lower === "cancel" || 
                        lower === "delete" || 
                        lower === "remove" || 
                        lower === "discard"
                      ) {
                        return "bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white border border-rose-600 text-xs sm:text-sm font-extrabold px-4 py-2.5 rounded-2xl cursor-pointer transition-all shadow-md hover:shadow-lg shrink-0 min-h-[44px] flex items-center justify-center tracking-wide";
                      }

                      // Default options (Storage, RAM, Warranty, Brands, Categories, Condition tags, etc.)
                      return "bg-emerald-50 hover:bg-emerald-100 text-[#075E54] active:bg-emerald-200 border border-emerald-300 text-xs sm:text-sm font-extrabold px-4 py-2.5 rounded-2xl cursor-pointer transition-all shadow-xs shrink-0 min-h-[44px] flex items-center justify-center";
                    };

                    return (
                      <div className="mt-3 flex flex-wrap gap-2 border-t border-slate-100 pt-3 animate-fade-in">
                        {currentOpts.map(opt => (
                          <button
                            key={opt}
                            type="button"
                            onClick={() => handleOptionClick(opt)}
                            className={getOptionButtonClass(opt)}
                          >
                            {opt}
                          </button>
                        ))}
                      </div>
                    );
                  })()}
                  
                  {/* Timestamp & Status checks */}
                  <div className="text-[9px] text-slate-400 text-right mt-1.5 flex items-center justify-end gap-1 font-mono">
                    <span>{msg.timestamp}</span>
                    {msg.sender === "user" && (
                      <CheckCheck className="w-3.5 h-3.5 text-sky-500 shrink-0" />
                    )}
                  </div>
                </div>
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>

          {/* PRICE INPUT QUICK CHIPS ACCENT PANEL */}
          {((session.currentFlow === "add_product" && session.step === 5) || 
            (session.currentFlow === "update_product" && session.step === 31)) && (
            <div className="bg-slate-50 px-4 py-3.5 border-t border-slate-200 shrink-0">
              <p className="text-[10px] font-sans font-black text-slate-800 mb-2 uppercase tracking-wider flex items-center gap-1">
                <span>Selling Price Quick Chips</span>
              </p>
              
              <div className="space-y-2">
                <div className="flex gap-2">
                  <span className="bg-slate-200 text-slate-700 text-xs font-bold px-3 py-2 rounded-xl flex items-center justify-center shrink-0">₦</span>
                  {["100K", "200K", "300K"].map(chip => (
                    <button
                      key={chip}
                      type="button"
                      onClick={() => handleOptionClick(chip)}
                      className="flex-1 bg-emerald-50 hover:bg-emerald-100 text-[#075E54] border border-emerald-200 text-xs font-extrabold py-2 rounded-xl cursor-pointer transition-colors shadow-xs"
                    >
                      {chip}
                    </button>
                  ))}
                </div>
                <div className="flex gap-2 pl-8">
                  {["500K", "750K", "1M"].map(chip => (
                    <button
                      key={chip}
                      type="button"
                      onClick={() => handleOptionClick(chip)}
                      className="flex-1 bg-emerald-50 hover:bg-emerald-100 text-[#075E54] border border-emerald-200 text-xs font-extrabold py-2 rounded-xl cursor-pointer transition-colors shadow-xs"
                    >
                      {chip}
                    </button>
                  ))}
                </div>
                <p className="text-[9px] font-mono text-slate-400 mt-1 italic">
                  * Tapping a quick chip submits it instantly as ₦100,000, ₦500,000, or ₦1,000,000. You can also type custom amounts below manually.
                </p>
              </div>
            </div>
          )}

          {/* HIGH-FIDELITY MEDIA FILE UPLOAD PANEL */}
          {((session.currentFlow === "add_product" && [10, 101, 102, 103, 104].includes(session.step)) || 
            (session.currentFlow === "update_product" && session.step === 34)) && (
            <div className="bg-slate-50 px-4 py-3 border-t border-slate-200 shrink-0 space-y-2">
              <p className="text-[9px] font-mono font-bold text-slate-400 uppercase tracking-wide">
                📎 Media Attachments Upload
              </p>

              {uploading && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex flex-col gap-2">
                  <div className="flex items-center justify-between text-xs font-bold text-[#075E54]">
                    <span className="flex items-center gap-1.5">
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Uploading to Supabase Storage...
                    </span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                    <div 
                      className="bg-[#075E54] h-1.5 rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}

              {uploadError && (
                <div className="bg-rose-50 border border-rose-200 text-rose-800 rounded-xl p-3 text-[11px] space-y-1">
                  <p className="font-bold flex items-center gap-1 text-rose-700">⚠️ Upload Error</p>
                  <p className="leading-snug">{uploadError}</p>
                </div>
              )}

              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={uploading}
                  onClick={() => photoInputRef.current?.click()}
                  className="flex-1 flex items-center justify-center gap-1.5 p-2.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-800 hover:bg-slate-100 cursor-pointer transition-colors disabled:opacity-50"
                >
                  📷 Photos
                </button>
                <button
                  type="button"
                  disabled={uploading}
                  onClick={() => videoInputRef.current?.click()}
                  className="flex-1 flex items-center justify-center gap-1.5 p-2.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-800 hover:bg-slate-100 cursor-pointer transition-colors disabled:opacity-50"
                >
                  🎥 Video
                </button>
                <button
                  type="button"
                  disabled={uploading}
                  onClick={() => handleOptionClick((uploadedImages.length > 0 || Boolean(uploadedVideo)) ? "Continue" : "Skip")}
                  className={`px-4 py-2.5 rounded-xl text-xs font-extrabold cursor-pointer transition-colors disabled:opacity-50 ${
                    (uploadedImages.length > 0 || Boolean(uploadedVideo))
                      ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
                      : "bg-slate-200 hover:bg-slate-300 text-slate-700"
                  }`}
                >
                  {(uploadedImages.length > 0 || Boolean(uploadedVideo)) ? "Continue" : "Skip"}
                </button>

                <input 
                  ref={photoInputRef}
                  type="file" 
                  accept="image/*" 
                  multiple
                  disabled={uploading}
                  onChange={async (e) => {
                    const files: File[] = Array.from(e.target.files ?? []);
                    if (files.length > 0) {
                      localStorage.setItem("restockr_last_media_tab", "photos");
                      for (const file of files) {
                        await handleMediaUpload(file, "image");
                      }
                    }
                  }}
                  className="hidden" 
                />
                <input 
                  ref={videoInputRef}
                  type="file" 
                  accept="video/*" 
                  disabled={uploading}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      localStorage.setItem("restockr_last_media_tab", "video");
                      handleMediaUpload(file, "video");
                    }
                  }}
                  className="hidden" 
                />
              </div>
            </div>
          )}

          {/* Interactive Input form */}
          <form onSubmit={handleSendMessage} className="bg-[#F0F0F0] p-3 flex gap-2 items-center border-t border-slate-200 shrink-0">
            <input
              type="text"
              placeholder="Type WhatsApp command..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              className="flex-1 bg-white border border-slate-300 rounded-full px-4 py-2 text-xs focus:outline-none"
            />
            <button
              type="submit"
              className="p-2.5 bg-[#075E54] hover:bg-[#064e46] text-white rounded-full cursor-pointer shrink-0 transition-colors shadow-md"
            >
              <Send className="w-4 h-4 text-white" />
            </button>
          </form>

        </div>

      </div>

      {/* Media Video Viewer Modal */}
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

      {/* Media Image Gallery Modal */}
      {selectedImages.length > 0 && (
        <ImageGalleryModal
          isOpen={isImageModalOpen}
          images={selectedImages}
          onClose={() => {
            setIsImageModalOpen(false);
            setSelectedImages([]);
          }}
        />
      )}

      {/* Quick Menu Overlay Drawer */}
      {isQuickMenuOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in">
          <div className="bg-white rounded-t-3xl sm:rounded-3xl w-full max-w-md p-5 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h4 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
                <Menu className="w-5 h-5 text-emerald-700" /> Assistant Quick Actions
              </h4>
              <button
                type="button"
                onClick={() => setIsQuickMenuOpen(false)}
                className="text-slate-400 hover:text-slate-700 font-bold text-sm p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => {
                  setIsQuickMenuOpen(false);
                  handleOptionClick("View Inventory");
                }}
                className="bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-900 font-extrabold p-3.5 rounded-2xl text-xs flex items-center gap-2 cursor-pointer transition-all min-h-[50px]"
              >
                <Package className="w-4 h-4 text-emerald-700" /> View Inventory
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsQuickMenuOpen(false);
                  handleOptionClick("Add Product");
                }}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold p-3.5 rounded-2xl text-xs flex items-center gap-2 cursor-pointer transition-all min-h-[50px] shadow-sm"
              >
                <Plus className="w-4 h-4 text-white" /> Add Product
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsQuickMenuOpen(false);
                  handleOptionClick("Sell Product");
                }}
                className="bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-800 font-extrabold p-3.5 rounded-2xl text-xs flex items-center gap-2 cursor-pointer transition-all min-h-[50px]"
              >
                <ShoppingCart className="w-4 h-4 text-slate-700" /> Sell Product
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsQuickMenuOpen(false);
                  handleOptionClick("Update Product");
                }}
                className="bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-800 font-extrabold p-3.5 rounded-2xl text-xs flex items-center gap-2 cursor-pointer transition-all min-h-[50px]"
              >
                <Edit className="w-4 h-4 text-slate-700" /> Update Product
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsQuickMenuOpen(false);
                  handleOptionClick("Register Staff");
                }}
                className="bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-800 font-extrabold p-3.5 rounded-2xl text-xs flex items-center gap-2 cursor-pointer transition-all min-h-[50px]"
              >
                <UserPlus className="w-4 h-4 text-slate-700" /> Register Staff
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsQuickMenuOpen(false);
                  handleOptionClick("View Sales");
                }}
                className="bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-800 font-extrabold p-3.5 rounded-2xl text-xs flex items-center gap-2 cursor-pointer transition-all min-h-[50px]"
              >
                <Receipt className="w-4 h-4 text-slate-700" /> View Sales
              </button>
            </div>

            <div className="pt-2 flex justify-between">
              <button
                type="button"
                onClick={() => {
                  setIsQuickMenuOpen(false);
                  handleNavigation("home");
                }}
                className="w-full bg-slate-900 text-white font-extrabold py-3 rounded-2xl text-xs cursor-pointer hover:bg-slate-800 transition-colors"
              >
                Return to Main Menu
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Product Detail Modal */}
      {viewingDetailProduct && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-fade-in">
          <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl space-y-4 p-5 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-mono font-bold text-emerald-700 uppercase tracking-widest bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-md">
                  {viewingDetailProduct.category} • {viewingDetailProduct.brand}
                </span>
                <h3 className="text-xl font-black text-slate-900 mt-2">{viewingDetailProduct.brand} {viewingDetailProduct.model}</h3>
              </div>
              <button
                type="button"
                onClick={() => setViewingDetailProduct(null)}
                className="text-slate-400 hover:text-slate-700 text-sm font-bold bg-slate-100 hover:bg-slate-200 p-2 rounded-full cursor-pointer transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Media Viewer */}
            <div className="relative rounded-2xl overflow-hidden bg-slate-950 border border-slate-200 aspect-video flex items-center justify-center group shadow-inner">
              {viewingDetailProduct.productImages && viewingDetailProduct.productImages.length > 0 ? (
                <img 
                  src={viewingDetailProduct.productImages[0]} 
                  alt={viewingDetailProduct.model} 
                  className="w-full h-full object-cover" 
                />
              ) : viewingDetailProduct.productVideo ? (
                <video src={viewingDetailProduct.productVideo} className="w-full h-full object-cover" />
              ) : (
                <img 
                  src={getCategoryPlaceholder(viewingDetailProduct.category)} 
                  alt={viewingDetailProduct.model} 
                  className="w-full h-full object-cover" 
                />
              )}

              <div className="absolute inset-0 bg-black/40 flex items-center justify-center gap-2 p-3 opacity-90 hover:opacity-100 transition-opacity">
                {viewingDetailProduct.productImages && viewingDetailProduct.productImages.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedImages(viewingDetailProduct.productImages || []);
                      setIsImageModalOpen(true);
                    }}
                    className="bg-white hover:bg-slate-100 text-slate-900 text-xs font-bold px-3.5 py-2 rounded-xl flex items-center gap-1.5 shadow cursor-pointer transition-all"
                  >
                    📷 View Images ({viewingDetailProduct.productImages.length})
                  </button>
                )}
                {(db.getResolvedVideoUrl(viewingDetailProduct) || viewingDetailProduct.productVideo) && (
                  <button
                    type="button"
                    onClick={() => {
                      const vUrl = db.getResolvedVideoUrl(viewingDetailProduct) || viewingDetailProduct.productVideo || "";
                      if (vUrl) {
                        setSelectedVideoUrl(vUrl);
                        setIsVideoModalOpen(true);
                      }
                    }}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3.5 py-2 rounded-xl flex items-center gap-1.5 shadow cursor-pointer transition-all"
                  >
                    🎥 View Video
                  </button>
                )}
              </div>
            </div>

            {/* Specs Grid */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                <span className="text-[10px] text-slate-400 font-mono block uppercase font-bold">Selling Price</span>
                <span className="font-black text-emerald-700 text-base">₦{viewingDetailProduct.sellingPrice.toLocaleString()}</span>
              </div>
              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                <span className="text-[10px] text-slate-400 font-mono block uppercase font-bold">Storage / Spec</span>
                <span className="font-extrabold text-slate-800">{viewingDetailProduct.storage} {viewingDetailProduct.ram ? `/ ${viewingDetailProduct.ram}` : ""}</span>
              </div>
              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                <span className="text-[10px] text-slate-400 font-mono block uppercase font-bold">Warranty</span>
                <span className="font-extrabold text-slate-800">{viewingDetailProduct.warranty || "No Warranty"}</span>
              </div>
              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                <span className="text-[10px] text-slate-400 font-mono block uppercase font-bold">Status</span>
                <span className={`font-black uppercase ${viewingDetailProduct.status === "Available" ? "text-emerald-600" : "text-rose-600"}`}>
                  {viewingDetailProduct.status}
                </span>
              </div>
              {viewingDetailProduct.batteryHealth && (
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                  <span className="text-[10px] text-slate-400 font-mono block uppercase font-bold">Battery Health</span>
                  <span className="font-extrabold text-emerald-600">🔋 {viewingDetailProduct.batteryHealth}</span>
                </div>
              )}
            </div>

            {/* Condition Tags */}
            {viewingDetailProduct.condition && viewingDetailProduct.condition.length > 0 && (
              <div className="space-y-1">
                <span className="text-[10px] text-slate-400 font-mono block uppercase font-bold">Condition Tags</span>
                <QuickTagsBadgeList 
                  tags={viewingDetailProduct.condition} 
                  batteryHealth={viewingDetailProduct.batteryHealth} 
                  variant="light" 
                />
              </div>
            )}

            {/* Action Buttons based on logged in user permissions */}
            <div className="pt-3 border-t border-slate-100 grid grid-cols-2 gap-2">
              {(isOwner || staffProfile?.permissions?.sellProduct) && viewingDetailProduct.status === "Available" && (
                <button
                  type="button"
                  onClick={() => {
                    const prod = viewingDetailProduct;
                    setViewingDetailProduct(null);
                    handleOptionClick(`Sell Product [${prod.brand} ${prod.model}]`);
                  }}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs py-3 px-4 rounded-xl flex items-center justify-center gap-1.5 cursor-pointer min-h-[44px] shadow-sm"
                >
                  💰 Sell Product
                </button>
              )}

              {(isOwner || staffProfile?.permissions?.editProduct) && (
                <button
                  type="button"
                  onClick={() => {
                    const prod = viewingDetailProduct;
                    setViewingDetailProduct(null);
                    handleOptionClick(`Update Product [${prod.brand} ${prod.model}]`);
                  }}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs py-3 px-4 rounded-xl flex items-center justify-center gap-1.5 border border-slate-300 cursor-pointer min-h-[44px]"
                >
                  ✏️ Edit Product
                </button>
              )}

              {(isOwner || staffProfile?.permissions?.addProduct || staffProfile?.permissions?.editProduct) && (
                <button
                  type="button"
                  onClick={() => {
                    const prod = viewingDetailProduct;
                    const copy: Product = {
                      ...prod,
                      id: `prod-${Date.now()}`,
                      model: `${prod.model} - Copy`,
                      quantity: 1,
                      status: "Available",
                      createdAt: new Date().toISOString()
                    };
                    onSaveProduct(copy);
                    setViewingDetailProduct(null);
                    addBotMessageOnly(`📋 *PRODUCT DUPLICATED*\nCreated duplicate: *${copy.brand} ${copy.model}*`);
                  }}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs py-3 px-4 rounded-xl flex items-center justify-center gap-1.5 border border-slate-300 cursor-pointer min-h-[44px]"
                >
                  📄 Duplicate
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  const prod = viewingDetailProduct;
                  const quoteText = `📱 *${prod.brand} ${prod.model} (${prod.storage})*\nPrice: *₦${prod.sellingPrice.toLocaleString()}*\nCondition: ${prod.condition?.join(", ") || "Clean"}\nWarranty: ${prod.warranty || "No Warranty"}`;
                  navigator.clipboard?.writeText(quoteText);
                  setViewingDetailProduct(null);
                  addBotMessageOnly(`📋 *QUOTE COPIED TO CLIPBOARD*\n\n${quoteText}`);
                }}
                className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs py-3 px-4 rounded-xl flex items-center justify-center gap-1.5 border border-slate-300 cursor-pointer min-h-[44px]"
              >
                📤 Share Quote
              </button>

              {isOwner && viewingDetailProduct.status === "Available" && (
                <button
                  type="button"
                  onClick={() => {
                    const prod = viewingDetailProduct;
                    if (confirm(`Are you sure you want to delete ${prod.brand} ${prod.model}?`)) {
                      db.deleteProduct(shopId || "", prod.id);
                      setViewingDetailProduct(null);
                      addBotMessageOnly(`🗑️ *PRODUCT DELETED*\nRemoved *${prod.brand} ${prod.model}* from catalog.`);
                    }
                  }}
                  className="col-span-2 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs py-3 px-4 rounded-xl flex items-center justify-center gap-1.5 border border-rose-200 cursor-pointer min-h-[44px]"
                >
                  🗑 Delete Product
                </button>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
