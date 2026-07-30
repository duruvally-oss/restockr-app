import { 
  Shop, 
  Product, 
  Sale, 
  Customer, 
  Staff, 
  AuditLog, 
  AppNotification, 
  Category, 
  DeviceCondition 
} from "../types";
import { supabase, deleteFileFromSupabase } from "./supabase";

// Real-time listener system to notify components of updates immediately
type ListenerCallback = () => void;
const listeners = new Set<ListenerCallback>();

export function subscribeToDBUpdates(callback: ListenerCallback) {
  listeners.add(callback);
  return () => {
    listeners.delete(callback);
  };
}

function notifyListeners() {
  listeners.forEach(callback => callback());
}

// ----------------------------------------------------
// INDEXEDDB MEDIA CACHING FOR IMAGES AND VIDEOS
// ----------------------------------------------------
let mediaDb: IDBDatabase | null = null;
const mediaImagesCache: Record<string, string[]> = {};
const mediaVideosCache: Record<string, string> = {};

if (typeof window !== "undefined" && window.indexedDB) {
  const request = window.indexedDB.open("restockr_media_store", 2);
  request.onupgradeneeded = (e: any) => {
    const db = request.result;
    if (!db.objectStoreNames.contains("images")) {
      db.createObjectStore("images");
    }
    if (!db.objectStoreNames.contains("videos")) {
      db.createObjectStore("videos");
    }
  };
  request.onsuccess = () => {
    mediaDb = request.result;
    loadAllMediaFromIndexedDB();
  };
}

function loadAllMediaFromIndexedDB() {
  if (!mediaDb) return;
  
  try {
    const tx = mediaDb.transaction(["images", "videos"], "readonly");
    const imgStore = tx.objectStore("images");
    const vidStore = tx.objectStore("videos");
    
    const imgRequest = imgStore.openCursor();
    imgRequest.onsuccess = (e: any) => {
      const cursor = e.target.result;
      if (cursor) {
        mediaImagesCache[cursor.key] = cursor.value;
        cursor.continue();
      }
    };

    const vidRequest = vidStore.openCursor();
    vidRequest.onsuccess = (e: any) => {
      const cursor = e.target.result;
      if (cursor) {
        mediaVideosCache[cursor.key] = cursor.value;
        cursor.continue();
      }
    };
    
    tx.oncomplete = () => {
      console.log("IndexedDB media loaded into memory cache.");
      notifyListeners();
    };
  } catch (err) {
    console.warn("Failed to load IndexedDB media", err);
  }
}

function saveMediaToIndexedDB(storeName: "images" | "videos", key: string, value: any) {
  if (storeName === "images") {
    mediaImagesCache[key] = value;
  } else {
    mediaVideosCache[key] = value;
  }
  
  if (!mediaDb) return;
  try {
    const tx = mediaDb.transaction(storeName, "readwrite");
    tx.objectStore(storeName).put(value, key);
  } catch (err) {
    console.error(`Failed to save ${storeName} to IndexedDB`, err);
  }
}

function deleteMediaFromIndexedDB(key: string) {
  delete mediaImagesCache[key];
  delete mediaVideosCache[key];
  
  if (!mediaDb) return;
  try {
    const tx = mediaDb.transaction(["images", "videos"], "readwrite");
    if (tx.objectStoreNames.contains("images")) tx.objectStore("images").delete(key);
    if (tx.objectStoreNames.contains("videos")) tx.objectStore("videos").delete(key);
  } catch (err) {
    console.error("Failed to delete media from IndexedDB", err);
  }
}

// Auto-clear demo data if the user previously loaded the old seed data in their browser
if (typeof window !== "undefined" && !localStorage.getItem("restockr_demo_cleared_v3")) {
  localStorage.removeItem("restockr_products");
  localStorage.removeItem("restockr_sales");
  localStorage.removeItem("restockr_customers");
  localStorage.removeItem("restockr_staff");
  localStorage.removeItem("restockr_audit_logs");
  localStorage.removeItem("restockr_notifications");
  localStorage.removeItem("restockr_shops");
  localStorage.setItem("restockr_demo_cleared_v3", "true");
}

// Initial seed data for Nigerian Gadget stores
const INITIAL_SHOPS: Shop[] = [];

const INITIAL_STAFF: Staff[] = [];

const INITIAL_PRODUCTS: Product[] = [];

const INITIAL_CUSTOMERS: Customer[] = [];

const INITIAL_SALES: Sale[] = [];

const INITIAL_AUDIT_LOGS: AuditLog[] = [];

const INITIAL_NOTIFICATIONS: AppNotification[] = [];

// LocalStorage helpers with fallback state
function getLocalStorageItem<T>(key: string, defaultValue: T): T {
  try {
    const value = localStorage.getItem(key);
    if (value) {
      return JSON.parse(value);
    }
  } catch (e) {
    console.error("LocalStorage read error", e);
  }
  return defaultValue;
}

function setLocalStorageItem<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    notifyListeners();
  } catch (e: any) {
    console.error("LocalStorage write error", e);
    if (e.name === "QuotaExceededError" || e.name === "NS_ERROR_DOM_QUOTA_REACHED" || e.code === 22) {
      // Storage is full! Let's auto-prune some non-critical data
      try {
        // Prune notifications to last 5 items
        const notifications = getLocalStorageItem<any[]>("restockr_notifications", []);
        if (notifications.length > 5) {
          localStorage.setItem("restockr_notifications", JSON.stringify(notifications.slice(0, 5)));
        }
        // Prune audit logs to last 5 items
        const logs = getLocalStorageItem<any[]>("restockr_audit_logs", []);
        if (logs.length > 5) {
          localStorage.setItem("restockr_audit_logs", JSON.stringify(logs.slice(0, 5)));
        }
        // Try setting the item again
        localStorage.setItem(key, JSON.stringify(value));
        notifyListeners();
      } catch (retryError) {
        console.error("Failed to recover from storage quota limit", retryError);
        alert("⚠️ Storage quota exceeded! Please delete some items or remove products with large photos to free up space.");
      }
    }
  }
}

// Global state hooks
export const db = {
  getShops: (): Shop[] => {
    return getLocalStorageItem("restockr_shops", INITIAL_SHOPS);
  },

  getShopBySlug: (slug: string): Shop | undefined => {
    const shops = db.getShops();
    return shops.find(s => s.slug.toLowerCase() === slug.toLowerCase());
  },

  getShopById: (id: string): Shop | undefined => {
    const shops = db.getShops();
    return shops.find(s => s.id === id);
  },

  saveShop: (shop: Shop): void => {
    const shops = db.getShops();
    const index = shops.findIndex(s => s.id === shop.id);
    if (index >= 0) {
      shops[index] = shop;
    } else {
      shops.push(shop);
    }
    setLocalStorageItem("restockr_shops", shops);
  },

  getResolvedVideoUrl: (product: Product): string => {
    if (!product.productVideo) return "";
    if (product.productVideo.startsWith("db:")) {
      const cached = mediaVideosCache[`video-${product.id}`];
      if (cached) return cached;
    }
    return product.productVideo;
  },

  getProducts: (shopId: string): Product[] => {
    const products = getLocalStorageItem<Product[]>("restockr_products", INITIAL_PRODUCTS);
    return products.filter(p => p.shop_id === shopId).map(p => {
      const cloned = { ...p };
      if (cloned.productImages && cloned.productImages[0]?.startsWith("db:")) {
        const cachedImgs = mediaImagesCache[`images-${cloned.id}`];
        if (cachedImgs && cachedImgs.length > 0) {
          cloned.productImages = cachedImgs;
        }
      }
      if (cloned.productVideo?.startsWith("db:")) {
        const cachedVid = mediaVideosCache[`video-${cloned.id}`];
        if (cachedVid) {
          cloned.productVideo = cachedVid;
        }
      }
      return cloned;
    });
  },

  getProductById: (id: string): Product | undefined => {
    const products = getLocalStorageItem<Product[]>("restockr_products", INITIAL_PRODUCTS);
    const p = products.find(p => p.id === id);
    if (!p) return undefined;
    const cloned = { ...p };
    if (cloned.productImages && cloned.productImages[0]?.startsWith("db:")) {
      const cachedImgs = mediaImagesCache[`images-${cloned.id}`];
      if (cachedImgs && cachedImgs.length > 0) {
        cloned.productImages = cachedImgs;
      }
    }
    if (cloned.productVideo?.startsWith("db:")) {
      const cachedVid = mediaVideosCache[`video-${cloned.id}`];
      if (cachedVid) {
        cloned.productVideo = cachedVid;
      }
    }
    return cloned;
  },

  saveProduct: (product: Product, performer: string = "Owner"): void => {
    const products = getLocalStorageItem<Product[]>("restockr_products", INITIAL_PRODUCTS);
    const index = products.findIndex(p => p.id === product.id);
    const oldProduct = index >= 0 ? products[index] : null;

    // Detect video removal or replacement
    if (oldProduct && oldProduct.productVideo && oldProduct.productVideo !== product.productVideo) {
      if (oldProduct.productVideo.includes("supabase.co")) {
        deleteFileFromSupabase(oldProduct.productVideo).catch(err => {
          console.warn("[Database] Supabase video deletion failed:", err);
        });
      }
      deleteMediaFromIndexedDB(`video-${product.id}`);
    }

    // Process product video URL
    if (product.productVideo && product.productVideo.startsWith("data:")) {
      saveMediaToIndexedDB("videos", `video-${product.id}`, product.productVideo);
      product.productVideo = `db:${product.id}`;
    } else if (!product.productVideo || product.productVideo.trim() === "") {
      product.productVideo = undefined;
      deleteMediaFromIndexedDB(`video-${product.id}`);
    }

    if (product.productImages && product.productImages.length > 0) {
      product.productImages = product.productImages.map(img =>
        img.startsWith("blob:") ? "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&q=80&w=600" : img
      );
    }
    
    // Extract heavy base64 data URLs to IndexedDB / memory cache for images
    const productId = product.id;
    if (product.productImages && product.productImages.length > 0) {
      const firstImg = product.productImages[0];
      if (firstImg?.startsWith("data:")) {
        saveMediaToIndexedDB("images", `images-${productId}`, product.productImages);
        product.productImages = [`db:${productId}`];
      }
    }

    const isEdit = index >= 0;
    if (isEdit) {
      products[index] = product;
    } else {
      products.unshift(product); // Add to top
    }
    setLocalStorageItem("restockr_products", products);

    // If performer is not "Owner", generate notification to owner
    if (performer !== "Owner") {
      db.addNotification(
        product.shop_id,
        isEdit ? "Staff Edited Product" : "Staff Added Product",
        `Staff member ${performer} ${isEdit ? "edited" : "added"} product: ${product.brand} ${product.model} (${product.storage})`,
        "info"
      );
    }
    notifyListeners();
  },

  deleteProduct: (shopId: string, id: string): void => {
    const products = getLocalStorageItem<Product[]>("restockr_products", INITIAL_PRODUCTS);
    const target = products.find(p => p.id === id && p.shop_id === shopId);
    if (target && target.productVideo) {
      if (target.productVideo.includes("supabase.co")) {
        deleteFileFromSupabase(target.productVideo).catch(err => {
          console.warn("[Database] Supabase video deletion failed:", err);
        });
      }
    }
    const filtered = products.filter(p => !(p.id === id && p.shop_id === shopId));
    setLocalStorageItem("restockr_products", filtered);
    deleteMediaFromIndexedDB(`images-${id}`);
    deleteMediaFromIndexedDB(`video-${id}`);
    notifyListeners();
  },

  getSales: (shopId: string): Sale[] => {
    const sales = getLocalStorageItem<Sale[]>("restockr_sales", INITIAL_SALES);
    return sales.filter(s => s.shop_id === shopId);
  },

  saveSale: (sale: Sale): void => {
    // 1. Add Sale
    const sales = getLocalStorageItem<Sale[]>("restockr_sales", INITIAL_SALES);
    const saleWithStatus = { ...sale, status: "Completed" as const };
    sales.unshift(saleWithStatus);
    setLocalStorageItem("restockr_sales", sales);

    // 2. Adjust product inventory quantity
    const products = getLocalStorageItem<Product[]>("restockr_products", INITIAL_PRODUCTS);
    const prodIndex = products.findIndex(p => p.id === sale.productId);
    if (prodIndex >= 0) {
      products[prodIndex].quantity = 0;
      products[prodIndex].status = "SOLD";
      products[prodIndex].sold_at = sale.createdAt || new Date().toISOString();
      setLocalStorageItem("restockr_products", products);
    }

    // 3. Update or create customer profile
    const customers = getLocalStorageItem<Customer[]>("restockr_customers", INITIAL_CUSTOMERS);
    const custIndex = customers.findIndex(
      c => c.phoneNumber.replace(/\s+/g, "") === sale.customerPhone.replace(/\s+/g, "") && c.shop_id === sale.shop_id
    );

    if (custIndex >= 0) {
      customers[custIndex].purchaseCount += 1;
      customers[custIndex].totalSpent += sale.totalAmount;
      if (!customers[custIndex].notes.includes(sale.productName)) {
        customers[custIndex].notes += ` | Bought ${sale.productName}`;
      }
    } else if (sale.customerName) {
      customers.push({
        id: `cust-${Date.now()}`,
        shop_id: sale.shop_id,
        name: sale.customerName,
        phoneNumber: sale.customerPhone,
        purchaseCount: 1,
        totalSpent: sale.totalAmount,
        notes: `Bought ${sale.productName}`
      });
    }
    setLocalStorageItem("restockr_customers", customers);

    // 4. Log Audit Trail
    db.addAuditLog(
      sale.shop_id,
      sale.soldBy,
      sale.soldByPhone || "Owner",
      "Sale Completed",
      `Completed sale for ${sale.quantity}x ${sale.productName} (₦${sale.totalAmount.toLocaleString()}) to ${sale.customerName || "Walk-in Customer"}`
    );

    // 5. Create alert
    db.addNotification(
      sale.shop_id,
      "Sale Completed",
      `${sale.soldBy} sold ${sale.productName} for ₦${sale.totalAmount.toLocaleString()}`,
      "success"
    );

    if (sale.soldBy !== "Owner") {
      db.addNotification(
        sale.shop_id,
        "Staff Logged Sale",
        `Staff member ${sale.soldBy} recorded a sale of ${sale.quantity}x ${sale.productName} for ₦${sale.totalAmount.toLocaleString()}`,
        "info"
      );
    }
    notifyListeners();
  },

  undoSale: (shopId: string, saleId: string, performedBy: string): { success: boolean; message: string } => {
    try {
      const sales = getLocalStorageItem<Sale[]>("restockr_sales", INITIAL_SALES);
      const saleIndex = sales.findIndex(s => s.id === saleId && s.shop_id === shopId);
      if (saleIndex < 0) {
        return { success: false, message: "Sale transaction record not found." };
      }

      const sale = sales[saleIndex];

      if (sale.status === "Reversed") {
        return { success: false, message: "Transaction already reversed previously." };
      }

      // Enforce role restriction: Only Owner can reverse
      if (performedBy !== "Owner") {
        return { success: false, message: "Access Denied: Only the store Owner is authorized to reverse sales transactions." };
      }

      // Enforce 30-day restriction
      const saleDate = new Date(sale.createdAt);
      const now = new Date();
      const diffTime = Math.abs(now.getTime() - saleDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      if (diffDays > 30) {
        return { success: false, message: "Time-limit Exceeded: This sale is over 30 days old and cannot be reversed." };
      }

      // 1. Restore product quantity and status
      const products = getLocalStorageItem<Product[]>("restockr_products", INITIAL_PRODUCTS);
      const prodIndex = products.findIndex(p => p.id === sale.productId);
      if (prodIndex >= 0) {
        products[prodIndex].quantity = (products[prodIndex].quantity || 0) + (sale.quantity || 1);
        products[prodIndex].status = "Available"; // restore status
        delete products[prodIndex].sold_at;
        setLocalStorageItem("restockr_products", products);
      }

      // 2. Deduct from customer metrics
      const customers = getLocalStorageItem<Customer[]>("restockr_customers", INITIAL_CUSTOMERS);
      const custIndex = customers.findIndex(
        c => c.phoneNumber && sale.customerPhone && c.phoneNumber.replace(/\s+/g, "") === sale.customerPhone.replace(/\s+/g, "") && c.shop_id === shopId
      );
      if (custIndex >= 0) {
        customers[custIndex].purchaseCount = Math.max(0, customers[custIndex].purchaseCount - 1);
        customers[custIndex].totalSpent = Math.max(0, customers[custIndex].totalSpent - sale.totalAmount);
        setLocalStorageItem("restockr_customers", customers);
      }

      // 3. Mark the receipt as Reversed (never delete)
      sales[saleIndex].status = "Reversed";
      setLocalStorageItem("restockr_sales", sales);

      // 4. Audit Log & Notification
      db.addAuditLog(
        shopId,
        performedBy,
        "System",
        "Sale Reversed",
        `Reversed sale receipt #${sale.id.slice(0, 8)} of ${sale.productName} (₦${sale.totalAmount.toLocaleString()}). Stock quantity restored.`
      );

      db.addNotification(
        shopId,
        "Sale Reversed",
        `Sale receipt #${sale.id.slice(0, 8)} (${sale.productName}) was reversed by ${performedBy}. Stock restored to live inventory.`,
        "warning"
      );

      notifyListeners();

      return { success: true, message: "Sale transaction successfully reversed and stock restored." };
    } catch (err: any) {
      console.error("Error performing sale reversal:", err);
      return { success: false, message: `Reversal failed: ${err.message || "Unknown error occurred"}` };
    }
  },

  getCustomers: (shopId: string): Customer[] => {
    const customers = getLocalStorageItem<Customer[]>("restockr_customers", INITIAL_CUSTOMERS);
    return customers.filter(c => c.shop_id === shopId);
  },

  saveCustomer: (customer: Customer): void => {
    const customers = getLocalStorageItem<Customer[]>("restockr_customers", INITIAL_CUSTOMERS);
    const index = customers.findIndex(c => c.id === customer.id);
    if (index >= 0) {
      customers[index] = customer;
    } else {
      customers.push(customer);
    }
    setLocalStorageItem("restockr_customers", customers);
  },

  getStaff: (shopId: string): Staff[] => {
    const staff = getLocalStorageItem<Staff[]>("restockr_staff", INITIAL_STAFF);
    return staff.filter(s => s.shop_id === shopId);
  },

  saveStaff: (member: Staff): void => {
    const staff = getLocalStorageItem<Staff[]>("restockr_staff", INITIAL_STAFF);
    const index = staff.findIndex(s => s.id === member.id);
    if (index >= 0) {
      staff[index] = member;
    } else {
      staff.push(member);
    }
    setLocalStorageItem("restockr_staff", staff);

    db.addAuditLog(
      member.shop_id,
      "Owner",
      "Owner",
      "Staff Profile Updated",
      `Staff member ${member.fullName} (${member.phoneNumber}) status updated to ${member.status}.`
    );
    notifyListeners();

    // Persist immediately to live Supabase staff table
    if (supabase) {
      const payload = {
        id: member.id,
        shop_id: member.shop_id,
        full_name: member.fullName,
        phone_number: member.phoneNumber,
        role: member.role || "Sales Representative",
        status: member.status,
        permissions: member.permissions,
        created_at: member.createdAt
      };

      supabase
        .from("staff")
        .upsert(payload, { onConflict: "id" })
        .then(({ error }) => {
          if (error) {
            console.warn("[Supabase Staff Primary Upsert Error]:", error.message);
            // Fallback for tables configured with camelCase column names
            const fallbackPayload = {
              id: member.id,
              shopId: member.shop_id,
              fullName: member.fullName,
              phoneNumber: member.phoneNumber,
              role: member.role || "Sales Representative",
              status: member.status,
              permissions: member.permissions,
              createdAt: member.createdAt
            };
            return supabase.from("staff").upsert(fallbackPayload, { onConflict: "id" });
          }
        }, err => {
          console.warn("[Supabase Staff Upsert Exception]:", err);
        });
    }
  },

  deleteStaff: (shopId: string, id: string): void => {
    const staff = getLocalStorageItem<Staff[]>("restockr_staff", INITIAL_STAFF);
    const member = staff.find(s => s.id === id);
    const filtered = staff.filter(s => !(s.id === id && s.shop_id === shopId));
    setLocalStorageItem("restockr_staff", filtered);

    if (member) {
      db.addAuditLog(
        shopId,
        "Owner",
        "Owner",
        "Staff Removed",
        `Removed staff member ${member.fullName} (${member.phoneNumber}).`
      );
    }
    notifyListeners();

    if (supabase) {
      supabase
        .from("staff")
        .delete()
        .eq("id", id)
        .then(({ error }) => {
          if (error) {
            console.warn("[Supabase Staff Delete Error]:", error.message);
          }
        }, err => {
          console.warn("[Supabase Staff Delete Exception]:", err);
        });
    }
  },

  getAuditLogs: (shopId: string): AuditLog[] => {
    const logs = getLocalStorageItem<AuditLog[]>("restockr_audit_logs", INITIAL_AUDIT_LOGS);
    return logs.filter(l => l.shop_id === shopId);
  },

  addAuditLog: (shopId: string, userName: string, userId: string, action: string, details: string): void => {
    const logs = getLocalStorageItem<AuditLog[]>("restockr_audit_logs", INITIAL_AUDIT_LOGS);
    logs.unshift({
      id: `log-${Date.now()}`,
      shop_id: shopId,
      userId,
      userName,
      action,
      details,
      createdAt: new Date().toISOString()
    });
    setLocalStorageItem("restockr_audit_logs", logs);
  },

  getNotifications: (shopId: string): AppNotification[] => {
    const notifications = getLocalStorageItem<AppNotification[]>("restockr_notifications", INITIAL_NOTIFICATIONS);
    return notifications.filter(n => n.shop_id === shopId);
  },

  addNotification: (shopId: string, title: string, message: string, type: "info" | "success" | "warning" | "error"): void => {
    const notifications = getLocalStorageItem<AppNotification[]>("restockr_notifications", INITIAL_NOTIFICATIONS);
    notifications.unshift({
      id: `notif-${Date.now()}`,
      shop_id: shopId,
      title,
      message,
      type,
      read: false,
      createdAt: new Date().toISOString()
    });
    setLocalStorageItem("restockr_notifications", notifications);
  },

  markNotificationsAsRead: (shopId: string): void => {
    const notifications = getLocalStorageItem<AppNotification[]>("restockr_notifications", INITIAL_NOTIFICATIONS);
    notifications.forEach(n => {
      if (n.shop_id === shopId) {
        n.read = true;
      }
    });
    setLocalStorageItem("restockr_notifications", notifications);
  },

  updateShopSettings: (shopId: string, settings: Shop["websiteSettings"]): void => {
    const shops = db.getShops();
    const index = shops.findIndex(s => s.id === shopId);
    if (index >= 0) {
      shops[index].websiteSettings = settings;
      setLocalStorageItem("restockr_shops", shops);

      db.addAuditLog(
        shopId,
        "Owner",
        "Owner",
        "Website Settings Updated",
        "Updated custom reseller website preferences (Theme colors, show/hide status, download permissions)."
      );
    }
  },

  updateShopProfile: (shopId: string, profile: { name: string; businessAddress?: string; businessPhone?: string; logoUrl?: string; whatsappNumber: string }): void => {
    const shops = db.getShops();
    const index = shops.findIndex(s => s.id === shopId);
    if (index >= 0) {
      shops[index].name = profile.name;
      shops[index].businessAddress = profile.businessAddress;
      shops[index].businessPhone = profile.businessPhone;
      shops[index].logoUrl = profile.logoUrl;
      shops[index].whatsappNumber = profile.whatsappNumber;
      setLocalStorageItem("restockr_shops", shops);

      db.addAuditLog(
        shopId,
        "Owner",
        "Owner",
        "Business Profile Updated",
        `Updated business profile details for ${profile.name}.`
      );
    }
  },

  getPasswords: (): Record<string, string> => {
    return getLocalStorageItem<Record<string, string>>("restockr_passwords", {});
  },

  savePassword: (username: string, password: string): void => {
    const passwords = db.getPasswords();
    passwords[username.toLowerCase().trim()] = password;
    setLocalStorageItem("restockr_passwords", passwords);
  }
};

// ----------------------------------------------------
// SUPABASE REAL-TIME STAFF SYNCHRONIZATION HELPERS
// ----------------------------------------------------
export function mapSupabaseStaffToLocal(row: any): Staff {
  return {
    id: String(row.id),
    shop_id: String(row.shop_id || row.shopId || ""),
    fullName: String(row.full_name || row.fullName || row.fullname || "Staff Member"),
    phoneNumber: String(row.phone_number || row.phoneNumber || row.phonenumber || ""),
    role: row.role ? String(row.role) : undefined,
    status: row.status === "Suspended" ? "Suspended" : "Active",
    permissions: typeof row.permissions === "object" && row.permissions !== null
      ? {
          addProduct: !!row.permissions.addProduct,
          editProduct: !!row.permissions.editProduct,
          sellProduct: !!row.permissions.sellProduct,
          registerCustomer: !!row.permissions.registerCustomer,
          receiveRepairs: !!row.permissions.receiveRepairs,
          updateRepairStatus: !!row.permissions.updateRepairStatus,
          viewInventory: !!row.permissions.viewInventory,
          checkPrices: !!row.permissions.checkPrices,
          viewProductDetails: !!row.permissions.viewProductDetails,
          deleteProduct: !!row.permissions.deleteProduct,
        }
      : {
          addProduct: true,
          editProduct: false,
          sellProduct: true,
          registerCustomer: true,
          receiveRepairs: true,
          updateRepairStatus: true,
          viewInventory: true,
          checkPrices: true,
          viewProductDetails: true,
          deleteProduct: false,
        },
    createdAt: row.created_at || row.createdAt || new Date().toISOString(),
  };
}

export async function syncStaffWithSupabase(shopId: string): Promise<Staff[]> {
  if (!supabase || !shopId) return db.getStaff(shopId);

  try {
    let { data, error } = await supabase
      .from("staff")
      .select("*")
      .eq("shop_id", shopId);

    if (error) {
      // Fallback try camelCase column if shop_id fails
      const fallback = await supabase
        .from("staff")
        .select("*")
        .eq("shopId", shopId);

      data = fallback.data;
      error = fallback.error;
    }

    if (!error && data && data.length > 0) {
      const mapped = data.map(mapSupabaseStaffToLocal);
      const allStaff = getLocalStorageItem<Staff[]>("restockr_staff", INITIAL_STAFF);
      const otherShopsStaff = allStaff.filter(s => s.shop_id !== shopId);
      const updatedStaffList = [...otherShopsStaff, ...mapped];
      setLocalStorageItem("restockr_staff", updatedStaffList);
      notifyListeners();
      return mapped;
    }
  } catch (err) {
    console.warn("[Supabase Staff Sync Exception]:", err);
  }

  return db.getStaff(shopId);
}

// Global Supabase Realtime channel for staff updates
if (typeof window !== "undefined" && supabase) {
  try {
    supabase
      .channel("public:staff")
      .on("postgres_changes", { event: "*", schema: "public", table: "staff" }, (payload) => {
        const activeShopId = localStorage.getItem("restockr_currentShopId");
        if (activeShopId) {
          syncStaffWithSupabase(activeShopId);
        }
      })
      .subscribe();
  } catch (err) {
    console.warn("[Supabase Staff Channel Exception]:", err);
  }
}

