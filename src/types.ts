export enum Category {
  Phones = "Phones",
  Tablets = "Tablets",
  Laptops = "Laptops",
  SmartWatches = "Smart Watches",
  GameConsoles = "Game Consoles",
  Accessories = "Accessories"
}

export enum DeviceCondition {
  BrandNew = "Brand New",
  LikeNew = "Like New",
  CleanDevice = "Clean Device",
  MinorScratches = "Minor Scratches",
  HeavyScratches = "Heavy Scratches",
  Dented = "Dented",
  CrackedBack = "Cracked Back",
  WaterDamage = "Water Damage",
  UnknownPart = "Unknown Part",
  CarrierLocked = "Carrier Locked",
  IBM = "IBM", // Original Battery/Screen
  ICM = "ICM", // Original Camera
  IDM = "IDM", // Original Screen
  GreenLine = "Green Line",
  PinkLine = "Pink Line",
  SlightShadow = "Slight Shadow"
}

export interface StaffPermission {
  addProduct: boolean;
  editProduct: boolean;
  sellProduct: boolean;
  registerCustomer: boolean;
  receiveRepairs: boolean;
  updateRepairStatus: boolean;
  viewInventory: boolean;
  checkPrices: boolean;
  viewProductDetails: boolean;
  deleteProduct: boolean;
  [key: string]: boolean;
}

export interface Staff {
  id: string;
  shop_id: string;
  fullName: string;
  phoneNumber: string;
  role?: string; // Staff Role (Optional)
  status: "Active" | "Suspended";
  permissions: StaffPermission;
  createdAt: string; // Date Added
}

export interface Product {
  id: string;
  shop_id: string;
  category: Category;
  brand: string;
  model: string;
  storage: string;
  quantity: number;
  sellingPrice: number;
  batteryHealth?: string; // e.g. "88%", "Service", "IBM", "Other"
  warranty: string; // "No Warranty", "7 Days", "14 Days", etc.
  condition: string[]; // Nigerian Device Condition Quick Tags
  variant?: string; // Optional custom variant/color/model extension
  minimumStockThreshold?: number; // Minimum stock alert threshold
  productVideo?: string; // URL or base64 representation
  productImages: string[]; // URLs or base64 representations
  status: "Available" | "Sold Out" | "SOLD";
  createdAt: string;
  sold_at?: string;
}

export interface Sale {
  id: string; // UUID secure receipt ID
  shop_id: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
  paymentMethod: "Cash" | "Transfer" | "POS" | "Split";
  splitDetails?: {
    cash?: number;
    transfer?: number;
    pos?: number;
  };
  customerName: string;
  customerPhone: string;
  soldBy: string; // "Owner" or Staff Name
  soldByPhone?: string; // If sold by staff
  createdAt: string;
  status?: "Completed" | "Reversed";
}

export interface Customer {
  id: string;
  shop_id: string;
  name: string;
  phoneNumber: string;
  purchaseCount: number;
  totalSpent: number;
  notes: string;
}

export interface AuditLog {
  id: string;
  shop_id: string;
  userId: string; // "Owner" or Staff Phone Number
  userName: string; // "Owner" or Staff Name
  action: string; // e.g., "Product Added", "Sale Completed"
  details: string;
  createdAt: string;
}

export interface Shop {
  id: string;
  name: string;
  slug: string; // URL path, e.g., 'autogadget'
  ownerUsername: string;
  logoUrl?: string;
  whatsappNumber: string;
  businessAddress?: string;
  businessPhone?: string;
  subscriptionPlan: "Free Trial" | "Monthly Plan" | "Yearly Plan";
  subscriptionStatus: "Active" | "Expired";
  subscriptionExpiry: string;
  websiteSettings: {
    showPrices: boolean;
    showSoldProducts: boolean;
    enableVideoDownloads: boolean;
    enableImageDownloads: boolean;
    customThemeColor: string; // HEX or color class
  };
  createdAt: string;
}

export interface AppNotification {
  id: string;
  shop_id: string;
  title: string;
  message: string;
  type: "info" | "success" | "warning" | "error";
  read: boolean;
  createdAt: string;
}
