import React, { useState, useEffect } from "react";
import { Product, Category, Sale, Shop } from "../types";
import { db } from "../lib/database";
import { DEVICE_DATABASE, CATEGORY_BRANDS, BRAND_DISPLAY_NAMES, WARRANTY_OPTIONS, parseShortenedPriceToNumber, formatShortenedPriceInput, getCategoryQuickTags } from "../lib/deviceDb";
import { Plus, Search, SlidersHorizontal, Trash2, CreditCard as Edit3, X, Image as ImageIcon, Video, Save, Sparkles, CircleCheck as CheckCircle2, ChevronDown, Package, Layers, Smartphone, HardDrive, CreditCard, Box, Key, Tag, ShieldCheck, ChevronUp, CircleAlert as AlertCircle, FileText, RefreshCw, Play, Loader as Loader2 } from "lucide-react";
import OfficialReceiptModal from "./OfficialReceiptModal";
import { VideoPlayerModal } from "./VideoPlayerModal";
import { uploadFileToSupabase } from "../lib/supabase";
import QuickTagsBadgeList from "./QuickTagsBadgeList";

interface InventoryManagerProps {
  shopId: string;
  shop: Shop;
  products: Product[];
  onSaveProduct: (product: Product) => void | Promise<void>;
  onDeleteProduct: (id: string) => void | Promise<void>;
  onSaveSale?: (sale: Sale) => void | Promise<void>;
  showAddFormImmediately?: boolean;
  onCloseQuickForm?: () => void;
}

const getCategoryEmoji = (category: string): string => {
  switch (category) {
    case Category.Phones: return "📱";
    case Category.Laptops: return "💻";
    case Category.SmartWatches: return "⌚";
    case Category.Tablets: return "📟";
    case Category.GameConsoles: return "🎮";
    case Category.Accessories: return "🎧";
    default: return "📦";
  }
};

const getStorageFallbacks = (cat: Category): string[] => {
  switch (cat) {
    case Category.Laptops:
      return ["128GB SSD", "256GB SSD", "512GB SSD", "1TB SSD", "2TB SSD"];
    case Category.Tablets:
      return ["32GB", "64GB", "128GB", "256GB", "512GB", "1TB", "2TB"];
    case Category.GameConsoles:
      return ["120GB", "250GB", "500GB", "825GB", "1TB", "2TB"];
    case Category.SmartWatches:
      return ["40mm", "41mm", "42mm", "43mm", "44mm", "45mm", "46mm", "47mm", "49mm", "51mm"];
    case Category.Phones:
    default:
      return ["64GB", "128GB", "256GB", "512GB", "1TB"];
  }
};

export default function InventoryManager({
  shopId,
  shop,
  products,
  onSaveProduct,
  onDeleteProduct,
  onSaveSale,
  showAddFormImmediately = false,
  onCloseQuickForm
}: InventoryManagerProps) {
  // UI State
  const [isFormOpen, setIsFormOpen] = useState(showAddFormImmediately);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [selectedBrand, setSelectedBrand] = useState<string>("All");
  const [selectedStatus, setSelectedStatus] = useState<string>("Available");
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  const [selectedVideoUrl, setSelectedVideoUrl] = useState<string>("");
  const searchInputRef = React.useRef<HTMLInputElement>(null);

  // Sales list state for linking sold products
  const [salesList, setSalesList] = useState<Sale[]>([]);
  useEffect(() => {
    setSalesList(db.getSales(shopId));
  }, [shopId, products]);

  const handleReverseSale = (saleId: string) => {
    triggerDeleteConfirm("Transaction Reversal", async () => {
      const result = await db.undoSale(shopId, saleId, "Owner");
      if (!result.success) {
        alert(result.message);
      }
    }, "Are you sure you want to REVERSE / UNDO this sale? This will immediately restore the product back to active available stock, recalculate customer metrics, and completely delete the sales record.");
  };

  // New state for custom quick tag addition
  const [customTagInput, setCustomTagInput] = useState("");
  const [showCustomTagForm, setShowCustomTagForm] = useState(false);

  // Direct sale from inventory card state
  const [isSellModalOpen, setIsSellModalOpen] = useState(false);
  const [selectedSellProduct, setSelectedSellProduct] = useState<Product | null>(null);
  const [sellCustomerName, setSellCustomerName] = useState("");
  const [sellCustomerPhone, setSellCustomerPhone] = useState("");
  const [sellPaymentMethod, setSellPaymentMethod] = useState<"Cash" | "Transfer" | "POS" | "Split">("Transfer");
  const [sellSplitCash, setSellSplitCash] = useState("");
  const [sellSplitTransfer, setSellSplitTransfer] = useState("");
  const [sellSplitPos, setSellSplitPos] = useState("");
  const [sellPrice, setSellPrice] = useState("");
  const [sellDiscount, setSellDiscount] = useState("");
  const [sellWarranty, setSellWarranty] = useState("");
  const [sellNotes, setSellNotes] = useState("");
  const [activeReceiptSale, setActiveReceiptSale] = useState<Sale | null>(null);

  const handleOpenSellModal = (product: Product) => {
    setSelectedSellProduct(product);
    setSellPrice(product.sellingPrice.toString());
    setSellDiscount("0");
    setSellWarranty(product.warranty || "No Warranty");
    setSellNotes("");
    setSellCustomerName("");
    setSellCustomerPhone("");
    setSellPaymentMethod("Transfer");
    setSellSplitCash("");
    setSellSplitTransfer("");
    setSellSplitPos("");
    setIsSellModalOpen(true);
  };

  const handleSellSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSellProduct) return;

    if (selectedSellProduct.quantity <= 0) {
      alert("This item is sold out and cannot be sold.");
      return;
    }

    const priceNum = parseFloat(sellPrice) || 0;
    const discountNum = parseFloat(sellDiscount) || 0;
    const finalPrice = Math.max(0, priceNum - discountNum);

    if (!sellCustomerPhone.trim()) {
      alert("Please specify customer's contact phone number.");
      return;
    }

    // Split validation if paymentMethod is Split
    let splitDetails = undefined;
    if (sellPaymentMethod === "Split") {
      const cashAmt = parseFloat(sellSplitCash) || 0;
      const transAmt = parseFloat(sellSplitTransfer) || 0;
      const posAmt = parseFloat(sellSplitPos) || 0;
      const splitTotal = cashAmt + transAmt + posAmt;

      if (splitTotal !== finalPrice) {
        alert(
          `Split payment amounts (₦${splitTotal.toLocaleString()}) do not equal final price (₦${finalPrice.toLocaleString()}).\n` +
          `Difference: ₦${(finalPrice - splitTotal).toLocaleString()}`
        );
        return;
      }

      splitDetails = {
        cash: cashAmt,
        transfer: transAmt,
        pos: posAmt
      };
    }

    // Generate UUID receipt code
    const secureUUID = `rec-${Math.random().toString(36).substr(2, 9).toUpperCase()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;

    const newSale: Sale = {
      id: secureUUID,
      shop_id: selectedSellProduct.shop_id,
      productId: selectedSellProduct.id,
      productName: `${selectedSellProduct.brand} ${selectedSellProduct.model} (${selectedSellProduct.storage})`,
      quantity: 1, // Selling 1 unit from inventory card directly
      unitPrice: finalPrice,
      totalAmount: finalPrice,
      paymentMethod: sellPaymentMethod,
      splitDetails,
      customerName: sellCustomerName || "Walk-in Customer",
      customerPhone: sellCustomerPhone,
      soldBy: "Owner", // Defaulting to owner in dashboard context
      createdAt: new Date().toISOString()
    };

    if (onSaveSale) {
      onSaveSale(newSale);
    }

    setIsSellModalOpen(false);
    setActiveReceiptSale(newSale); // Display receipt overlay
  };

  // Focus search input on open
  useEffect(() => {
    if (isSearchOpen) {
      const timer = setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isSearchOpen]);

  // Edit Mode state
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const isProductSold = editingProduct?.status === "SOLD";

  // Video playback indicator
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  // Image preview overlay
  const [previewImgUrl, setPreviewImgUrl] = useState<string | null>(null);

  // Confirmation state
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

  const triggerDeleteConfirm = (itemType: string, confirmCallback: () => void | Promise<void>, customDesc?: string) => {
    setConfirmModal({
      isOpen: true,
      title: "Delete Confirmation",
      description: customDesc || `Are you sure you want to delete this ${itemType}?`,
      onConfirm: () => {
        confirmCallback();
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  // Form Fields
  const [formCategory, setFormCategory] = useState<Category>(Category.Phones);
  const [formBrand, setFormBrand] = useState<string>("Apple");
  const [customBrand, setCustomBrand] = useState<string>("");
  const [formModel, setFormModel] = useState<string>("");
  const [customModel, setCustomModel] = useState<string>("");
  const [formVariant, setFormVariant] = useState<string>("");
  const [formStorage, setFormStorage] = useState<string>("");
  const [customStorage, setCustomStorage] = useState<string>("");
  const [formQuantity, setFormQuantity] = useState<number>(1);
  const [formSellingPrice, setFormSellingPrice] = useState<string>("");

  const [formImages, setFormImages] = useState<string[]>([]);
  const [formVideo, setFormVideo] = useState<string>("");
  const [formMediaTab, setFormMediaTab] = useState<"photos" | "video">(() => {
    try {
      const saved = localStorage.getItem("restockr_last_media_tab");
      if (saved === "video") return "video";
    } catch (e) {
      // ignore
    }
    return "photos";
  });

  const changeMediaTab = (tab: "photos" | "video") => {
    setFormMediaTab(tab);
    try {
      localStorage.setItem("restockr_last_media_tab", tab);
    } catch (e) {
      // ignore
    }
  };
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingVideo, setIsUploadingVideo] = useState(false);
  const [isUploadingImages, setIsUploadingImages] = useState(false);

  // Detailed Condition Fields (Durable Nigerian Condition storage)
  const [formFaceId, setFormFaceId] = useState<string>("Working");
  const [formNetwork, setFormNetwork] = useState<string>("Factory Unlocked");
  const [formBatteryHealthVal, setFormBatteryHealthVal] = useState<string>("100%");
  const [formWarranty, setFormWarranty] = useState<string>("No Warranty");
  const [formConditionTags, setFormConditionTags] = useState<string[]>([]);

  // Custom Notes & Text fields
  const [customFaceId, setCustomFaceId] = useState<string>("");
  const [customNetwork, setCustomNetwork] = useState<string>("");
  const [formAdditionalNotes, setFormAdditionalNotes] = useState<string>("");

  // Model search / autocompletion
  const [modelSearch, setModelSearch] = useState("");
  const [filteredSuggestions, setFilteredSuggestions] = useState<typeof DEVICE_DATABASE>([]);
  
  // Custom dropdown open states (Native premium UI)
  const [activeDropdown, setActiveDropdown] = useState<"category" | "brand" | "storage" | "warranty" | "model" | null>(null);
  const [isConditionExpanded, setIsConditionExpanded] = useState(true);

  // Toggle Filters State
  const [isFilterExpanded, setIsFilterExpanded] = useState(false);

  // Populate dynamic brands on Category change
  const handleCategoryChange = (cat: Category) => {
    setFormCategory(cat);
    const brands = CATEGORY_BRANDS[cat] || [];
    if (brands.length > 0) {
      setFormBrand(brands[0]);
    } else {
      setFormBrand("Other");
    }
    setCustomBrand("");
    setFormModel("");
    setCustomModel("");
    setModelSearch("");
    setFormStorage("");
    setCustomStorage("");
    setActiveDropdown(null);
  };

  const handleBrandChange = (brand: string) => {
    setFormBrand(brand);
    setCustomBrand("");
    setFormModel("");
    setCustomModel("");
    setModelSearch("");
    setFormStorage("");
    setCustomStorage("");
    setActiveDropdown(null);
  };

  // Trigger form opening if requested immediately
  useEffect(() => {
    if (showAddFormImmediately) {
      setIsFormOpen(true);
      resetForm();
    }
  }, [showAddFormImmediately]);

  // Handle device database search - recommends only products matching chosen Category and Brand
  useEffect(() => {
    const matchingDatabase = DEVICE_DATABASE.filter(
      d => d.category === formCategory && d.brand.toLowerCase() === formBrand.toLowerCase()
    );

    if (!modelSearch.trim()) {
      setFilteredSuggestions(matchingDatabase);
      return;
    }

    const filtered = matchingDatabase.filter(
      d => d.name.toLowerCase().includes(modelSearch.toLowerCase())
    );
    setFilteredSuggestions(filtered);
  }, [modelSearch, formCategory, formBrand]);

  const resetForm = () => {
    setEditingProduct(null);
    setFormCategory(Category.Phones);
    setFormBrand("Apple");
    setCustomBrand("");
    setFormModel("");
    setCustomModel("");
    setModelSearch("");
    setFormVariant("");
    setFormStorage("");
    setCustomStorage("");
    setFormQuantity(1);
    setFormSellingPrice("");
    setFormImages([]);
    setFormVideo("");
    
    // Default condition parameters
    setFormFaceId("Working");
    setFormNetwork("Factory Unlocked");
    setFormBatteryHealthVal("100%");
    setFormWarranty("No Warranty");
    setFormConditionTags([]);

    // Reset Custom other notes states
    setCustomFaceId("");
    setCustomNetwork("");
    setFormAdditionalNotes("");
    
    setIsConditionExpanded(true);
    setActiveDropdown(null);
    clearDraft();
  };

  // Draft auto-save — preserves in-progress form data across remounts/session interruptions
  const DRAFT_KEY = `restockr_product_draft_${shopId}`;
  const saveDraft = () => {
    if (editingProduct) return; // Don't save drafts when editing existing products
    const draft = {
      formCategory, formBrand, customBrand, formModel, customModel, modelSearch,
      formVariant, formStorage, customStorage, formQuantity, formSellingPrice,
      formImages, formVideo, formFaceId, formNetwork, formBatteryHealthVal,
      formWarranty, formConditionTags, customFaceId, customNetwork, formAdditionalNotes,
    };
    try { localStorage.setItem(DRAFT_KEY, JSON.stringify(draft)); } catch (e) { /* ignore */ }
  };
  const clearDraft = () => {
    try { localStorage.removeItem(DRAFT_KEY); } catch (e) { /* ignore */ }
  };

  // Restore draft on mount (only if not editing and form is open via quick-add)
  useEffect(() => {
    if (editingProduct || !showAddFormImmediately) return;
    try {
      const saved = localStorage.getItem(DRAFT_KEY);
      if (saved) {
        const d = JSON.parse(saved);
        if (d.formCategory) setFormCategory(d.formCategory);
        if (d.formBrand) setFormBrand(d.formBrand);
        if (d.customBrand !== undefined) setCustomBrand(d.customBrand);
        if (d.formModel !== undefined) setFormModel(d.formModel);
        if (d.customModel !== undefined) setCustomModel(d.customModel);
        if (d.modelSearch !== undefined) setModelSearch(d.modelSearch);
        if (d.formVariant !== undefined) setFormVariant(d.formVariant);
        if (d.formStorage !== undefined) setFormStorage(d.formStorage);
        if (d.customStorage !== undefined) setCustomStorage(d.customStorage);
        if (d.formQuantity !== undefined) setFormQuantity(d.formQuantity);
        if (d.formSellingPrice !== undefined) setFormSellingPrice(d.formSellingPrice);
        if (d.formImages) setFormImages(d.formImages);
        if (d.formVideo !== undefined) setFormVideo(d.formVideo);
        if (d.formFaceId) setFormFaceId(d.formFaceId);
        if (d.formNetwork) setFormNetwork(d.formNetwork);
        if (d.formBatteryHealthVal) setFormBatteryHealthVal(d.formBatteryHealthVal);
        if (d.formWarranty) setFormWarranty(d.formWarranty);
        if (d.formConditionTags) setFormConditionTags(d.formConditionTags);
        if (d.customFaceId !== undefined) setCustomFaceId(d.customFaceId);
        if (d.customNetwork !== undefined) setCustomNetwork(d.customNetwork);
        if (d.formAdditionalNotes !== undefined) setFormAdditionalNotes(d.formAdditionalNotes);
      }
    } catch (e) { /* ignore */ }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-save draft whenever form fields change (debounced)
  useEffect(() => {
    if (editingProduct || !isFormOpen) return;
    const timer = setTimeout(() => saveDraft(), 500);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formCategory, formBrand, customBrand, formModel, customModel, modelSearch,
      formVariant, formStorage, customStorage, formQuantity, formSellingPrice,
      formImages, formVideo, formFaceId, formNetwork, formBatteryHealthVal,
      formWarranty, formConditionTags, customFaceId, customNetwork, formAdditionalNotes,
      isFormOpen, editingProduct]);

  // Populate form for editing
  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setFormCategory(product.category);
    setFormBrand(product.brand);
    setCustomBrand("");
    setFormModel(product.model);
    setCustomModel("");
    setModelSearch(product.model);
    setFormVariant(product.variant || "");
    setFormStorage(product.storage);
    setCustomStorage("");
    setFormQuantity(product.quantity);
    setFormSellingPrice(product.sellingPrice.toString());
    setFormImages(product.productImages || []);
    setFormVideo(db.getResolvedVideoUrl(product) || product.productVideo || "");
    
    // Parse condition details
    setFormWarranty(product.warranty || "No Warranty");
    setFormBatteryHealthVal(product.batteryHealth || "100%");
    
    const faceIdTag = product.condition.find(c => c.startsWith("Face ID: "))?.replace("Face ID: ", "") || "Working";
    if (faceIdTag.startsWith("Other: ")) {
      setFormFaceId("Other");
      setCustomFaceId(faceIdTag.replace("Other: ", ""));
    } else {
      setFormFaceId(faceIdTag);
      setCustomFaceId("");
    }

    const networkTag = product.condition.find(c => c.startsWith("Network: "))?.replace("Network: ", "") || "Factory Unlocked";
    if (networkTag.startsWith("Other: ")) {
      setFormNetwork("Other");
      setCustomNetwork(networkTag.replace("Other: ", ""));
    } else {
      setFormNetwork(networkTag);
      setCustomNetwork("");
    }

    const notesTag = product.condition.find(c => c.startsWith("Notes: "))?.replace("Notes: ", "") || "";
    setFormAdditionalNotes(notesTag);

    // Extract all selected condition tags (excluding Notes:)
    const allConditionTags = (product.condition || []).filter(c => !c.startsWith("Notes: "));
    setFormConditionTags(allConditionTags);
    
    setIsConditionExpanded(true); // Open condition parameters automatically on edit
    setIsFormOpen(true);
  };

  // Autocomplete select - Auto-loads official specs
  const handleSelectDevice = (device: typeof DEVICE_DATABASE[0]) => {
    setFormModel(device.name);
    setCustomModel("");
    setModelSearch(device.name);
    setFormStorage(device.storages[0] || "");
    setCustomStorage("");
    setActiveDropdown(null);
  };

  // Image Upload handler — shows instant local preview, then uploads to storage and swaps in the permanent URL
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files: File[] = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setIsUploadingImages(true);
    changeMediaTab("photos");

    for (const file of files) {
      if (file.size > 10 * 1024 * 1024) {
        alert(`Image ${file.name} exceeds 10MB size limit.`);
        continue;
      }

      // Instant local preview so the user sees the photo immediately
      const localPreview = URL.createObjectURL(file);
      const tempId = localPreview;
      setFormImages(prev => [...prev, localPreview]);

      try {
        const permanentUrl = await uploadFileToSupabase(file, "image");
        setFormImages(prev => prev.map(img => img === tempId ? permanentUrl : img));
      } catch (err: any) {
        // Remove the failed preview so the user knows it didn't work
        setFormImages(prev => prev.filter(img => img !== tempId));
        URL.revokeObjectURL(localPreview);
        alert(err.message || `Failed to upload image "${file.name}". Please try again.`);
      }
    }

    setIsUploadingImages(false);
  };

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 20 * 1024 * 1024) {
      alert("Video exceeds maximum 20MB size limit.");
      return;
    }

    // Instant local preview so the user sees the video immediately
    const localPreview = URL.createObjectURL(file);
    setFormVideo(localPreview);
    changeMediaTab("video");
    setIsUploadingVideo(true);

    try {
      const permanentUrl = await uploadFileToSupabase(file, "video");
      setFormVideo(permanentUrl);
      URL.revokeObjectURL(localPreview);
    } catch (err: any) {
      setFormVideo("");
      URL.revokeObjectURL(localPreview);
      alert(err.message || "Failed to upload video. Please check your connection and try again.");
    } finally {
      setIsUploadingVideo(false);
    }
  };

  // Toggle custom condition quick tag
  const toggleConditionTag = (tag: string) => {
    if (formConditionTags.includes(tag)) {
      setFormConditionTags(prev => prev.filter(t => t !== tag));
    } else {
      setFormConditionTags(prev => [...prev, tag]);
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting || isUploadingVideo || isUploadingImages) {
      if (isUploadingVideo || isUploadingImages) {
        alert("Please wait for media uploads to finish before saving.");
      }
      return;
    }
    setIsSubmitting(true);

    try {
      // Determine Brand
      const finalBrand = formBrand === "Other" ? (customBrand.trim() || "Other") : formBrand;
      
      // Determine Model
      const finalModel = formModel === "Other" ? (customModel.trim() || "Custom Model") : (formModel || modelSearch || "Custom Model");
      
      // Determine Storage
      const finalStorage = formStorage === "Other" ? (customStorage.trim() || "N/A") : (formStorage || "N/A");

      if (!finalModel.trim()) {
        alert("Please specify or type a device model.");
        return;
      }
      if (!finalStorage.trim()) {
        alert("Please specify or enter device storage specs.");
        return;
      }
      const price = parseShortenedPriceToNumber(formSellingPrice);
      if (isNaN(price) || price <= 0) {
        alert("Please enter a valid selling price.");
        return;
      }

      // Filter out any blob: URLs that failed to upload (safety net)
      let finalImages = formImages.filter(img => !img.startsWith("blob:"));
      if (finalImages.length === 0) {
        if (formCategory === Category.Phones) {
          finalImages.push("https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&q=80&w=600");
        } else if (formCategory === Category.Laptops) {
          finalImages.push("https://images.unsplash.com/photo-1496181130204-755241544e35?auto=format&fit=crop&q=80&w=600");
        } else if (formCategory === Category.Tablets) {
          finalImages.push("https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?auto=format&fit=crop&q=80&w=600");
        } else if (formCategory === Category.GameConsoles) {
          finalImages.push("https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?auto=format&fit=crop&q=80&w=600");
        } else {
          finalImages.push("https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?auto=format&fit=crop&q=80&w=600");
        }
      }

      // Filter out blob: video URL that failed to upload
      const finalVideo = formVideo && !formVideo.startsWith("blob:") ? formVideo : undefined;

      // Build conditions storage array
      const conditionList: string[] = [];
      if (formConditionTags.length > 0) {
        conditionList.push(...formConditionTags);
      } else {
        conditionList.push("Clean Device");
      }

      if (formAdditionalNotes.trim()) {
        conditionList.push(`Notes: ${formAdditionalNotes.trim()}`);
      }

      const productData: Product = {
        id: editingProduct?.id || `prod-${Date.now()}`,
        shop_id: editingProduct?.shop_id || shopId,
        category: formCategory,
        brand: finalBrand,
        model: finalModel,
        variant: formVariant.trim() || undefined,
        storage: finalStorage,
        quantity: formQuantity,
        sellingPrice: price,
        batteryHealth: formBatteryHealthVal || undefined,
        warranty: formWarranty,
        minimumStockThreshold: 2,
        condition: conditionList,
        productImages: finalImages,
        productVideo: finalVideo,
        status: formQuantity > 0 ? "Available" : "Sold Out",
        createdAt: editingProduct?.createdAt || new Date().toISOString()
      };

      await onSaveProduct(productData);
      setIsFormOpen(false);
      resetForm();
      if (onCloseQuickForm) onCloseQuickForm();
    } catch (err: any) {
      alert(err.message || "Failed to save product. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter items
  const filteredProducts = products.filter(product => {
    const matchesSearch = 
      product.model.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.storage.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.condition.some(c => c.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesCategory = selectedCategory === "All" || product.category === selectedCategory;
    const matchesBrand = selectedBrand === "All" || product.brand === selectedBrand;
    const matchesStatus = 
      selectedStatus === "All" || 
      (selectedStatus === "Available" && product.status !== "SOLD" && product.quantity > 0) ||
      (selectedStatus === "Sold" && product.status === "SOLD") ||
      (selectedStatus === "Sold Out" && product.quantity === 0 && product.status !== "SOLD");

    return matchesSearch && matchesCategory && matchesBrand && matchesStatus;
  });

  // Get active model's default suggestions
  const activeModelDetails = DEVICE_DATABASE.find(
    d => d.category === formCategory && d.brand.toLowerCase() === formBrand.toLowerCase() && d.name.toLowerCase() === formModel.toLowerCase()
  );

  return (
    <div className="space-y-12 animate-fade-in text-white" id="inventory-manager-module">
      
      {/* Page Header with Search in top-right, spaced cleanly */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-8" id="inv-header">
        <div>
          <h1 className="text-3xl font-display font-black text-white uppercase tracking-wider">Inventory</h1>
          <p className="text-sm text-[#B7BCC7] mt-1.5">Manage gadget conditions, specs, prices, and media uploads effortlessly.</p>
        </div>
        
        {/* Top-Right Control Actions Group */}
        <div className="flex items-center gap-3 shrink-0 w-full sm:w-auto justify-end">
          {/* Search trigger icon button */}
          <button
            onClick={() => setIsSearchOpen(true)}
            className="p-3.5 bg-[#1A1D24] border border-[#313640] hover:border-zinc-500 rounded-xl text-[#B7BCC7] hover:text-white transition-all cursor-pointer shadow-md flex items-center justify-center"
            title="Search Inventory"
          >
            <Search className="w-5 h-5" />
          </button>

          {/* Toggle Filters Button */}
          <button
            onClick={() => setIsFilterExpanded(!isFilterExpanded)}
            className={`flex items-center justify-center gap-2 px-4 py-3.5 rounded-xl text-xs font-bold font-display uppercase tracking-wider border transition-all cursor-pointer shrink-0 ${
              isFilterExpanded 
                ? "bg-white text-black border-white" 
                : "bg-[#1A1D24] border-[#313640] text-white hover:bg-zinc-900"
            }`}
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span className="hidden sm:inline">Filters</span>
          </button>

          {/* Add Stock button */}
          <button
            onClick={() => {
              resetForm();
              setIsFormOpen(true);
            }}
            id="btn-add-inventory-stock"
            className="flex items-center justify-center gap-2 bg-white text-black hover:bg-zinc-200 px-5 py-3.5 rounded-xl transition-all duration-300 cursor-pointer text-xs font-bold font-display uppercase tracking-wider shrink-0 shadow-md"
          >
            <Plus className="w-4 h-4" /> Add Product
          </button>
        </div>
      </div>

      {/* COLLAPSIBLE SIMPLE FILTER CONTROLS */}
      {isFilterExpanded && (
        <div className="bg-[#1B1B1B] border border-[#2A2A2A] rounded-[20px] p-6 shadow-xl animate-fade-in" id="inv-filters">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-[10px] font-mono font-bold text-[#B7BCC7] uppercase tracking-wider mb-2">Category Filter</label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-3 py-2.5 bg-black border border-[#2A2A2A] rounded-xl text-xs focus:outline-none text-white focus:ring-1 focus:ring-white"
              >
                <option value="All">All Categories</option>
                {Object.values(Category).map(cat => (
                  <option key={cat} value={cat}>{getCategoryEmoji(cat)} {cat}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-mono font-bold text-[#B7BCC7] uppercase tracking-wider mb-2">Brand Filter</label>
              <select
                value={selectedBrand}
                onChange={(e) => setSelectedBrand(e.target.value)}
                className="w-full px-3 py-2.5 bg-black border border-[#2A2A2A] rounded-xl text-xs focus:outline-none text-white focus:ring-1 focus:ring-white"
              >
                <option value="All">All Brands</option>
                {Array.from(new Set(DEVICE_DATABASE.map(d => d.brand))).sort().map(brand => (
                  <option key={brand} value={brand}>{brand}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-mono font-bold text-[#B7BCC7] uppercase tracking-wider mb-2">Stock Availability</label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full px-3 py-2.5 bg-black border border-[#2A2A2A] rounded-xl text-xs focus:outline-none text-white focus:ring-1 focus:ring-white"
              >
                <option value="Available">Available Stock</option>
                <option value="Sold">Sold Products (Archived)</option>
                <option value="Sold Out">Sold Out (Unsold)</option>
                <option value="All">All Statuses</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Dynamic Status Tabs */}
      <div className="flex flex-wrap gap-2 pb-2 border-b border-zinc-900" id="inv-status-tabs">
        {[
          { key: "Available", label: "Available Stock", count: products.filter(p => p.status !== "SOLD" && p.quantity > 0).length },
          { key: "Sold", label: "Sold Products", count: products.filter(p => p.status === "SOLD").length },
          { key: "All", label: "All Items", count: products.length }
        ].map(tab => {
          const active = selectedStatus === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setSelectedStatus(tab.key)}
              className={`px-4 py-2.5 rounded-xl font-display font-bold text-xs uppercase tracking-wider border transition-all cursor-pointer flex items-center gap-2 ${
                active 
                  ? "bg-white text-black border-white shadow-lg font-black" 
                  : "bg-[#1A1D24] border-[#313640] text-zinc-400 hover:text-white hover:bg-zinc-900"
              }`}
            >
              {tab.label}
              <span className={`px-1.5 py-0.5 rounded font-mono text-[9px] ${active ? "bg-black text-white" : "bg-zinc-900 text-zinc-500 border border-zinc-800"}`}>
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* INVENTORY GRID/LIST - Generous spacing of 12 for high readability */}
      {filteredProducts.length === 0 ? (
        <div className="bg-[#1A1D24] border border-[#313640] rounded-[22px] py-24 text-center text-[#B7BCC7] shadow-xl" id="inv-empty">
          <SlidersHorizontal className="w-12 h-12 text-[#B7BCC7]/45 mx-auto mb-4" />
          <p className="font-display font-black text-lg uppercase tracking-tight text-white">No gadget listings found</p>
          <p className="text-sm text-[#B7BCC7] mt-1.5">Try adjusting your filters or add a new stock listing.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6" id="inv-grid">
          {filteredProducts.map(product => {
            if (product.status === "SOLD") {
              const matchedSale = salesList.find(s => s.productId === product.id);
              const saleDateStr = matchedSale 
                ? new Date(matchedSale.createdAt).toLocaleString("en-NG", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })
                : "Date Unknown";

              return (
                <div 
                  key={product.id} 
                  className="bg-[#1A1111] border border-rose-950/40 rounded-xl p-3 flex gap-3 hover:border-rose-900/40 transition-all duration-300 relative"
                  id={`product-card-${product.id}`}
                >
                  {/* Media Container - Left Side */}
                  <div className="w-24 h-24 sm:w-28 sm:h-28 bg-black rounded-lg overflow-hidden relative flex items-center justify-center border border-[#3A3A3A]/60 shrink-0 select-none">
                    {db.getResolvedVideoUrl(product) || product.productVideo ? (
                      <video 
                        src={db.getResolvedVideoUrl(product) || product.productVideo} 
                        muted 
                        loop 
                        playsInline 
                        autoPlay 
                        className="w-full h-full object-cover"
                      />
                    ) : product.productImages && product.productImages[0] ? (
                      <img 
                        src={product.productImages[0]} 
                        alt={product.model} 
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Package className="w-8 h-8 text-zinc-600" />
                    )}

                    {/* Stock Status Badge Overlay */}
                    <div className="absolute top-1 left-1 z-10">
                      <span className="bg-rose-950 text-rose-300 border border-rose-900/30 font-mono text-[8px] uppercase font-bold px-1.5 py-0.5 rounded shadow-sm">
                        SOLD
                      </span>
                    </div>
                  </div>

                  {/* Content Area - Right Side */}
                  <div className="flex-1 min-w-0 flex flex-col justify-between">
                    <div>
                      {/* Brand / Category Line */}
                      <div className="flex justify-between items-start gap-2">
                        <span className="text-[9px] font-mono font-bold tracking-wider text-zinc-500 uppercase">
                          {getCategoryEmoji(product.category)} {product.brand}
                        </span>
                        
                        {/* Sold Badge */}
                        <span className="text-[8px] font-mono font-bold text-rose-400 bg-rose-950/20 px-1.5 py-0.5 rounded">
                          Permanent Record
                        </span>
                      </div>

                      {/* Title and Storage */}
                      <div className="flex items-baseline gap-1.5 mt-0.5 flex-wrap">
                        <h3 className="font-sans font-extrabold text-xs sm:text-sm text-zinc-300 tracking-wide truncate max-w-[130px] sm:max-w-[180px]">
                          {product.model}
                        </h3>
                        <span className="font-mono text-[8px] sm:text-[9px] bg-black border border-[#3A3A3A] text-zinc-400 px-1 py-0.2 rounded font-semibold shrink-0">
                          {product.storage}
                        </span>
                      </div>

                      {/* Customer / Sale Details Row */}
                      <div className="mt-1 text-[10px] text-zinc-400 space-y-0.5">
                        <p className="truncate">
                          Buyer: <span className="text-white font-bold">{matchedSale?.customerName || "Walk-in"}</span>
                        </p>
                        <p className="text-[9px] text-zinc-500 truncate font-mono">
                          Receipt: {matchedSale?.id || "N/A"}
                        </p>
                        <p className="text-[9px] text-zinc-500 font-mono">
                          {saleDateStr}
                        </p>
                        {matchedSale && matchedSale.soldBy !== "Owner" && (
                          <p className="text-[9px] text-teal-400 font-semibold uppercase">
                            Staff: {matchedSale.soldBy}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Price & Action Footer */}
                    <div className="flex justify-between items-center border-t border-[#3A3A3A]/40 pt-1.5 mt-1.5">
                      <div>
                        <span className="text-[8px] font-mono text-zinc-500 uppercase tracking-tight">Sold Price</span>
                        <p className="font-mono text-xs sm:text-sm font-black text-rose-400">
                          ₦{(matchedSale?.totalAmount || product.sellingPrice).toLocaleString()}
                        </p>
                      </div>

                      <div className="flex gap-1.5">
                        <button
                          onClick={() => handleEditProduct(product)}
                          className="p-1.5 bg-black/40 border border-[#3A3A3A] text-zinc-400 hover:text-white rounded-md cursor-pointer hover:bg-zinc-800 transition-colors text-[9px] font-bold flex items-center gap-1"
                          title="View Details"
                        >
                          <Box className="w-3 h-3" /> <span className="hidden sm:inline">Details</span>
                        </button>
                        {matchedSale && (
                          <button
                            onClick={() => setActiveReceiptSale(matchedSale)}
                            className="p-1.5 bg-black/40 border border-[#3A3A3A] text-teal-400 hover:text-teal-300 rounded-md cursor-pointer hover:bg-zinc-800 transition-colors text-[9px] font-bold flex items-center gap-1"
                            title="View Receipt"
                          >
                            <FileText className="w-3 h-3" /> <span className="hidden sm:inline">Receipt</span>
                          </button>
                        )}
                        {matchedSale && (
                          <button
                            onClick={() => handleReverseSale(matchedSale.id)}
                            className="p-1.5 bg-rose-950/20 border border-rose-900/30 text-rose-400 hover:text-rose-300 rounded-md cursor-pointer hover:bg-zinc-800 transition-colors text-[9px] font-bold flex items-center gap-1"
                            title="Reverse Sale"
                          >
                            <RefreshCw className="w-3 h-3" /> <span className="hidden sm:inline">Reverse</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            }

            // Retrieve structured condition tags if present
            const structuredTags = product.condition.filter(c => 
              c.startsWith("Face ID: ") || 
              c.startsWith("Network: ")
            ).map(c => c.split(": ")[1]);

            const customConditionTags = product.condition.filter(c => 
              !c.startsWith("Face ID: ") && 
              !c.startsWith("Network: ") &&
              !c.startsWith("Notes: ")
            );

            return (
              <div 
                key={product.id} 
                className={`bg-[#171717] border ${product.quantity === 0 ? "border-[#3A3A3A]/40 opacity-70" : "border-[#3A3A3A]"} rounded-xl p-3 flex gap-3 hover:border-teal-500/50 transition-all duration-300 relative group`}
                id={`product-card-${product.id}`}
              >
                {/* Media Container - Left Side */}
                <div 
                  onClick={() => {
                    const resolvedVid = db.getResolvedVideoUrl(product) || product.productVideo || "";
                    if (resolvedVid) {
                      setSelectedVideoUrl(resolvedVid);
                      setIsVideoModalOpen(true);
                    }
                  }}
                  className={`w-24 h-24 sm:w-28 sm:h-28 bg-black rounded-lg overflow-hidden relative flex items-center justify-center border border-[#3A3A3A]/60 shrink-0 select-none ${(db.getResolvedVideoUrl(product) || product.productVideo) ? 'cursor-pointer group/vid' : ''}`}
                >
                  {(db.getResolvedVideoUrl(product) || product.productVideo) ? (
                    <>
                      <video 
                        src={db.getResolvedVideoUrl(product) || product.productVideo} 
                        muted 
                        loop 
                        playsInline 
                        autoPlay 
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/40 group-hover/vid:bg-black/20 flex items-center justify-center transition-colors">
                        <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-lg group-hover/vid:scale-110 transition-transform">
                          <Play className="w-4 h-4 fill-white ml-0.5" />
                        </div>
                      </div>
                    </>
                  ) : product.productImages && product.productImages[0] ? (
                    <img 
                      src={product.productImages[0]} 
                      alt={product.model} 
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Package className="w-8 h-8 text-zinc-600" />
                  )}

                  {/* Stock Status Badge Overlay */}
                  <div className="absolute top-1 left-1 z-10">
                    {product.quantity > 0 ? (
                      <span className="bg-black/85 text-white border border-[#3A3A3A] font-mono text-[8px] uppercase font-bold px-1.5 py-0.5 rounded shadow-sm">
                        QTY: {product.quantity}
                      </span>
                    ) : (
                      <span className="bg-rose-950/85 text-rose-300 border border-rose-900/30 font-mono text-[8px] uppercase font-bold px-1.5 py-0.5 rounded shadow-sm">
                        SOLD OUT
                      </span>
                    )}
                  </div>

                  {/* Video Indicator Overlay if video exists */}
                  {(db.getResolvedVideoUrl(product) || product.productVideo) && (
                    <span className="absolute bottom-1 right-1 px-1 py-0.5 bg-black/85 text-[8px] font-mono font-bold text-teal-400 rounded border border-[#3A3A3A] flex items-center gap-0.5">
                      <Video className="w-2 h-2 text-teal-400" /> PLAY
                    </span>
                  )}
                </div>

                {/* Content Area - Right Side */}
                <div className="flex-1 min-w-0 flex flex-col justify-between">
                  <div>
                    {/* Brand / Category Line */}
                    <div className="flex justify-between items-start gap-2">
                      <span className="text-[9px] font-mono font-bold tracking-wider text-zinc-500 uppercase">
                        {getCategoryEmoji(product.category)} {product.brand}
                      </span>
                      {/* Compact edit/delete triggers */}
                      <div className="flex gap-1">
                        <button
                          onClick={() => handleEditProduct(product)}
                          className="p-1 bg-black/40 border border-[#3A3A3A] text-zinc-400 hover:text-white rounded-md cursor-pointer hover:bg-zinc-800 transition-colors"
                          title="Edit"
                        >
                          <Edit3 className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => {
                            triggerDeleteConfirm("Product", () => {
                              onDeleteProduct(product.id);
                            }, `Are you sure you want to delete ${product.brand} ${product.model}?`);
                          }}
                          className="p-1 bg-black/40 border border-[#3A3A3A] text-rose-400 hover:text-rose-300 rounded-md cursor-pointer hover:bg-zinc-800 transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                    {/* Title and Storage */}
                    <div className="flex items-baseline gap-1.5 mt-0.5 flex-wrap">
                      <h3 className="font-sans font-extrabold text-xs sm:text-sm text-white tracking-wide truncate max-w-[130px] sm:max-w-[180px]">
                        {product.model}
                      </h3>
                      <span className="font-mono text-[8px] sm:text-[9px] bg-black border border-[#3A3A3A] text-teal-400 px-1 py-0.2 rounded font-semibold shrink-0">
                        {product.storage}
                      </span>
                    </div>

                    {/* Condition Tags row - Display all selected quick tags */}
                    <QuickTagsBadgeList 
                      tags={product.condition} 
                      batteryHealth={product.batteryHealth} 
                      variant="dark"
                    />
                  </div>

                  {/* Price & Action Footer */}
                  <div className="flex justify-between items-center border-t border-[#3A3A3A]/40 pt-1.5 mt-1.5">
                    <div>
                      <span className="text-[8px] font-mono text-zinc-500 uppercase tracking-tight">Price</span>
                      <p className="font-mono text-xs sm:text-sm font-black text-white">
                        ₦{product.sellingPrice.toLocaleString()}
                      </p>
                    </div>
                    
                    {product.quantity > 0 ? (
                      <button
                        onClick={() => handleOpenSellModal(product)}
                        className="text-[10px] font-bold font-sans uppercase text-emerald-400 hover:text-white bg-[#142d1f] hover:bg-emerald-600 border border-emerald-900/40 px-3 py-1.5 rounded-md cursor-pointer transition-all shadow-sm flex items-center gap-1 font-display animate-fade-in"
                      >
                        <CreditCard className="w-3.5 h-3.5" /> Sell
                      </button>
                    ) : (
                      <span className="text-[9px] font-bold font-sans uppercase text-rose-400 bg-rose-950/15 border border-rose-900/25 px-2.5 py-1 rounded-md tracking-wider">
                        Sold Out
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* REDESIGNED PREMIUM ADD/EDIT PRODUCT MODAL */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center z-50 p-4 overflow-y-auto animate-fade-in" id="inventory-form-modal">
          <div className="bg-[#0D0D0D] border border-[#1A1A1A] rounded-[24px] w-full max-w-2xl max-h-[92vh] overflow-y-auto shadow-2xl animate-scale-up" id="form-container">
            
            {/* Form Header - Dark Cosmic Aesthetic */}
            <div className="p-6 border-b border-[#1A1A1A] flex justify-between items-center bg-[#050505] text-white rounded-t-[24px]">
              <div>
                <span className="text-[10px] font-mono font-bold text-teal-400 uppercase tracking-widest bg-teal-500/10 px-2 py-0.5 rounded-md">
                  {editingProduct ? "Edit Mode" : "New Intake"}
                </span>
                <h2 className="font-display font-black text-xl uppercase tracking-wider flex items-center gap-2 mt-2 text-white">
                  {editingProduct ? "Modify Product" : "Add Product"}
                </h2>
                <p className="text-xs text-[#B7BCC7] mt-1">Fill in the details below to save or update your stock line immediately.</p>
              </div>
              <button
                onClick={() => {
                  setIsFormOpen(false);
                  if (onCloseQuickForm) onCloseQuickForm();
                }}
                className="p-2.5 hover:bg-zinc-900 rounded-full transition-colors cursor-pointer text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Main Form container */}
            <form onSubmit={handleFormSubmit} className="p-6 space-y-8 text-white" id="stock-upload-form">
              {isProductSold && (
                <div className="p-4 bg-rose-950/20 border border-rose-900/30 rounded-xl text-rose-300 text-xs font-semibold flex items-start gap-3 animate-fade-in">
                  <AlertCircle className="w-5 h-5 shrink-0 text-rose-400" />
                  <div>
                    <p className="font-bold uppercase tracking-wider text-[10px] text-rose-400">🔒 Locked Sales Record</p>
                    <p className="mt-0.5 text-zinc-400">This device has been sold. Editing is locked to preserve transaction records and accounting integrity.</p>
                  </div>
                </div>
              )}
              
              <fieldset disabled={isProductSold} className="space-y-8">
              
              <div className="space-y-1">
                <span className="text-[10px] font-mono font-bold text-zinc-500 uppercase tracking-widest">PRODUCT INFORMATION</span>
                <div className="h-px bg-gradient-to-r from-zinc-800 to-transparent w-full mt-2" />
              </div>

              {/* 1. Category Card Select - Premium Overlays */}
              <div className="space-y-2 relative">
                <label className="block text-[10px] font-mono font-bold text-[#B7BCC7] uppercase tracking-wider">
                  Category
                </label>
                <div 
                  onClick={() => setActiveDropdown(activeDropdown === "category" ? null : "category")}
                  className="w-full flex items-center justify-between p-4 bg-[#141414] hover:bg-[#1A1A1A] border border-[#222222] hover:border-zinc-700 rounded-xl cursor-pointer transition-all duration-300"
                >
                  <div className="flex items-center gap-3">
                    <span className="p-2.5 bg-[#1B1B1B] text-teal-400 rounded-lg border border-[#2A2A2A]">
                      <Layers className="w-5 h-5" />
                    </span>
                    <div>
                      <p className="text-[10px] font-mono font-bold text-zinc-500 uppercase">Selected Category</p>
                      <p className="text-sm font-bold text-white mt-0.5">
                        {getCategoryEmoji(formCategory)} {formCategory}
                      </p>
                    </div>
                  </div>
                  <ChevronDown className={`w-5 h-5 text-zinc-500 transition-transform duration-300 ${activeDropdown === "category" ? "rotate-180" : ""}`} />
                </div>

                {activeDropdown === "category" && (
                  <div className="absolute left-0 right-0 mt-2 bg-black border border-[#222222] rounded-xl shadow-2xl z-40 p-2 grid grid-cols-2 gap-2 animate-scale-up">
                    {Object.values(Category).map(cat => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => handleCategoryChange(cat)}
                        className={`p-3 text-left rounded-lg text-xs font-bold transition-all flex items-center gap-2.5 cursor-pointer ${
                          formCategory === cat 
                            ? "bg-white text-black" 
                            : "bg-[#141414] text-zinc-400 hover:text-white hover:bg-zinc-800"
                        }`}
                      >
                        <span className="text-base">{getCategoryEmoji(cat)}</span>
                        <span>{cat}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* 2. Brand Card Select */}
              <div className="space-y-2 relative">
                <label className="block text-[10px] font-mono font-bold text-[#B7BCC7] uppercase tracking-wider">
                  Brand
                </label>
                <div 
                  onClick={() => setActiveDropdown(activeDropdown === "brand" ? null : "brand")}
                  className="w-full flex items-center justify-between p-4 bg-[#141414] hover:bg-[#1A1A1A] border border-[#222222] hover:border-zinc-700 rounded-xl cursor-pointer transition-all duration-300"
                >
                  <div className="flex items-center gap-3">
                    <span className="p-2.5 bg-[#1B1B1B] text-teal-400 rounded-lg border border-[#2A2A2A]">
                      <Smartphone className="w-5 h-5" />
                    </span>
                    <div>
                      <p className="text-[10px] font-mono font-bold text-zinc-500 uppercase">Selected Brand</p>
                      <p className="text-sm font-bold text-white mt-0.5">
                        {BRAND_DISPLAY_NAMES[formBrand] || formBrand}
                      </p>
                    </div>
                  </div>
                  <ChevronDown className={`w-5 h-5 text-zinc-500 transition-transform duration-300 ${activeDropdown === "brand" ? "rotate-180" : ""}`} />
                </div>

                {activeDropdown === "brand" && (
                  <div className="absolute left-0 right-0 mt-2 bg-black border border-[#222222] rounded-xl shadow-2xl z-40 p-2 max-h-56 overflow-y-auto grid grid-cols-2 md:grid-cols-3 gap-2 animate-scale-up">
                    {(CATEGORY_BRANDS[formCategory] || []).map(brand => (
                      <button
                        key={brand}
                        type="button"
                        onClick={() => handleBrandChange(brand)}
                        className={`p-2.5 text-left rounded-lg text-xs font-bold transition-all truncate cursor-pointer ${
                          formBrand === brand 
                            ? "bg-white text-black" 
                            : "bg-[#141414] text-zinc-400 hover:text-white hover:bg-zinc-800"
                        }`}
                      >
                        {BRAND_DISPLAY_NAMES[brand] || brand}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => handleBrandChange("Other")}
                      className={`p-2.5 text-left rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        formBrand === "Other" 
                          ? "bg-white text-black" 
                          : "bg-[#141414] text-teal-400 hover:bg-zinc-800"
                      }`}
                    >
                      ➕ Other Brand
                    </button>
                  </div>
                )}
              </div>

              {/* Brand Custom Text Entry if Other chosen */}
              {formBrand === "Other" && (
                <div className="space-y-2 p-4 bg-zinc-900/40 border border-zinc-800 rounded-xl animate-fade-in">
                  <label className="block text-[10px] font-mono font-bold text-teal-400 uppercase tracking-wider">
                    Specify Custom Brand Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Enter brand (e.g. Nothing, Infinix, itel)..."
                    value={customBrand}
                    onChange={(e) => setCustomBrand(e.target.value)}
                    className="w-full px-4 py-3 bg-black border border-[#222222] rounded-xl text-xs text-white focus:outline-none focus:ring-1 focus:ring-white"
                  />
                </div>
              )}

              <div className="space-y-1 pt-4 border-t border-[#1A1A1A]/80">
                <span className="text-[10px] font-mono font-bold text-zinc-500 uppercase tracking-widest">DEVICE INFORMATION</span>
                <div className="h-px bg-gradient-to-r from-zinc-800 to-transparent w-full mt-2" />
              </div>

              {/* 3. Search & Select Device Model Card (Category -> Brand path) */}
              <div className="space-y-2 relative">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-mono font-bold text-[#B7BCC7] uppercase tracking-wider">
                    Device Model
                  </label>
                  <span className="text-[9px] font-mono text-zinc-500">Suggested by database</span>
                </div>
                
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-zinc-500" />
                  <input
                    type="text"
                    placeholder="Search suggested models or type custom name..."
                    value={modelSearch}
                    onChange={(e) => {
                      setModelSearch(e.target.value);
                      setFormModel(e.target.value);
                      setActiveDropdown("model");
                    }}
                    onFocus={() => setActiveDropdown("model")}
                    className="w-full pl-11 pr-10 py-4 bg-[#141414] hover:bg-[#1A1A1A] focus:bg-[#1A1A1A] border border-[#222222] focus:border-zinc-600 rounded-xl text-sm font-bold text-white focus:outline-none placeholder-zinc-600 transition-all"
                  />
                  {modelSearch && (
                    <button
                      type="button"
                      onClick={() => {
                        setModelSearch("");
                        setFormModel("");
                      }}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {activeDropdown === "model" && (
                  <div className="absolute left-0 right-0 mt-2 bg-black border border-[#222222] rounded-xl shadow-2xl z-40 max-h-56 overflow-y-auto divide-y divide-[#1A1A1A] animate-scale-up">
                    {filteredSuggestions.length === 0 ? (
                      <div className="px-4 py-3 text-xs text-zinc-500 font-mono">
                        No matches found. Simply type above to save custom model: "{formModel}"
                      </div>
                    ) : (
                      filteredSuggestions.map((device, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handleSelectDevice(device)}
                          className="w-full text-left px-4 py-3.5 text-xs hover:bg-[#141414] flex justify-between items-center cursor-pointer text-zinc-300 hover:text-white font-sans"
                        >
                          <span className="font-bold">{device.name}</span>
                          <span className="text-[9px] font-mono text-zinc-500 uppercase bg-[#141414] px-2 py-0.5 rounded border border-[#222222]">
                            {device.category}
                          </span>
                        </button>
                      ))
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        setFormModel("Other");
                        setCustomModel("");
                        setActiveDropdown(null);
                      }}
                      className="w-full text-left px-4 py-3 text-xs font-bold text-teal-400 hover:bg-[#141414] cursor-pointer"
                    >
                      ➕ Custom Entry (Type manually)
                    </button>
                  </div>
                )}
              </div>

              {/* Model Custom Text Input if Other chosen */}
              {formModel === "Other" && (
                <div className="space-y-2 p-4 bg-zinc-900/40 border border-zinc-800 rounded-xl animate-fade-in">
                  <label className="block text-[10px] font-mono font-bold text-teal-400 uppercase tracking-wider">
                    Specify Custom Device Model
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Enter model name (e.g. Pixel 9 Pro XL, Redmi A3)..."
                    value={customModel}
                    onChange={(e) => setCustomModel(e.target.value)}
                    className="w-full px-4 py-3 bg-black border border-[#222222] rounded-xl text-xs text-white focus:outline-none focus:ring-1 focus:ring-white"
                  />
                </div>
              )}

              {/* 4. Storage Sizes Suggestions */}
              <div className="space-y-2 relative">
                <label className="block text-[10px] font-mono font-bold text-[#B7BCC7] uppercase tracking-wider">
                  Storage Size / Specs
                </label>
                <div 
                  onClick={() => setActiveDropdown(activeDropdown === "storage" ? null : "storage")}
                  className="w-full flex items-center justify-between p-4 bg-[#141414] hover:bg-[#1A1A1A] border border-[#222222] hover:border-zinc-700 rounded-xl cursor-pointer transition-all duration-300"
                >
                  <div className="flex items-center gap-3">
                    <span className="p-2.5 bg-[#1B1B1B] text-teal-400 rounded-lg border border-[#2A2A2A]">
                      <HardDrive className="w-5 h-5" />
                    </span>
                    <div>
                      <p className="text-[10px] font-mono font-bold text-zinc-500 uppercase">Active Storage Size</p>
                      <p className="text-sm font-bold font-mono text-white mt-0.5">
                        {formStorage === "Other" ? `Custom: ${customStorage || "(empty)"}` : (formStorage || "Select Storage Specs")}
                      </p>
                    </div>
                  </div>
                  <ChevronDown className={`w-5 h-5 text-zinc-500 transition-transform duration-300 ${activeDropdown === "storage" ? "rotate-180" : ""}`} />
                </div>

                {activeDropdown === "storage" && (
                  <div className="absolute left-0 right-0 mt-2 bg-black border border-[#222222] rounded-xl shadow-2xl z-40 p-2 max-h-56 overflow-y-auto grid grid-cols-2 md:grid-cols-3 gap-2 animate-scale-up">
                    {/* If model has database specs, map them. Else show standard list. */}
                    {(activeModelDetails?.storages || getStorageFallbacks(formCategory)).map(st => (
                      <button
                        key={st}
                        type="button"
                        onClick={() => {
                          setFormStorage(st);
                          setCustomStorage("");
                          setActiveDropdown(null);
                        }}
                        className={`p-2.5 text-center font-mono rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          formStorage === st 
                            ? "bg-white text-black" 
                            : "bg-[#141414] text-zinc-400 hover:text-white hover:bg-zinc-800"
                        }`}
                      >
                        {st}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => {
                        setFormStorage("Other");
                        setCustomStorage("");
                        setActiveDropdown(null);
                      }}
                      className={`p-2.5 text-center font-mono rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        formStorage === "Other" 
                          ? "bg-white text-black" 
                          : "bg-[#141414] text-teal-400 hover:bg-zinc-800"
                      }`}
                    >
                      ➕ Custom Size
                    </button>
                  </div>
                )}
              </div>

              {/* Custom Storage size text entry if Other selected */}
              {formStorage === "Other" && (
                <div className="space-y-2 p-4 bg-zinc-900/40 border border-zinc-800 rounded-xl animate-fade-in">
                  <label className="block text-[10px] font-mono font-bold text-teal-400 uppercase tracking-wider">
                    Specify Custom Storage / specs
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Enter storage capacity (e.g. 16GB, 12GB RAM, 512GB SSD)..."
                    value={customStorage}
                    onChange={(e) => setCustomStorage(e.target.value)}
                    className="w-full px-4 py-3 bg-black border border-[#222222] rounded-xl text-xs text-white focus:outline-none focus:ring-1 focus:ring-white font-mono"
                  />
                </div>
              )}

              {/* 5. Color / Variant */}
              <div className="space-y-2">
                <label className="block text-[10px] font-mono font-bold text-[#B7BCC7] uppercase tracking-wider">
                  Colour / Variant (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Space Grey, Midnight Green, Titanium Silver..."
                  value={formVariant}
                  onChange={(e) => setFormVariant(e.target.value)}
                  className="w-full px-4 py-3.5 bg-[#141414] border border-[#222222] focus:border-zinc-600 rounded-xl text-sm font-semibold text-white focus:outline-none placeholder-zinc-700 transition-all"
                />
              </div>

              {/* 6. Pricing & Quantity - Side by Side layout */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2 border-t border-[#1A1A1A]/80">
                
                {/* Price (₦) */}
                <div className="space-y-2">
                  <label className="block text-[10px] font-mono font-bold text-[#B7BCC7] uppercase tracking-wider">
                    Selling Price (₦)
                  </label>
                  <div className="relative flex items-center bg-[#141414] border border-[#222222] focus-within:border-zinc-600 rounded-xl px-4 py-3 transition-all">
                    <span className="text-zinc-500 mr-2 shrink-0">
                      <CreditCard className="w-5 h-5" />
                    </span>
                    <input
                      type="text"
                      required
                      placeholder="Enter price (e.g. 750K, 1.2M, 85,000)"
                      value={formSellingPrice}
                      onChange={(e) => {
                        const raw = e.target.value;
                        // Allow numbers, commas, dots, and suffix letters (K, M)
                        const filtered = raw.replace(/[^0-9.kKmM,]/g, "");
                        setFormSellingPrice(filtered);
                      }}
                      onBlur={(e) => {
                        const parsed = formatShortenedPriceInput(e.target.value);
                        if (parsed) {
                          setFormSellingPrice(parsed);
                        }
                      }}
                      className="w-full bg-transparent font-mono text-base font-bold text-white focus:outline-none placeholder-zinc-700"
                    />
                  </div>
                  
                  {/* Quick suffix buttons K and M */}
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        const clean = formSellingPrice.replace(/,/g, "");
                        const num = parseFloat(clean);
                        if (!isNaN(num)) {
                          setFormSellingPrice((num * 1000).toString());
                        }
                      }}
                      className="flex-1 py-1.5 bg-[#1C1D22] hover:bg-[#2B2E36] active:bg-[#18191E] border border-zinc-800 text-zinc-400 hover:text-emerald-400 text-xs font-mono font-bold rounded-lg transition-all cursor-pointer flex justify-center items-center gap-1 shadow-sm"
                    >
                      <span>× Thousand</span> <span className="text-[9px] bg-emerald-500/10 text-emerald-400 px-1.5 py-0.25 rounded font-black">K</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const clean = formSellingPrice.replace(/,/g, "");
                        const num = parseFloat(clean);
                        if (!isNaN(num)) {
                          setFormSellingPrice((num * 1000000).toString());
                        }
                      }}
                      className="flex-1 py-1.5 bg-[#1C1D22] hover:bg-[#2B2E36] active:bg-[#18191E] border border-zinc-800 text-zinc-400 hover:text-teal-400 text-xs font-mono font-bold rounded-lg transition-all cursor-pointer flex justify-center items-center gap-1 shadow-sm"
                    >
                      <span>× Million</span> <span className="text-[9px] bg-teal-500/10 text-teal-400 px-1.5 py-0.25 rounded font-black">M</span>
                    </button>
                  </div>

                  {formSellingPrice && (
                    <p className="text-[10px] text-teal-400 font-mono mt-1 animate-fade-in">
                      Equivalent Amount: ₦{parseShortenedPriceToNumber(formSellingPrice).toLocaleString()}
                    </p>
                  )}
                </div>

                {/* Quantity */}
                <div className="space-y-2">
                  <label className="block text-[10px] font-mono font-bold text-[#B7BCC7] uppercase tracking-wider">
                    Available Quantity
                  </label>
                  <div className="relative flex items-center bg-[#141414] border border-[#222222] focus-within:border-zinc-600 rounded-xl px-4 py-3 transition-all">
                    <span className="text-zinc-500 mr-2 shrink-0">
                      <Box className="w-5 h-5" />
                    </span>
                    <input
                      type="number"
                      min="0"
                      required
                      value={formQuantity}
                      onChange={(e) => setFormQuantity(parseInt(e.target.value) || 0)}
                      className="w-full bg-transparent font-mono text-base font-bold text-white focus:outline-none"
                    />
                  </div>
                </div>

              </div>

                           {/* ================= 8. DETAILED DEVICE CONDITION & WARRANTY (COLLAPSIBLE / DURABLE) ================= */}
              <div className="space-y-1 pt-4 border-t border-[#1A1A1A]/80">
                <span className="text-[10px] font-mono font-bold text-zinc-500 uppercase tracking-widest">CONDITION INFORMATION</span>
                <div className="h-px bg-gradient-to-r from-zinc-800 to-transparent w-full mt-2" />
              </div>

              <div className="border border-[#1A1A1A] bg-[#0A0A0A] rounded-2xl overflow-hidden shadow-md">
                
                {/* Collapsible toggle header */}
                <div 
                  type="button"
                  onClick={() => setIsConditionExpanded(!isConditionExpanded)}
                  className="w-full flex items-center justify-between p-5 bg-[#0F0F0F] border-b border-[#1A1A1A] cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="p-1.5 bg-teal-500/10 text-teal-400 rounded-md border border-teal-500/10">
                      <ShieldCheck className="w-4 h-4" />
                    </span>
                    <div className="text-left">
                      <h3 className="text-xs font-black uppercase tracking-wider text-white font-display">Configure Condition & Notes</h3>
                      <p className="text-[10px] text-zinc-500 font-mono mt-0.5">Manage condition checklist, warranties and custom notes</p>
                    </div>
                  </div>
                  <ChevronDown className={`w-4 h-4 text-zinc-400 transition-transform duration-300 ${isConditionExpanded ? "rotate-180" : ""}`} />
                </div>

                {isConditionExpanded && (
                  <div className="p-5 space-y-6 animate-fade-in divide-y divide-[#1A1A1A]/50">
                    
                    {/* Define helper variables inside render for dynamic sections */}
                    {(() => {
                      const isIPhone = formCategory === Category.Phones && formBrand.toLowerCase() === "apple";
                      const isAndroid = (formCategory === Category.Phones || formCategory === Category.Tablets || formCategory === Category.SmartWatches) && formBrand.toLowerCase() !== "apple";
                      const isLaptop = formCategory === Category.Laptops;
                      const isConsole = formCategory === Category.GameConsoles;
                      const isAccessory = formCategory === Category.Accessories;

                      const showFaceId = false;
                      const showNetwork = false;
                      const showBatteryHealth = isIPhone;
                      const showWarranty = isIPhone || isAndroid || isLaptop || isConsole;
                      const showConditionTags = !isAccessory;

                      return (
                        <>
                          {/* Quick Condition Emojis / Tags */}
                          {showConditionTags && (
                            <div className="space-y-3 pb-4">
                              <label className="block text-[10px] font-mono font-bold text-teal-400 uppercase tracking-wider">
                                Condition Quick Tags (Select Multiple)
                              </label>
                              <div className="flex flex-wrap gap-2">
                                {(getCategoryQuickTags(formCategory, formBrand) || []).map(tag => {
                                  const active = formConditionTags.includes(tag);
                                  return (
                                    <button
                                      key={tag}
                                      type="button"
                                      onClick={() => toggleConditionTag(tag)}
                                      className={`px-3 py-2 rounded-lg text-[10px] font-bold uppercase transition-all cursor-pointer ${
                                        active 
                                          ? "bg-teal-500 text-black border border-teal-400" 
                                          : "bg-[#141414] text-zinc-400 hover:text-white border border-[#222]"
                                      }`}
                                    >
                                      {tag}
                                    </button>
                                  );
                                })}

                                {/* Render custom active condition tags */}
                                {formConditionTags.filter(t => !(getCategoryQuickTags(formCategory, formBrand) || []).includes(t)).map(tag => (
                                  <button
                                    key={tag}
                                    type="button"
                                    onClick={() => toggleConditionTag(tag)}
                                    className="px-3 py-2 rounded-lg text-[10px] font-bold uppercase bg-teal-500 text-black border border-teal-400 cursor-pointer"
                                  >
                                    {tag} (Custom)
                                  </button>
                                ))}
                              </div>

                              {/* Custom Quick Tag Input box */}
                              <div className="pt-2 flex items-center gap-2">
                                {showCustomTagForm ? (
                                  <div className="flex items-center gap-2 w-full animate-scale-up">
                                    <input
                                      type="text"
                                      placeholder="Type custom condition tag..."
                                      value={customTagInput}
                                      onChange={(e) => setCustomTagInput(e.target.value)}
                                      onKeyDown={(e) => {
                                        if (e.key === "Enter") {
                                          e.preventDefault();
                                          if (customTagInput.trim()) {
                                            toggleConditionTag(customTagInput.trim());
                                            setCustomTagInput("");
                                            setShowCustomTagForm(false);
                                          }
                                        }
                                      }}
                                      className="flex-1 px-3 py-2 bg-black border border-[#222222] rounded-lg text-xs text-white focus:outline-none"
                                    />
                                    <button
                                      type="button"
                                      onClick={() => {
                                        if (customTagInput.trim()) {
                                          toggleConditionTag(customTagInput.trim());
                                          setCustomTagInput("");
                                        }
                                        setShowCustomTagForm(false);
                                      }}
                                      className="px-3 py-2 bg-white text-black font-bold text-xs rounded-lg hover:bg-zinc-200 cursor-pointer"
                                    >
                                      Add
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setCustomTagInput("");
                                        setShowCustomTagForm(false);
                                      }}
                                      className="p-2 text-zinc-500 hover:text-white"
                                    >
                                      <X className="w-4 h-4" />
                                    </button>
                                  </div>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => setShowCustomTagForm(true)}
                                    className="text-[10px] font-bold text-teal-400 hover:text-teal-300 font-mono flex items-center gap-1 cursor-pointer"
                                  >
                                    ➕ Add Custom Tag / Condition
                                  </button>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Face ID / Passcode Status */}
                          {showFaceId && (
                            <div className="space-y-3 pt-4 pb-4">
                              <label className="block text-[10px] font-mono font-bold text-[#B7BCC7] uppercase tracking-wider">
                                Face ID Status
                              </label>
                              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                {["Working", "Not Working", "Disabled", "Replaced", "Other"].map(state => {
                                  const active = formFaceId === state;
                                  return (
                                    <button
                                      key={state}
                                      type="button"
                                      onClick={() => setFormFaceId(state)}
                                      className={`p-2.5 rounded-lg text-center text-[10px] font-bold uppercase transition-all cursor-pointer ${
                                        active 
                                          ? "bg-white text-black" 
                                          : "bg-[#141414] text-zinc-500 hover:text-white"
                                      }`}
                                    >
                                      {state}
                                    </button>
                                  );
                                })}
                              </div>
                              {formFaceId === "Other" && (
                                <input
                                  type="text"
                                  required
                                  placeholder="Type custom Face ID notes..."
                                  value={customFaceId}
                                  onChange={(e) => setCustomFaceId(e.target.value)}
                                  className="w-full px-4 py-3 bg-black border border-[#222222] rounded-xl text-xs text-white focus:outline-none focus:ring-1 focus:ring-white mt-2 font-mono"
                                />
                              )}
                            </div>
                          )}

                          {/* Network Status */}
                          {showNetwork && (
                            <div className="space-y-3 pt-4 pb-4">
                              <label className="block text-[10px] font-mono font-bold text-[#B7BCC7] uppercase tracking-wider">
                                Network Status
                              </label>
                              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                {["Factory Unlocked", "Carrier Locked", "No Service", "Weak Signal", "Other"].map(state => {
                                  const active = formNetwork === state;
                                  return (
                                    <button
                                      key={state}
                                      type="button"
                                      onClick={() => setFormNetwork(state)}
                                      className={`p-2.5 rounded-lg text-center text-[10px] font-bold uppercase transition-all cursor-pointer ${
                                        active 
                                          ? "bg-white text-black" 
                                          : "bg-[#141414] text-zinc-500 hover:text-white"
                                      }`}
                                    >
                                      {state}
                                    </button>
                                  );
                                })}
                              </div>
                              {formNetwork === "Other" && (
                                <input
                                  type="text"
                                  required
                                  placeholder="Type custom network notes..."
                                  value={customNetwork}
                                  onChange={(e) => setCustomNetwork(e.target.value)}
                                  className="w-full px-4 py-3 bg-black border border-[#222222] rounded-xl text-xs text-white focus:outline-none focus:ring-1 focus:ring-white mt-2 font-mono"
                                />
                              )}
                            </div>
                          )}

                          {/* Battery Health Slider or Quick Selection */}
                          {showBatteryHealth && (
                            <div className="space-y-3 pt-4 pb-4">
                              <div className="flex justify-between items-center">
                                <label className="text-[10px] font-mono font-bold text-[#B7BCC7] uppercase tracking-wider">
                                  Battery Health (%)
                                </label>
                                <span className="font-mono text-xs font-bold text-teal-400">{formBatteryHealthVal}</span>
                              </div>
                              <div className="flex gap-2">
                                <input
                                  type="text"
                                  placeholder="e.g. 88% or Service"
                                  value={formBatteryHealthVal}
                                  onChange={(e) => setFormBatteryHealthVal(e.target.value)}
                                  className="w-1/3 px-3 py-2 bg-black border border-[#222222] rounded-lg text-xs font-mono text-white focus:outline-none"
                                />
                                <div className="flex-1 flex gap-1.5 flex-wrap">
                                  {["IBM", "85%", "88%", "90%", "95%", "100%", "Service"].map(val => (
                                    <button
                                      key={val}
                                      type="button"
                                      onClick={() => setFormBatteryHealthVal(val)}
                                      className="px-2.5 py-1.5 bg-[#141414] text-[10px] font-mono text-zinc-400 hover:text-white rounded border border-[#222] cursor-pointer"
                                    >
                                      {val}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Dealer Warranty option selection */}
                          {showWarranty && (
                            <div className="space-y-3 pt-4 pb-4">
                              <label className="block text-[10px] font-mono font-bold text-[#B7BCC7] uppercase tracking-wider">
                                Dealer Warranty Period
                              </label>
                              <div className="flex flex-wrap gap-2">
                                {WARRANTY_OPTIONS.map(opt => {
                                  const active = formWarranty === opt;
                                  return (
                                    <button
                                      key={opt}
                                      type="button"
                                      onClick={() => setFormWarranty(opt)}
                                      className={`px-3.5 py-2 rounded-lg text-[10px] font-bold uppercase transition-all cursor-pointer ${
                                        active 
                                          ? "bg-teal-500 text-black border border-teal-400" 
                                          : "bg-[#141414] text-zinc-400 hover:text-white border border-[#222]"
                                      }`}
                                    >
                                      {opt}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          )}

                          {/* General Additional Notes */}
                          <div className="space-y-3 pt-4">
                            <label className="block text-[10px] font-mono font-bold text-teal-400 uppercase tracking-wider">
                              Other / Additional Notes
                            </label>
                            <textarea
                              rows={3}
                              placeholder="Describe anything unique about the product (e.g. Tiny scratch, Box available, Charger included, Replaced speaker)..."
                              value={formAdditionalNotes}
                              onChange={(e) => setFormAdditionalNotes(e.target.value)}
                              className="w-full px-4 py-3 bg-black border border-[#222222] rounded-xl text-xs text-white focus:outline-none focus:ring-1 focus:ring-white font-mono"
                            />
                            <div className="flex flex-wrap gap-1.5 mt-2">
                              {["Tiny scratch", "Box available", "Charger included", "Replaced speaker", "Original receipt available"].map(note => (
                                <button
                                  key={note}
                                  type="button"
                                  onClick={() => {
                                    if (!formAdditionalNotes.includes(note)) {
                                      setFormAdditionalNotes(prev => prev ? `${prev}, ${note}` : note);
                                    }
                                  }}
                                  className="px-2.5 py-1 bg-[#141414] hover:bg-zinc-800 text-[10px] font-sans text-zinc-400 hover:text-white rounded border border-[#222] cursor-pointer transition-colors"
                                >
                                  ➕ {note}
                                </button>
                              ))}
                            </div>
                          </div>
                        </>
                      );
                    })()}

                  </div>
                )}
              </div>

              {/* 9. Media Upload Section */}
              <div className="space-y-4 pt-4 border-t border-[#1A1A1A]/80">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-zinc-950 p-3.5 rounded-xl border border-[#222]">
                  <div>
                    <span className="text-[10px] font-mono font-bold text-teal-400 uppercase tracking-widest block">MEDIA UPLOADS</span>
                    <p className="text-[11px] text-zinc-400 font-sans">Choose to upload product photos or video</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => changeMediaTab("photos")}
                      className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                        formMediaTab === "photos"
                          ? "bg-teal-500 text-black shadow-sm font-extrabold"
                          : "bg-black text-zinc-400 hover:text-white border border-[#222]"
                      }`}
                    >
                      📷 Product Photos {formImages.length > 0 && `(${formImages.length})`}
                    </button>
                    <button
                      type="button"
                      onClick={() => changeMediaTab("video")}
                      className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                        formMediaTab === "video"
                          ? "bg-teal-500 text-black shadow-sm font-extrabold"
                          : "bg-black text-zinc-400 hover:text-white border border-[#222]"
                      }`}
                    >
                      🎥 Product Video {formVideo && "✓"}
                    </button>
                  </div>
                </div>

                {formMediaTab === "photos" && (
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <label className="text-[10px] font-mono font-bold text-[#B7BCC7] uppercase tracking-wider">
                        Product Photos
                      </label>
                      <span className="text-[9px] font-mono text-zinc-500">Max 5MB • Multiple</span>
                    </div>

                    {formImages.length === 0 ? (
                      <div className="border border-dashed border-[#222] bg-black hover:bg-zinc-950 rounded-xl p-5 text-center relative transition-colors">
                        <input
                          type="file"
                          multiple
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer text-xs"
                        />
                        <ImageIcon className="w-8 h-8 text-zinc-500 mx-auto mb-2" />
                        <p className="text-xs font-semibold text-white">Choose photos</p>
                        <p className="text-[9px] text-zinc-500 mt-0.5">Drag & drop or browse</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 pt-2">
                        {formImages.map((img, index) => (
                          <div key={index} className="aspect-square rounded-xl border border-[#222] relative group overflow-hidden bg-black shadow-lg">
                            <img src={img} alt="Preview" referrerPolicy="no-referrer" className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110" />
                            {index === 0 && (
                              <span className="absolute top-1.5 left-1.5 bg-teal-500/90 text-black text-[7px] font-extrabold uppercase px-1.5 py-0.5 rounded tracking-wider shadow">
                                Cover
                              </span>
                            )}
                            {/* Hover overlay for Replace or Delete */}
                            <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity gap-1.5 p-1 cursor-pointer">
                              <button
                                type="button"
                                onClick={() => {
                                  const fileInput = document.getElementById(`replace-photo-${index}`);
                                  if (fileInput) fileInput.click();
                                }}
                                className="w-[85%] py-1 text-[8px] font-bold uppercase tracking-wider text-teal-400 bg-zinc-900 hover:bg-zinc-800 rounded border border-zinc-800 text-center"
                              >
                                Replace
                              </button>
                              <input
                                type="file"
                                id={`replace-photo-${index}`}
                                accept="image/*"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    const reader = new FileReader();
                                    reader.onloadend = () => {
                                      if (typeof reader.result === "string") {
                                        const res = reader.result;
                                        setFormImages(prev => {
                                          const copy = [...prev];
                                          copy[index] = res;
                                          return copy;
                                        });
                                      }
                                    };
                                    reader.readAsDataURL(file);
                                  }
                                }}
                                className="hidden"
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  triggerDeleteConfirm("Image", () => {
                                    setFormImages(prev => prev.filter((_, i) => i !== index));
                                  }, "Are you sure you want to delete this product photo?");
                                }}
                                className="w-[85%] py-1 text-[8px] font-bold uppercase tracking-wider text-rose-400 bg-zinc-900 hover:bg-zinc-800 rounded border border-zinc-800 text-center"
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        ))}
                        {/* Compact add more trigger */}
                        <div className="aspect-square rounded-xl border border-dashed border-[#222] bg-zinc-950 flex flex-col items-center justify-center cursor-pointer hover:bg-zinc-900 relative">
                          <input
                            type="file"
                            multiple
                            accept="image/*"
                            onChange={handleImageUpload}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer text-xs"
                          />
                          <Plus className="w-5 h-5 text-zinc-500" />
                          <span className="text-[7px] font-bold uppercase tracking-wider text-zinc-500 mt-1">Add More</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {formMediaTab === "video" && (
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <label className="text-[10px] font-mono font-bold text-[#B7BCC7] uppercase tracking-wider">
                        Product Video
                      </label>
                      <span className="text-[9px] font-mono text-zinc-500">Max 20MB • Optional</span>
                    </div>

                    {!formVideo ? (
                      <div className="border border-dashed border-[#222] bg-black hover:bg-zinc-950 rounded-xl p-5 text-center relative transition-colors">
                        <input
                          type="file"
                          accept="video/*"
                          onChange={handleVideoUpload}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer text-xs"
                        />
                        <Video className="w-8 h-8 text-zinc-500 mx-auto mb-2" />
                        <p className="text-xs font-semibold text-white">Choose video clip</p>
                        <p className="text-[9px] text-zinc-500 mt-0.5">MP4 or MOV recommended</p>
                      </div>
                    ) : (
                      <div className="space-y-2 pt-1">
                        <div className="aspect-video w-full rounded-xl border border-[#222] overflow-hidden bg-black shadow-lg relative group">
                          <video 
                            src={formVideo} 
                            controls 
                            className="w-full h-full object-cover" 
                            preload="metadata"
                          />
                          {/* Hover action overlay for Replace & Delete */}
                          <div className="absolute inset-0 bg-black/80 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity gap-4">
                            <button
                              type="button"
                              onClick={() => {
                                const fileInput = document.getElementById("replace-video-input");
                                if (fileInput) fileInput.click();
                              }}
                              className="px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-teal-400 bg-zinc-900 hover:bg-zinc-800 rounded border border-zinc-800 cursor-pointer transition-all"
                            >
                              Replace
                            </button>
                            <input
                              type="file"
                              id="replace-video-input"
                              accept="video/*"
                              onChange={handleVideoUpload}
                              className="hidden"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                triggerDeleteConfirm("Video", () => {
                                  setFormVideo("");
                                }, "Are you sure you want to delete this product video?");
                              }}
                              className="px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-rose-400 bg-zinc-900 hover:bg-zinc-800 rounded border border-zinc-800 cursor-pointer transition-all"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 p-2 bg-[#0C0C0C] border border-[#111] rounded-lg text-xs text-zinc-400">
                          <Video className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                          <span className="truncate flex-1 font-mono text-[9px] text-zinc-400">product_video.mp4</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              </fieldset>

              {/* Actions Footer */}
              <div className="border-t border-[#1A1A1A] pt-6 flex justify-end gap-3 bg-[#050505] -mx-6 -mb-6 p-6 rounded-b-[24px]">
                <button
                  type="button"
                  onClick={() => {
                    setIsFormOpen(false);
                    if (onCloseQuickForm) onCloseQuickForm();
                  }}
                  className="px-5 py-3 border border-[#222] bg-black text-[#B7BCC7] hover:bg-zinc-900 rounded-xl text-xs font-bold font-display uppercase tracking-wider cursor-pointer transition-colors"
                >
                  {isProductSold ? "Close View" : "Cancel"}
                </button>
                {!isProductSold && (
                  <button
                    type="submit"
                    id="btn-save-stock-item"
                    disabled={isSubmitting || isUploadingImages || isUploadingVideo}
                    className="px-6 py-3 bg-white text-black hover:bg-zinc-200 rounded-xl text-xs font-bold font-display uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? (
                      <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</>
                    ) : isUploadingImages || isUploadingVideo ? (
                      <><Loader2 className="w-4 h-4 animate-spin" /> Uploading...</>
                    ) : (
                      <><Save className="w-4 h-4" /> Save Product</>
                    )}
                  </button>
                )}
              </div>

            </form>
          </div>
        </div>
      )}

      {/* GLOBAL SEARCH MODAL */}
      {isSearchOpen && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-md z-50 flex flex-col p-6 md:p-12 animate-fade-in animate-scale-up">
          <div className="flex justify-between items-center mb-8 max-w-4xl w-full mx-auto">
            <div className="flex items-center gap-3">
              <span className="p-2.5 bg-zinc-900 text-teal-400 rounded-xl border border-zinc-800">
                <Search className="w-6 h-6" />
              </span>
              <div>
                <h2 className="text-xl font-display font-black text-white uppercase tracking-wider">Search Inventory</h2>
                <p className="text-xs text-zinc-500 font-mono">Find models, storage sizes, conditions, or serial numbers</p>
              </div>
            </div>
            <button
              onClick={() => {
                setIsSearchOpen(false);
                setSearchQuery("");
              }}
              className="p-3 bg-zinc-900 border border-zinc-800 rounded-xl text-zinc-400 hover:text-white hover:border-zinc-700 transition-all cursor-pointer"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="relative max-w-4xl w-full mx-auto mb-6">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-6 h-6 text-zinc-500" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Start typing model, brand, tag or specs (e.g. iPhone 15, No Face ID, IBM)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-14 pr-6 py-5 bg-[#0D0D0D] border-2 border-[#222] focus:border-teal-500 rounded-2xl text-lg text-white placeholder-zinc-600 focus:outline-none transition-all font-mono"
            />
          </div>

          {/* Results Summary */}
          <div className="max-w-4xl w-full mx-auto flex-1 overflow-y-auto">
            <p className="text-[10px] font-mono font-bold text-zinc-500 uppercase tracking-widest mb-4">
              Found {filteredProducts.length} Match{filteredProducts.length === 1 ? "" : "es"}
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredProducts.map(product => (
                <div
                  key={product.id}
                  onClick={() => {
                    handleEditProduct(product);
                    setIsSearchOpen(false);
                  }}
                  className="p-4 bg-[#141414] border border-[#222] hover:border-teal-500/50 rounded-xl cursor-pointer flex items-center gap-4 transition-all hover:bg-zinc-900/60"
                >
                  <div className="w-12 h-12 rounded-lg bg-black overflow-hidden shrink-0 flex items-center justify-center border border-zinc-800">
                    {product.productImages?.[0] ? (
                      <img src={product.productImages[0]} alt="" referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-lg">{getCategoryEmoji(product.category)}</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-mono text-zinc-500 uppercase">{product.brand} • {product.storage}</p>
                    <h4 className="text-sm font-bold text-white truncate">{product.model}</h4>
                    <p className="text-xs text-teal-400 font-mono mt-0.5">₦{product.sellingPrice.toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Premium Matte Black Delete Confirmation Modal */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-[#121212] border-2 border-[#3F3F46] rounded-[20px] p-6 shadow-2xl animate-scale-up space-y-6">
            <div className="flex items-start gap-4 text-white">
              <div className="p-3 bg-rose-950/50 border border-rose-800/50 rounded-xl text-rose-500 shrink-0">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-black font-display text-white uppercase tracking-wider">{confirmModal.title}</h3>
                <p className="text-sm text-[#B7BCC7] leading-relaxed">{confirmModal.description}</p>
              </div>
            </div>
            
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                className="px-5 py-3 bg-[#1A1A1A] border border-[#2A2A2A] hover:bg-zinc-800 hover:text-white rounded-xl text-xs font-bold uppercase tracking-wider text-[#B7BCC7] cursor-pointer transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmModal.onConfirm}
                className="px-5 py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider cursor-pointer transition-colors shadow-lg shadow-rose-600/10"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DIRECT SALES modal (Inventory Sheet) */}
      {isSellModalOpen && selectedSellProduct && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto animate-fade-in" id="direct-sales-sheet">
          <div className="bg-[#0A0A0A] border-2 border-zinc-800 rounded-[28px] w-full max-w-xl max-h-[92vh] overflow-y-auto shadow-2xl animate-scale-up text-white animate-fade-in" id="sell-modal-container">
            
            {/* Header */}
            <div className="p-6 border-b border-zinc-900 bg-[#040404] flex justify-between items-center text-white rounded-t-[28px]">
              <div>
                <span className="text-[10px] font-mono font-black text-emerald-400 uppercase tracking-widest bg-emerald-500/10 px-2 py-0.5 rounded-md">
                  Inventory Transaction
                </span>
                <h2 className="font-display font-black text-xl uppercase tracking-wider flex items-center gap-2 mt-2 text-white">
                  Sell Product
                </h2>
                <p className="text-xs text-zinc-500 mt-1">
                  Record direct checkout for <strong className="text-white">{selectedSellProduct.brand} {selectedSellProduct.model} ({selectedSellProduct.storage})</strong>
                </p>
                <QuickTagsBadgeList 
                  tags={selectedSellProduct.condition} 
                  batteryHealth={selectedSellProduct.batteryHealth} 
                  variant="dark"
                  className="mt-2"
                />
              </div>
              <button
                type="button"
                onClick={() => setIsSellModalOpen(false)}
                className="p-2.5 hover:bg-zinc-900 rounded-full transition-colors cursor-pointer text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSellSubmit} className="p-6 space-y-5 text-white">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Customer Name */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono font-black tracking-widest text-zinc-400 uppercase flex items-center gap-1">
                    Customer Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Kolawole Johnson"
                    value={sellCustomerName}
                    onChange={(e) => setSellCustomerName(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-emerald-500 transition-colors font-sans"
                  />
                </div>

                {/* Customer Phone */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono font-black tracking-widest text-zinc-400 uppercase">
                    Phone Number
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 08034567890"
                    value={sellCustomerPhone}
                    onChange={(e) => setSellCustomerPhone(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-emerald-500 transition-colors font-mono"
                  />
                </div>

                 {/* Selling Price */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono font-black tracking-widest text-zinc-400 uppercase">
                    Selling Price (₦)
                  </label>
                  <input
                    type="number"
                    required
                    value={sellPrice}
                    onChange={(e) => setSellPrice(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-emerald-500 transition-colors font-mono"
                  />
                  
                  {/* Quick suffix buttons K and M */}
                  <div className="flex gap-2 mt-1">
                    <button
                      type="button"
                      onClick={() => {
                        const num = parseFloat(sellPrice);
                        if (!isNaN(num)) {
                          setSellPrice((num * 1000).toString());
                        }
                      }}
                      className="flex-1 py-1.5 bg-[#1C1D22] hover:bg-[#2B2E36] border border-zinc-800 text-zinc-400 hover:text-emerald-400 text-[10px] font-mono font-bold rounded-lg transition-all cursor-pointer flex justify-center items-center gap-1 shadow-sm"
                    >
                      <span>× Thousand</span> <span className="text-[9px] bg-emerald-500/10 text-emerald-400 px-1 py-0.25 rounded font-black">K</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const num = parseFloat(sellPrice);
                        if (!isNaN(num)) {
                          setSellPrice((num * 1000000).toString());
                        }
                      }}
                      className="flex-1 py-1.5 bg-[#1C1D22] hover:bg-[#2B2E36] border border-zinc-800 text-zinc-400 hover:text-teal-400 text-[10px] font-mono font-bold rounded-lg transition-all cursor-pointer flex justify-center items-center gap-1 shadow-sm"
                    >
                      <span>× Million</span> <span className="text-[9px] bg-teal-500/10 text-teal-400 px-1 py-0.25 rounded font-black">M</span>
                    </button>
                  </div>
                </div>

                {/* Discount */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono font-black tracking-widest text-zinc-400 uppercase">
                    Discount (₦ - Optional)
                  </label>
                  <input
                    type="number"
                    value={sellDiscount}
                    onChange={(e) => setSellDiscount(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-emerald-500 transition-colors font-mono"
                  />
                </div>

                {/* Payment Method */}
                <div className="col-span-1 md:col-span-2 space-y-2">
                  <label className="text-[10px] font-mono font-black tracking-widest text-zinc-400 uppercase">
                    Payment Channel
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {(["Transfer", "Cash", "POS", "Split"] as const).map((method) => (
                      <button
                        key={method}
                        type="button"
                        onClick={() => setSellPaymentMethod(method)}
                        className={`py-3.5 rounded-xl border text-[10px] font-mono font-black uppercase tracking-wider transition-all cursor-pointer ${
                          sellPaymentMethod === method
                            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                            : "bg-zinc-900/40 border-zinc-800 text-zinc-500 hover:border-zinc-700"
                        }`}
                      >
                        {method}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Split Payment Options */}
                {sellPaymentMethod === "Split" && (
                  <div className="col-span-1 md:col-span-2 bg-zinc-900/40 border border-zinc-800 p-4 rounded-2xl grid grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <label className="text-[9px] font-mono font-bold text-zinc-500 uppercase">Cash Part</label>
                      <input
                        type="number"
                        placeholder="₦0"
                        value={sellSplitCash}
                        onChange={(e) => setSellSplitCash(e.target.value)}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-mono font-bold text-zinc-500 uppercase">Transfer Part</label>
                      <input
                        type="number"
                        placeholder="₦0"
                        value={sellSplitTransfer}
                        onChange={(e) => setSellSplitTransfer(e.target.value)}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-mono font-bold text-zinc-500 uppercase">POS Part</label>
                      <input
                        type="number"
                        placeholder="₦0"
                        value={sellSplitPos}
                        onChange={(e) => setSellSplitPos(e.target.value)}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
                      />
                    </div>
                  </div>
                )}

                {/* Warranty */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono font-black tracking-widest text-zinc-400 uppercase">
                    Warranty Offered
                  </label>
                  <select
                    value={sellWarranty}
                    onChange={(e) => setSellWarranty(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-emerald-500 transition-colors font-sans"
                  >
                    <option value="No Warranty">No Warranty</option>
                    <option value="7 Days Warranty">7 Days</option>
                    <option value="14 Days Warranty">14 Days</option>
                    <option value="30 Days Warranty">30 Days</option>
                    <option value="6 Months Warranty">6 Months</option>
                    <option value="1 Year Warranty">1 Year</option>
                  </select>
                </div>

                {/* Notes */}
                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-[10px] font-mono font-black tracking-widest text-zinc-400 uppercase">
                    Transaction Notes
                  </label>
                  <textarea
                    placeholder="Provide accessories included or comments..."
                    rows={2}
                    value={sellNotes}
                    onChange={(e) => setSellNotes(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-emerald-500 transition-colors font-sans"
                  />
                </div>

              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-900">
                <button
                  type="button"
                  onClick={() => setIsSellModalOpen(false)}
                  className="px-5 py-3.5 bg-zinc-900/60 hover:bg-zinc-800 border border-zinc-800 text-[#B7BCC7] hover:text-white rounded-xl text-xs font-bold uppercase tracking-wider cursor-pointer transition-colors"
                >
                  Discard
                </button>
                <button
                  type="submit"
                  className="px-6 py-3.5 bg-emerald-500 hover:bg-emerald-600 text-black font-extrabold rounded-xl text-xs uppercase tracking-wider cursor-pointer transition-colors flex items-center gap-1.5 shadow-lg shadow-emerald-500/10"
                >
                  Confirm Checkout & Reduce Stock
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* OFFICIAL CENTRALIZED RECEIPT MODAL FOR DIRECT SALES */}
      <OfficialReceiptModal
        sale={activeReceiptSale}
        onClose={() => setActiveReceiptSale(null)}
        shop={shop}
        products={products}
      />

      {/* WEB APP IN-APP VIDEO PLAYER MODAL */}
      <VideoPlayerModal
        isOpen={isVideoModalOpen}
        onClose={() => setIsVideoModalOpen(false)}
        videoUrl={selectedVideoUrl}
        title="RESTOCKR Product Video Player"
      />

    </div>
  );
}
