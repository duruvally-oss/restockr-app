import {
  Shop,
  Product,
  Sale,
  Customer,
  Staff,
  AuditLog,
  AppNotification,
} from "../types";
import { supabase, deleteFileFromSupabase } from "./supabase";

// ----------------------------------------------------
// REAL-TIME LISTENER SYSTEM
// ----------------------------------------------------
type ListenerCallback = () => void;
const listeners = new Set<ListenerCallback>();

export function subscribeToDBUpdates(callback: ListenerCallback) {
  listeners.add(callback);
  return () => {
    listeners.delete(callback);
  };
}

function notifyListeners() {
  listeners.forEach((callback) => callback());
}

// ----------------------------------------------------
// IN-MEMORY CACHE (populated from Supabase, kept in sync via realtime)
// LocalStorage is only used for lightweight UI state (activeModule, etc.)
// ----------------------------------------------------
let cache: {
  shops: Shop[];
  products: Product[];
  sales: Sale[];
  customers: Customer[];
  staff: Staff[];
  notifications: AppNotification[];
  auditLogs: AuditLog[];
} = {
  shops: [],
  products: [],
  sales: [],
  customers: [],
  staff: [],
  notifications: [],
  auditLogs: [],
};

let currentShopId: string | null = null;
let isInitialized = false;

// ----------------------------------------------------
// MAPPING: Supabase snake_case <-> App camelCase
// ----------------------------------------------------
function mapShop(row: any): Shop {
  return {
    id: String(row.id),
    name: String(row.name),
    slug: String(row.slug),
    ownerUsername: String(row.owner_username),
    logoUrl: row.logo_url || undefined,
    whatsappNumber: String(row.whatsapp_number),
    businessAddress: row.business_address || undefined,
    businessPhone: row.business_phone || undefined,
    subscriptionPlan: row.subscription_plan || "Free Trial",
    subscriptionStatus: row.subscription_status || "Active",
    subscriptionExpiry: row.subscription_expiry || "",
    websiteSettings: row.website_settings || {
      showPrices: true,
      showSoldProducts: true,
      enableVideoDownloads: true,
      enableImageDownloads: true,
      customThemeColor: "#0F172A",
    },
    createdAt: row.created_at || new Date().toISOString(),
  };
}

function shopToRow(shop: Shop) {
  return {
    id: shop.id,
    name: shop.name,
    slug: shop.slug,
    owner_username: shop.ownerUsername,
    logo_url: shop.logoUrl || null,
    whatsapp_number: shop.whatsappNumber,
    business_address: shop.businessAddress || null,
    business_phone: shop.businessPhone || null,
    subscription_plan: shop.subscriptionPlan,
    subscription_status: shop.subscriptionStatus,
    subscription_expiry: shop.subscriptionExpiry,
    website_settings: shop.websiteSettings,
    created_at: shop.createdAt,
  };
}

function mapProduct(row: any): Product {
  return {
    id: String(row.id),
    shop_id: String(row.shop_id),
    category: row.category,
    brand: String(row.brand),
    model: String(row.model),
    storage: String(row.storage || "N/A"),
    quantity: Number(row.quantity || 0),
    sellingPrice: Number(row.selling_price || 0),
    batteryHealth: row.battery_health || undefined,
    warranty: String(row.warranty || "No Warranty"),
    condition: row.condition || [],
    variant: row.variant || undefined,
    minimumStockThreshold: row.minimum_stock_threshold !== null ? Number(row.minimum_stock_threshold) : undefined,
    productVideo: row.product_video || undefined,
    productImages: row.product_images || [],
    status: row.status || "Available",
    createdAt: row.created_at || new Date().toISOString(),
    sold_at: row.sold_at || undefined,
  };
}

function productToRow(product: Product) {
  return {
    id: product.id,
    shop_id: product.shop_id,
    category: product.category,
    brand: product.brand,
    model: product.model,
    storage: product.storage,
    quantity: product.quantity,
    selling_price: product.sellingPrice,
    battery_health: product.batteryHealth || null,
    warranty: product.warranty,
    condition: product.condition,
    variant: product.variant || null,
    minimum_stock_threshold: product.minimumStockThreshold ?? null,
    product_video: product.productVideo || null,
    product_images: product.productImages,
    status: product.status,
    created_at: product.createdAt,
    sold_at: product.sold_at || null,
  };
}

function mapSale(row: any): Sale {
  return {
    id: String(row.id),
    shop_id: String(row.shop_id),
    productId: String(row.product_id || ""),
    productName: String(row.product_name || ""),
    quantity: Number(row.quantity || 1),
    unitPrice: Number(row.unit_price || 0),
    totalAmount: Number(row.total_amount || 0),
    paymentMethod: row.payment_method || "Cash",
    splitDetails: row.split_details || undefined,
    customerName: row.customer_name || "",
    customerPhone: row.customer_phone || "",
    soldBy: row.sold_by || "Owner",
    soldByPhone: row.sold_by_phone || undefined,
    createdAt: row.created_at || new Date().toISOString(),
    status: row.status || "Completed",
  };
}

function saleToRow(sale: Sale) {
  return {
    id: sale.id,
    shop_id: sale.shop_id,
    product_id: sale.productId,
    product_name: sale.productName,
    quantity: sale.quantity,
    unit_price: sale.unitPrice,
    total_amount: sale.totalAmount,
    payment_method: sale.paymentMethod,
    split_details: sale.splitDetails || null,
    customer_name: sale.customerName,
    customer_phone: sale.customerPhone,
    sold_by: sale.soldBy,
    sold_by_phone: sale.soldByPhone || null,
    created_at: sale.createdAt,
    status: sale.status || "Completed",
  };
}

function mapCustomer(row: any): Customer {
  return {
    id: String(row.id),
    shop_id: String(row.shop_id),
    name: String(row.name),
    phoneNumber: String(row.phone_number),
    purchaseCount: Number(row.purchase_count || 0),
    totalSpent: Number(row.total_spent || 0),
    notes: String(row.notes || ""),
  };
}

function customerToRow(customer: Customer) {
  return {
    id: customer.id,
    shop_id: customer.shop_id,
    name: customer.name,
    phone_number: customer.phoneNumber,
    purchase_count: customer.purchaseCount,
    total_spent: customer.totalSpent,
    notes: customer.notes,
  };
}

function mapStaff(row: any): Staff {
  return {
    id: String(row.id),
    shop_id: String(row.shop_id || row.shopId || ""),
    fullName: String(row.full_name || row.fullName || "Staff Member"),
    phoneNumber: String(row.phone_number || row.phoneNumber || ""),
    role: row.role ? String(row.role) : undefined,
    status: row.status === "Suspended" ? "Suspended" : "Active",
    permissions:
      typeof row.permissions === "object" && row.permissions !== null
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

function staffToRow(member: Staff) {
  return {
    id: member.id,
    shop_id: member.shop_id,
    full_name: member.fullName,
    phone_number: member.phoneNumber,
    role: member.role || "Sales Representative",
    status: member.status,
    permissions: member.permissions,
    created_at: member.createdAt,
  };
}

function mapNotification(row: any): AppNotification {
  return {
    id: String(row.id),
    shop_id: String(row.shop_id),
    title: String(row.title),
    message: String(row.message),
    type: row.type || "info",
    read: !!row.read,
    createdAt: row.created_at || new Date().toISOString(),
  };
}

function mapAuditLog(row: any): AuditLog {
  return {
    id: String(row.id),
    shop_id: String(row.shop_id),
    userId: String(row.user_id || "Owner"),
    userName: String(row.user_name || "Owner"),
    action: String(row.action),
    details: String(row.details || ""),
    createdAt: row.created_at || new Date().toISOString(),
  };
}

// ----------------------------------------------------
// DATA LOADING: fetch all data for the active shop from Supabase
// ----------------------------------------------------
export async function loadShopData(shopId: string): Promise<void> {
  if (!supabase) return;
  currentShopId = shopId;

  try {
    const [shopsRes, productsRes, salesRes, customersRes, staffRes, notifRes, auditRes] =
      await Promise.all([
        supabase.from("shops").select("*"),
        supabase.from("products").select("*").eq("shop_id", shopId),
        supabase.from("sales").select("*").eq("shop_id", shopId).order("created_at", { ascending: false }),
        supabase.from("customers").select("*").eq("shop_id", shopId),
        supabase.from("staff").select("*").eq("shop_id", shopId),
        supabase.from("notifications").select("*").eq("shop_id", shopId).order("created_at", { ascending: false }),
        supabase.from("audit_logs").select("*").eq("shop_id", shopId).order("created_at", { ascending: false }),
      ]);

    cache.shops = (shopsRes.data || []).map(mapShop);
    cache.products = (productsRes.data || []).map(mapProduct);
    cache.sales = (salesRes.data || []).map(mapSale);
    cache.customers = (customersRes.data || []).map(mapCustomer);
    cache.staff = (staffRes.data || []).map(mapStaff);
    cache.notifications = (notifRes.data || []).map(mapNotification);
    cache.auditLogs = (auditRes.data || []).map(mapAuditLog);

    isInitialized = true;
    notifyListeners();
  } catch (err) {
    console.error("[Database] Failed to load shop data from Supabase:", err);
  }
}

// ----------------------------------------------------
// REALTIME SUBSCRIPTIONS
// Subscribes to all tenant tables and refreshes cache on change.
// This keeps multiple browser sessions in sync without refreshes.
// ----------------------------------------------------
let realtimeChannel: any = null;

export function subscribeToRealtime(shopId: string): void {
  if (!supabase || realtimeChannel) return;

  realtimeChannel = supabase
    .channel("restockr-realtime")
    .on("postgres_changes", { event: "*", schema: "public", table: "products" }, (payload: any) => {
      handleRealtimeChange("products", payload);
    })
    .on("postgres_changes", { event: "*", schema: "public", table: "sales" }, (payload: any) => {
      handleRealtimeChange("sales", payload);
    })
    .on("postgres_changes", { event: "*", schema: "public", table: "customers" }, (payload: any) => {
      handleRealtimeChange("customers", payload);
    })
    .on("postgres_changes", { event: "*", schema: "public", table: "staff" }, (payload: any) => {
      handleRealtimeChange("staff", payload);
    })
    .on("postgres_changes", { event: "*", schema: "public", table: "notifications" }, (payload: any) => {
      handleRealtimeChange("notifications", payload);
    })
    .on("postgres_changes", { event: "*", schema: "public", table: "audit_logs" }, (payload: any) => {
      handleRealtimeChange("audit_logs", payload);
    })
    .subscribe();
}

export function unsubscribeFromRealtime(): void {
  if (realtimeChannel && supabase) {
    supabase.removeChannel(realtimeChannel);
    realtimeChannel = null;
  }
}

function handleRealtimeChange(table: string, payload: any): void {
  const eventType = payload.eventType;
  const newRow = payload.new;
  const oldRow = payload.old;

  if (eventType === "INSERT" && newRow) {
    if (table === "products" && (!currentShopId || newRow.shop_id === currentShopId)) {
      cache.products = [mapProduct(newRow), ...cache.products];
    } else if (table === "sales" && (!currentShopId || newRow.shop_id === currentShopId)) {
      cache.sales = [mapSale(newRow), ...cache.sales];
    } else if (table === "customers" && (!currentShopId || newRow.shop_id === currentShopId)) {
      cache.customers = [mapCustomer(newRow), ...cache.customers];
    } else if (table === "staff" && (!currentShopId || newRow.shop_id === currentShopId)) {
      cache.staff = [mapStaff(newRow), ...cache.staff];
    } else if (table === "notifications" && (!currentShopId || newRow.shop_id === currentShopId)) {
      cache.notifications = [mapNotification(newRow), ...cache.notifications];
    } else if (table === "audit_logs" && (!currentShopId || newRow.shop_id === currentShopId)) {
      cache.auditLogs = [mapAuditLog(newRow), ...cache.auditLogs];
    }
  } else if (eventType === "UPDATE" && newRow) {
    if (table === "products") {
      cache.products = cache.products.map((p) => (p.id === newRow.id ? mapProduct(newRow) : p));
    } else if (table === "sales") {
      cache.sales = cache.sales.map((s) => (s.id === newRow.id ? mapSale(newRow) : s));
    } else if (table === "customers") {
      cache.customers = cache.customers.map((c) => (c.id === newRow.id ? mapCustomer(newRow) : c));
    } else if (table === "staff") {
      cache.staff = cache.staff.map((s) => (s.id === newRow.id ? mapStaff(newRow) : s));
    } else if (table === "notifications") {
      cache.notifications = cache.notifications.map((n) => (n.id === newRow.id ? mapNotification(newRow) : n));
    } else if (table === "shops") {
      cache.shops = cache.shops.map((s) => (s.id === newRow.id ? mapShop(newRow) : s));
    }
  } else if (eventType === "DELETE" && oldRow) {
    if (table === "products") {
      cache.products = cache.products.filter((p) => p.id !== oldRow.id);
    } else if (table === "sales") {
      cache.sales = cache.sales.filter((s) => s.id !== oldRow.id);
    } else if (table === "customers") {
      cache.customers = cache.customers.filter((c) => c.id !== oldRow.id);
    } else if (table === "staff") {
      cache.staff = cache.staff.filter((s) => s.id !== oldRow.id);
    } else if (table === "notifications") {
      cache.notifications = cache.notifications.filter((n) => n.id !== oldRow.id);
    } else if (table === "audit_logs") {
      cache.auditLogs = cache.auditLogs.filter((l) => l.id !== oldRow.id);
    }
  }

  notifyListeners();
}

// ----------------------------------------------------
// AUTH: Shop Username login backed by Supabase Auth
// Uses synthetic email: <username>@restockr.app
// Preserves the existing "Shop Username + Password" UX
// ----------------------------------------------------
export async function signInWithShopCredentials(
  username: string,
  password: string
): Promise<{ success: boolean; shop: Shop | null; error: string }> {
  if (!supabase) return { success: false, shop: null, error: "Database not configured." };

  const email = `${username.trim().toLowerCase()}@restockr.app`;

  try {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      return { success: false, shop: null, error: error.message };
    }

    if (!data.user) {
      return { success: false, shop: null, error: "Authentication failed." };
    }

    // Fetch the shop owned by this user
    const { data: shopRow, error: shopErr } = await supabase
      .from("shops")
      .select("*")
      .eq("owner_user_id", data.user.id)
      .maybeSingle();

    if (shopErr || !shopRow) {
      return { success: false, shop: null, error: "No registered shop found for this shop username." };
    }

    const shop = mapShop(shopRow);
    return { success: true, shop, error: "" };
  } catch (err: any) {
    return { success: false, shop: null, error: err.message || "Login failed." };
  }
}

export async function registerShopWithCredentials(params: {
  shopName: string;
  slug: string;
  username: string;
  password: string;
  whatsappNumber: string;
}): Promise<{ success: boolean; shop: Shop | null; error: string }> {
  if (!supabase) return { success: false, shop: null, error: "Database not configured." };

  const email = `${params.username.trim().toLowerCase()}@restockr.app`;

  try {
    // 1. Check slug uniqueness
    const { data: existingSlug } = await supabase
      .from("shops")
      .select("id")
      .eq("slug", params.slug.trim().toLowerCase())
      .maybeSingle();

    if (existingSlug) {
      return { success: false, shop: null, error: "This store link / subdomain is already taken." };
    }

    // 2. Check username uniqueness (by checking if auth email already exists)
    const { data: existingUser } = await supabase
      .from("shops")
      .select("id")
      .eq("owner_username", params.username.trim().toLowerCase())
      .maybeSingle();

    if (existingUser) {
      return { success: false, shop: null, error: "An account with this shop username already exists." };
    }

    // 3. Create auth user
    const { data: authData, error: authErr } = await supabase.auth.signUp({ email, password: params.password });
    if (authErr || !authData.user) {
      return { success: false, shop: null, error: authErr?.message || "Failed to create account." };
    }

    const userId = authData.user.id;
    const shopId = `shop-${Date.now()}`;
    const newShop: Shop = {
      id: shopId,
      name: params.shopName.trim(),
      slug: params.slug.trim().toLowerCase(),
      ownerUsername: params.username.trim().toLowerCase(),
      whatsappNumber: params.whatsappNumber.trim(),
      subscriptionPlan: "Free Trial",
      subscriptionStatus: "Active",
      subscriptionExpiry: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      websiteSettings: {
        showPrices: true,
        showSoldProducts: true,
        enableVideoDownloads: true,
        enableImageDownloads: true,
        customThemeColor: "#0F172A",
      },
      createdAt: new Date().toISOString(),
    };

    // 4. Insert shop with owner_user_id
    const { error: shopInsertErr } = await supabase.from("shops").insert({
      ...shopToRow(newShop),
      owner_user_id: userId,
    });

    if (shopInsertErr) {
      return { success: false, shop: null, error: shopInsertErr.message };
    }

    // 5. Add audit log + notification
    await supabase.from("audit_logs").insert({
      id: `log-${Date.now()}`,
      shop_id: shopId,
      user_id: "Owner",
      user_name: "Owner",
      action: "Shop Setup",
      details: `Restockr account for ${newShop.name} was successfully registered and initialized.`,
    });

    await supabase.from("notifications").insert({
      id: `notif-${Date.now()}`,
      shop_id: shopId,
      title: "Welcome to Restockr",
      message: `Welcome to Restockr, ${newShop.name}! Your workspace is active and ready for devices.`,
      type: "success",
      read: false,
    });

    return { success: true, shop: newShop, error: "" };
  } catch (err: any) {
    return { success: false, shop: null, error: err.message || "Registration failed." };
  }
}

export async function signOutFromSupabase(): Promise<void> {
  if (supabase) {
    await supabase.auth.signOut();
  }
}

// Auth state listener — only fires callback on SIGNED_OUT, ignores token refresh
export function onAuthStateChange(callback: (event: string, session: any) => void): () => void {
  if (!supabase) return () => {};
  const { data } = supabase.auth.onAuthStateChange((event, session) => {
    callback(event, session);
  });
  return () => data.subscription.unsubscribe();
}

export async function restoreSession(): Promise<{ shop: Shop | null }> {
  if (!supabase) return { shop: null };

  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session || !session.user) return { shop: null };

    const { data: shopRow } = await supabase
      .from("shops")
      .select("*")
      .eq("owner_user_id", session.user.id)
      .maybeSingle();

    if (!shopRow) return { shop: null };
    return { shop: mapShop(shopRow) };
  } catch {
    return { shop: null };
  }
}

// ----------------------------------------------------
// SYNC HELPERS (kept for backward compat with App.tsx)
// ----------------------------------------------------
export async function syncStaffWithSupabase(shopId: string): Promise<Staff[]> {
  await loadShopData(shopId);
  return cache.staff.filter((s) => s.shop_id === shopId);
}

// ----------------------------------------------------
// PUBLIC DB API (synchronous reads from cache, async writes to Supabase)
// ----------------------------------------------------
export const db = {
  // ---- SHOPS ----
  getShops: (): Shop[] => cache.shops,

  getShopBySlug: (slug: string): Shop | undefined =>
    cache.shops.find((s) => s.slug.toLowerCase() === slug.toLowerCase()),

  getShopById: (id: string): Shop | undefined =>
    cache.shops.find((s) => s.id === id),

  saveShop: async (shop: Shop): Promise<void> => {
    if (!supabase) return;
    const { data: { session } } = await supabase.auth.getSession();
    const ownerUserId = session?.user?.id;

    const { error } = await supabase.from("shops").upsert({
      ...shopToRow(shop),
      owner_user_id: ownerUserId,
    }, { onConflict: "id" });

    if (error) {
      console.error("[Database] Failed to save shop:", error.message);
      return;
    }

    // Update cache
    const idx = cache.shops.findIndex((s) => s.id === shop.id);
    if (idx >= 0) {
      cache.shops[idx] = shop;
    } else {
      cache.shops.push(shop);
    }
    notifyListeners();
  },

  updateShopSettings: async (shopId: string, settings: Shop["websiteSettings"]): Promise<void> => {
    if (!supabase) return;
    const { error } = await supabase
      .from("shops")
      .update({ website_settings: settings })
      .eq("id", shopId);

    if (error) {
      console.error("[Database] Failed to update shop settings:", error.message);
      return;
    }

    const idx = cache.shops.findIndex((s) => s.id === shopId);
    if (idx >= 0) {
      cache.shops[idx] = { ...cache.shops[idx], websiteSettings: settings };
    }
    await db.addAuditLog(shopId, "Owner", "Owner", "Website Settings Updated", "Updated custom reseller website preferences.");
    notifyListeners();
  },

  updateShopProfile: async (shopId: string, profile: {
    name: string;
    businessAddress?: string;
    businessPhone?: string;
    logoUrl?: string;
    whatsappNumber: string;
  }): Promise<void> => {
    if (!supabase) return;
    const { error } = await supabase
      .from("shops")
      .update({
        name: profile.name,
        business_address: profile.businessAddress || null,
        business_phone: profile.businessPhone || null,
        logo_url: profile.logoUrl || null,
        whatsapp_number: profile.whatsappNumber,
      })
      .eq("id", shopId);

    if (error) {
      console.error("[Database] Failed to update shop profile:", error.message);
      return;
    }

    const idx = cache.shops.findIndex((s) => s.id === shopId);
    if (idx >= 0) {
      cache.shops[idx] = {
        ...cache.shops[idx],
        name: profile.name,
        businessAddress: profile.businessAddress,
        businessPhone: profile.businessPhone,
        logoUrl: profile.logoUrl,
        whatsappNumber: profile.whatsappNumber,
      };
    }
    await db.addAuditLog(shopId, "Owner", "Owner", "Business Profile Updated", `Updated business profile details for ${profile.name}.`);
    notifyListeners();
  },

  // ---- PRODUCTS ----
  getProducts: (shopId: string): Product[] =>
    cache.products.filter((p) => p.shop_id === shopId),

  getProductById: (id: string): Product | undefined =>
    cache.products.find((p) => p.id === id),

  getResolvedVideoUrl: (product: Product): string => {
    return product.productVideo || "";
  },

  saveProduct: async (product: Product, performer: string = "Owner"): Promise<void> => {
    if (!supabase) return;

    // Clean up blob: URLs in images
    if (product.productImages && product.productImages.length > 0) {
      product.productImages = product.productImages.map((img) =>
        img.startsWith("blob:")
          ? "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&q=80&w=600"
          : img
      );
    }

    const { error } = await supabase
      .from("products")
      .upsert(productToRow(product), { onConflict: "id" });

    if (error) {
      console.error("[Database] Failed to save product:", error.message);
      throw new Error(`Failed to save product: ${error.message}`);
    }

    const idx = cache.products.findIndex((p) => p.id === product.id);
    const isEdit = idx >= 0;
    if (isEdit) {
      cache.products[idx] = product;
    } else {
      cache.products = [product, ...cache.products];
    }

    if (performer !== "Owner") {
      await db.addNotification(
        product.shop_id,
        isEdit ? "Staff Edited Product" : "Staff Added Product",
        `Staff member ${performer} ${isEdit ? "edited" : "added"} product: ${product.brand} ${product.model} (${product.storage})`,
        "info"
      );
    }
    notifyListeners();
  },

  deleteProduct: async (shopId: string, id: string): Promise<void> => {
    if (!supabase) return;

    const target = cache.products.find((p) => p.id === id && p.shop_id === shopId);
    if (target && target.productVideo && target.productVideo.includes("supabase.co")) {
      deleteFileFromSupabase(target.productVideo).catch((err) =>
        console.warn("[Database] Supabase video deletion failed:", err)
      );
    }

    const { error } = await supabase.from("products").delete().eq("id", id).eq("shop_id", shopId);
    if (error) {
      console.error("[Database] Failed to delete product:", error.message);
      return;
    }

    cache.products = cache.products.filter((p) => p.id !== id);
    notifyListeners();
  },

  // ---- SALES ----
  getSales: (shopId: string): Sale[] =>
    cache.sales.filter((s) => s.shop_id === shopId),

  saveSale: async (sale: Sale): Promise<void> => {
    if (!supabase) return;

    const saleWithStatus = { ...sale, status: "Completed" as const };

    const { error } = await supabase
      .from("sales")
      .insert(saleToRow(saleWithStatus));

    if (error) {
      console.error("[Database] Failed to save sale:", error.message);
      return;
    }

    cache.sales = [saleWithStatus, ...cache.sales];

    // Update product inventory
    const prodIdx = cache.products.findIndex((p) => p.id === sale.productId);
    if (prodIdx >= 0) {
      const updatedProduct = {
        ...cache.products[prodIdx],
        quantity: 0,
        status: "SOLD" as const,
        sold_at: sale.createdAt || new Date().toISOString(),
      };
      cache.products[prodIdx] = updatedProduct;
      await supabase
        .from("products")
        .update({ quantity: 0, status: "SOLD", sold_at: updatedProduct.sold_at })
        .eq("id", sale.productId);
    }

    // Update or create customer
    const normalizedPhone = sale.customerPhone.replace(/\s+/g, "");
    const custIdx = cache.customers.findIndex(
      (c) => c.phoneNumber.replace(/\s+/g, "") === normalizedPhone && c.shop_id === sale.shop_id
    );

    if (custIdx >= 0) {
      const updatedCustomer = {
        ...cache.customers[custIdx],
        purchaseCount: cache.customers[custIdx].purchaseCount + 1,
        totalSpent: cache.customers[custIdx].totalSpent + sale.totalAmount,
        notes: cache.customers[custIdx].notes.includes(sale.productName)
          ? cache.customers[custIdx].notes
          : `${cache.customers[custIdx].notes} | Bought ${sale.productName}`,
      };
      cache.customers[custIdx] = updatedCustomer;
      await supabase.from("customers").update({
        purchase_count: updatedCustomer.purchaseCount,
        total_spent: updatedCustomer.totalSpent,
        notes: updatedCustomer.notes,
      }).eq("id", updatedCustomer.id);
    } else if (sale.customerName) {
      const newCustomer: Customer = {
        id: `cust-${Date.now()}`,
        shop_id: sale.shop_id,
        name: sale.customerName,
        phoneNumber: sale.customerPhone,
        purchaseCount: 1,
        totalSpent: sale.totalAmount,
        notes: `Bought ${sale.productName}`,
      };
      cache.customers = [...cache.customers, newCustomer];
      await supabase.from("customers").insert(customerToRow(newCustomer));
    }

    // Audit log + notification
    await db.addAuditLog(
      sale.shop_id,
      sale.soldBy,
      sale.soldByPhone || "Owner",
      "Sale Completed",
      `Completed sale for ${sale.quantity}x ${sale.productName} (₦${sale.totalAmount.toLocaleString()}) to ${sale.customerName || "Walk-in Customer"}`
    );

    await db.addNotification(
      sale.shop_id,
      "Sale Completed",
      `${sale.soldBy} sold ${sale.productName} for ₦${sale.totalAmount.toLocaleString()}`,
      "success"
    );

    if (sale.soldBy !== "Owner") {
      await db.addNotification(
        sale.shop_id,
        "Staff Logged Sale",
        `Staff member ${sale.soldBy} recorded a sale of ${sale.quantity}x ${sale.productName} for ₦${sale.totalAmount.toLocaleString()}`,
        "info"
      );
    }

    notifyListeners();
  },

  undoSale: async (shopId: string, saleId: string, performedBy: string): Promise<{ success: boolean; message: string }> => {
    if (!supabase) return { success: false, message: "Database not configured." };

    try {
      const sale = cache.sales.find((s) => s.id === saleId && s.shop_id === shopId);
      if (!sale) {
        return { success: false, message: "Sale transaction record not found." };
      }

      if (sale.status === "Reversed") {
        return { success: false, message: "Transaction already reversed previously." };
      }

      if (performedBy !== "Owner") {
        return { success: false, message: "Access Denied: Only the store Owner is authorized to reverse sales transactions." };
      }

      const saleDate = new Date(sale.createdAt);
      const now = new Date();
      const diffDays = Math.ceil(Math.abs(now.getTime() - saleDate.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays > 30) {
        return { success: false, message: "Time-limit Exceeded: This sale is over 30 days old and cannot be reversed." };
      }

      // Restore product
      const prodIdx = cache.products.findIndex((p) => p.id === sale.productId);
      if (prodIdx >= 0) {
        const restoredProduct = {
          ...cache.products[prodIdx],
          quantity: (cache.products[prodIdx].quantity || 0) + (sale.quantity || 1),
          status: "Available" as const,
        };
        const { sold_at, ...productWithoutSoldAt } = restoredProduct;
        cache.products[prodIdx] = productWithoutSoldAt as Product;
        await supabase
          .from("products")
          .update({ quantity: productWithoutSoldAt.quantity, status: "Available", sold_at: null })
          .eq("id", sale.productId);
      }

      // Deduct from customer
      const custIdx = cache.customers.findIndex(
        (c) => c.phoneNumber && sale.customerPhone && c.phoneNumber.replace(/\s+/g, "") === sale.customerPhone.replace(/\s+/g, "") && c.shop_id === shopId
      );
      if (custIdx >= 0) {
        const updatedCustomer = {
          ...cache.customers[custIdx],
          purchaseCount: Math.max(0, cache.customers[custIdx].purchaseCount - 1),
          totalSpent: Math.max(0, cache.customers[custIdx].totalSpent - sale.totalAmount),
        };
        cache.customers[custIdx] = updatedCustomer;
        await supabase.from("customers").update({
          purchase_count: updatedCustomer.purchaseCount,
          total_spent: updatedCustomer.totalSpent,
        }).eq("id", updatedCustomer.id);
      }

      // Mark sale as reversed
      const reversedSale = { ...sale, status: "Reversed" as const };
      const saleIdx = cache.sales.findIndex((s) => s.id === saleId);
      if (saleIdx >= 0) {
        cache.sales[saleIdx] = reversedSale;
      }
      await supabase.from("sales").update({ status: "Reversed" }).eq("id", saleId);

      await db.addAuditLog(
        shopId,
        performedBy,
        "System",
        "Sale Reversed",
        `Reversed sale receipt #${sale.id.slice(0, 8)} of ${sale.productName} (₦${sale.totalAmount.toLocaleString()}). Stock quantity restored.`
      );

      await db.addNotification(
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

  // ---- CUSTOMERS ----
  getCustomers: (shopId: string): Customer[] =>
    cache.customers.filter((c) => c.shop_id === shopId),

  saveCustomer: async (customer: Customer): Promise<void> => {
    if (!supabase) return;

    const { error } = await supabase
      .from("customers")
      .upsert(customerToRow(customer), { onConflict: "id" });

    if (error) {
      console.error("[Database] Failed to save customer:", error.message);
      return;
    }

    const idx = cache.customers.findIndex((c) => c.id === customer.id);
    if (idx >= 0) {
      cache.customers[idx] = customer;
    } else {
      cache.customers.push(customer);
    }
    notifyListeners();
  },

  // ---- STAFF ----
  getStaff: (shopId: string): Staff[] =>
    cache.staff.filter((s) => s.shop_id === shopId),

  saveStaff: async (member: Staff): Promise<void> => {
    if (!supabase) return;

    const { error } = await supabase
      .from("staff")
      .upsert(staffToRow(member), { onConflict: "id" });

    if (error) {
      console.error("[Database] Failed to save staff:", error.message);
      return;
    }

    const idx = cache.staff.findIndex((s) => s.id === member.id);
    if (idx >= 0) {
      cache.staff[idx] = member;
    } else {
      cache.staff.push(member);
    }

    await db.addAuditLog(
      member.shop_id,
      "Owner",
      "Owner",
      "Staff Profile Updated",
      `Staff member ${member.fullName} (${member.phoneNumber}) status updated to ${member.status}.`
    );
    notifyListeners();
  },

  deleteStaff: async (shopId: string, id: string): Promise<void> => {
    if (!supabase) return;

    const member = cache.staff.find((s) => s.id === id);

    const { error } = await supabase.from("staff").delete().eq("id", id).eq("shop_id", shopId);
    if (error) {
      console.error("[Database] Failed to delete staff:", error.message);
      return;
    }

    cache.staff = cache.staff.filter((s) => s.id !== id);

    if (member) {
      await db.addAuditLog(
        shopId,
        "Owner",
        "Owner",
        "Staff Removed",
        `Removed staff member ${member.fullName} (${member.phoneNumber}).`
      );
    }
    notifyListeners();
  },

  // ---- AUDIT LOGS ----
  getAuditLogs: (shopId: string): AuditLog[] =>
    cache.auditLogs.filter((l) => l.shop_id === shopId),

  addAuditLog: async (shopId: string, userName: string, userId: string, action: string, details: string): Promise<void> => {
    if (!supabase) return;

    const log: AuditLog = {
      id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      shop_id: shopId,
      userId,
      userName,
      action,
      details,
      createdAt: new Date().toISOString(),
    };

    const { error } = await supabase.from("audit_logs").insert({
      id: log.id,
      shop_id: log.shop_id,
      user_id: log.userId,
      user_name: log.userName,
      action: log.action,
      details: log.details,
    });

    if (error) {
      console.error("[Database] Failed to insert audit log:", error.message);
      return;
    }

    cache.auditLogs = [log, ...cache.auditLogs];
  },

  // ---- NOTIFICATIONS ----
  getNotifications: (shopId: string): AppNotification[] =>
    cache.notifications.filter((n) => n.shop_id === shopId),

  addNotification: async (shopId: string, title: string, message: string, type: "info" | "success" | "warning" | "error"): Promise<void> => {
    if (!supabase) return;

    const notif: AppNotification = {
      id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      shop_id: shopId,
      title,
      message,
      type,
      read: false,
      createdAt: new Date().toISOString(),
    };

    const { error } = await supabase.from("notifications").insert({
      id: notif.id,
      shop_id: notif.shop_id,
      title: notif.title,
      message: notif.message,
      type: notif.type,
      read: notif.read,
    });

    if (error) {
      console.error("[Database] Failed to insert notification:", error.message);
      return;
    }

    cache.notifications = [notif, ...cache.notifications];
    notifyListeners();
  },

  markNotificationsAsRead: async (shopId: string): Promise<void> => {
    if (!supabase) return;

    const { error } = await supabase
      .from("notifications")
      .update({ read: true })
      .eq("shop_id", shopId)
      .eq("read", false);

    if (error) {
      console.error("[Database] Failed to mark notifications as read:", error.message);
      return;
    }

    cache.notifications = cache.notifications.map((n) =>
      n.shop_id === shopId ? { ...n, read: true } : n
    );
    notifyListeners();
  },

  // ---- PASSWORDS (deprecated — now handled by Supabase Auth) ----
  getPasswords: (): Record<string, string> => ({}),
  savePassword: (_username: string, _password: string): void => {
    // No-op: passwords are now managed by Supabase Auth
  },
};
