import { Category } from "../types";

export interface DeviceModel {
  name: string;
  brand: string;
  category: Category;
  storages: string[];
  hasBatteryHealth: boolean;
  rams?: string[];
  colors?: string[];
}

export const CATEGORY_BRANDS: Record<Category, string[]> = {
  [Category.Phones]: [
    "Apple", "Samsung", "Tecno", "Infinix", "itel", "Xiaomi", "Redmi", "Poco", 
    "Oppo", "Vivo", "Huawei", "Google Pixel", "OnePlus", "Nothing", "Motorola", "Honor", "Realme"
  ],
  [Category.Tablets]: [
    "Apple", "Samsung", "Lenovo", "Huawei", "Microsoft", "Amazon", "Xiaomi"
  ],
  [Category.Laptops]: [
    "Apple", "HP", "Dell", "Lenovo", "ASUS", "Acer", "MSI", "Huawei", "Microsoft", "Samsung"
  ],
  [Category.SmartWatches]: [
    "Apple", "Samsung", "Huawei", "Google", "Garmin", "Fitbit", "Amazfit", "Xiaomi"
  ],
  [Category.GameConsoles]: [
    "Sony PlayStation", "Microsoft Xbox", "Nintendo"
  ],
  [Category.Accessories]: [
    "Apple", "Samsung", "Oraimo", "Anker", "JBL", "Other"
  ]
};

// Map display brands so the user sees premium short business friendly labels or literal names
export const BRAND_DISPLAY_NAMES: Record<string, string> = {
  "Apple": "Apple",
  "Samsung": "Samsung",
  "Tecno": "Tecno",
  "Infinix": "Infinix",
  "itel": "itel",
  "Xiaomi": "Xiaomi",
  "Redmi": "Redmi",
  "Poco": "Poco",
  "Oppo": "Oppo",
  "Vivo": "Vivo",
  "Huawei": "Huawei",
  "Google Pixel": "Google Pixel",
  "OnePlus": "OnePlus",
  "Nothing": "Nothing",
  "Motorola": "Motorola",
  "Honor": "Honor",
  "Realme": "Realme",
  "Sony PlayStation": "PlayStation",
  "Microsoft Xbox": "Xbox",
  "Nintendo": "Nintendo"
};

export const DEVICE_DATABASE: DeviceModel[] = [
  // ================= APPLE PHONES (ALL OFFICIAL SECTIONS) =================
  { name: "iPhone (Original)", brand: "Apple", category: Category.Phones, storages: ["4GB", "8GB", "16GB"], hasBatteryHealth: true },
  { name: "iPhone 3G", brand: "Apple", category: Category.Phones, storages: ["8GB", "16GB"], hasBatteryHealth: true },
  { name: "iPhone 3GS", brand: "Apple", category: Category.Phones, storages: ["8GB", "16GB", "32GB"], hasBatteryHealth: true },
  { name: "iPhone 4", brand: "Apple", category: Category.Phones, storages: ["8GB", "16GB", "32GB"], hasBatteryHealth: true },
  { name: "iPhone 4S", brand: "Apple", category: Category.Phones, storages: ["8GB", "16GB", "32GB", "64GB"], hasBatteryHealth: true },
  { name: "iPhone 5", brand: "Apple", category: Category.Phones, storages: ["16GB", "32GB", "64GB"], hasBatteryHealth: true },
  { name: "iPhone 5c", brand: "Apple", category: Category.Phones, storages: ["8GB", "16GB", "32GB"], hasBatteryHealth: true },
  { name: "iPhone 5s", brand: "Apple", category: Category.Phones, storages: ["16GB", "32GB", "64GB"], hasBatteryHealth: true },
  { name: "iPhone 6", brand: "Apple", category: Category.Phones, storages: ["16GB", "32GB", "64GB", "128GB"], hasBatteryHealth: true },
  { name: "iPhone 6 Plus", brand: "Apple", category: Category.Phones, storages: ["16GB", "64GB", "128GB"], hasBatteryHealth: true },
  { name: "iPhone 6s", brand: "Apple", category: Category.Phones, storages: ["16GB", "32GB", "64GB", "128GB"], hasBatteryHealth: true },
  { name: "iPhone 6s Plus", brand: "Apple", category: Category.Phones, storages: ["16GB", "32GB", "64GB", "128GB"], hasBatteryHealth: true },
  { name: "iPhone SE (1st Gen)", brand: "Apple", category: Category.Phones, storages: ["16GB", "32GB", "64GB", "128GB"], hasBatteryHealth: true },
  { name: "iPhone 7", brand: "Apple", category: Category.Phones, storages: ["32GB", "128GB", "256GB"], hasBatteryHealth: true },
  { name: "iPhone 7 Plus", brand: "Apple", category: Category.Phones, storages: ["32GB", "128GB", "256GB"], hasBatteryHealth: true },
  { name: "iPhone 8", brand: "Apple", category: Category.Phones, storages: ["64GB", "128GB", "256GB"], hasBatteryHealth: true },
  { name: "iPhone 8 Plus", brand: "Apple", category: Category.Phones, storages: ["64GB", "128GB", "256GB"], hasBatteryHealth: true },
  { name: "iPhone SE (2nd Gen)", brand: "Apple", category: Category.Phones, storages: ["64GB", "128GB", "256GB"], hasBatteryHealth: true },
  { name: "iPhone SE (3rd Gen)", brand: "Apple", category: Category.Phones, storages: ["64GB", "128GB", "256GB"], hasBatteryHealth: true },
  { name: "iPhone X", brand: "Apple", category: Category.Phones, storages: ["64GB", "256GB"], hasBatteryHealth: true },
  { name: "iPhone XS", brand: "Apple", category: Category.Phones, storages: ["64GB", "256GB", "512GB"], hasBatteryHealth: true },
  { name: "iPhone XS Max", brand: "Apple", category: Category.Phones, storages: ["64GB", "256GB", "512GB"], hasBatteryHealth: true },
  { name: "iPhone XR", brand: "Apple", category: Category.Phones, storages: ["64GB", "128GB", "256GB"], hasBatteryHealth: true },
  { name: "iPhone 11", brand: "Apple", category: Category.Phones, storages: ["64GB", "128GB", "256GB"], hasBatteryHealth: true },
  { name: "iPhone 11 Pro", brand: "Apple", category: Category.Phones, storages: ["64GB", "256GB", "512GB"], hasBatteryHealth: true },
  { name: "iPhone 11 Pro Max", brand: "Apple", category: Category.Phones, storages: ["64GB", "256GB", "512GB"], hasBatteryHealth: true },
  { name: "iPhone 12 Mini", brand: "Apple", category: Category.Phones, storages: ["64GB", "128GB", "256GB"], hasBatteryHealth: true },
  { name: "iPhone 12", brand: "Apple", category: Category.Phones, storages: ["64GB", "128GB", "256GB"], hasBatteryHealth: true },
  { name: "iPhone 12 Pro", brand: "Apple", category: Category.Phones, storages: ["128GB", "256GB", "512GB"], hasBatteryHealth: true },
  { name: "iPhone 12 Pro Max", brand: "Apple", category: Category.Phones, storages: ["128GB", "256GB", "512GB"], hasBatteryHealth: true },
  { name: "iPhone 13 Mini", brand: "Apple", category: Category.Phones, storages: ["128GB", "256GB", "512GB"], hasBatteryHealth: true },
  { name: "iPhone 13", brand: "Apple", category: Category.Phones, storages: ["128GB", "256GB", "512GB"], hasBatteryHealth: true },
  { name: "iPhone 13 Pro", brand: "Apple", category: Category.Phones, storages: ["128GB", "256GB", "512GB", "1TB"], hasBatteryHealth: true },
  { name: "iPhone 13 Pro Max", brand: "Apple", category: Category.Phones, storages: ["128GB", "256GB", "512GB", "1TB"], hasBatteryHealth: true },
  { name: "iPhone 14", brand: "Apple", category: Category.Phones, storages: ["128GB", "256GB", "512GB"], hasBatteryHealth: true },
  { name: "iPhone 14 Plus", brand: "Apple", category: Category.Phones, storages: ["128GB", "256GB", "512GB"], hasBatteryHealth: true },
  { name: "iPhone 14 Pro", brand: "Apple", category: Category.Phones, storages: ["128GB", "256GB", "512GB", "1TB"], hasBatteryHealth: true },
  { name: "iPhone 14 Pro Max", brand: "Apple", category: Category.Phones, storages: ["128GB", "256GB", "512GB", "1TB"], hasBatteryHealth: true },
  { name: "iPhone 15", brand: "Apple", category: Category.Phones, storages: ["128GB", "256GB", "512GB"], hasBatteryHealth: true },
  { name: "iPhone 15 Plus", brand: "Apple", category: Category.Phones, storages: ["128GB", "256GB", "512GB"], hasBatteryHealth: true },
  { name: "iPhone 15 Pro", brand: "Apple", category: Category.Phones, storages: ["128GB", "256GB", "512GB", "1TB"], hasBatteryHealth: true },
  { name: "iPhone 15 Pro Max", brand: "Apple", category: Category.Phones, storages: ["256GB", "512GB", "1TB"], hasBatteryHealth: true },
  { name: "iPhone 16", brand: "Apple", category: Category.Phones, storages: ["128GB", "256GB", "512GB"], hasBatteryHealth: true },
  { name: "iPhone 16 Plus", brand: "Apple", category: Category.Phones, storages: ["128GB", "256GB", "512GB"], hasBatteryHealth: true },
  { name: "iPhone 16 Pro", brand: "Apple", category: Category.Phones, storages: ["128GB", "256GB", "512GB", "1TB"], hasBatteryHealth: true },
  { name: "iPhone 16 Pro Max", brand: "Apple", category: Category.Phones, storages: ["256GB", "512GB", "1TB"], hasBatteryHealth: true },
  { name: "iPhone 17", brand: "Apple", category: Category.Phones, storages: ["128GB", "256GB", "512GB"], hasBatteryHealth: true },
  { name: "iPhone 17 Slim", brand: "Apple", category: Category.Phones, storages: ["128GB", "256GB", "512GB"], hasBatteryHealth: true },
  { name: "iPhone 17 Pro", brand: "Apple", category: Category.Phones, storages: ["128GB", "256GB", "512GB", "1TB"], hasBatteryHealth: true },
  { name: "iPhone 17 Pro Max", brand: "Apple", category: Category.Phones, storages: ["256GB", "512GB", "1TB"], hasBatteryHealth: true },

  // ================= SAMSUNG PHONES =================
  // --- Galaxy S Series ---
  { name: "Galaxy S (Original)", brand: "Samsung", category: Category.Phones, storages: ["8GB", "16GB"], hasBatteryHealth: false, rams: ["512MB"], colors: ["Metallic Black", "Ceramic White"] },
  { name: "Galaxy S2", brand: "Samsung", category: Category.Phones, storages: ["16GB", "32GB"], hasBatteryHealth: false, rams: ["1GB"], colors: ["Noble Black", "Ceramic White", "Marble White"] },
  { name: "Galaxy S3", brand: "Samsung", category: Category.Phones, storages: ["16GB", "32GB", "64GB"], hasBatteryHealth: false, rams: ["1GB", "2GB"], colors: ["Pebble Blue", "Marble White", "Amber Brown"] },
  { name: "Galaxy S4", brand: "Samsung", category: Category.Phones, storages: ["16GB", "32GB", "64GB"], hasBatteryHealth: false, rams: ["2GB"], colors: ["White Frost", "Black Mist", "Blue Arctic"] },
  { name: "Galaxy S5", brand: "Samsung", category: Category.Phones, storages: ["16GB", "32GB"], hasBatteryHealth: false, rams: ["2GB"], colors: ["Charcoal Black", "Shimmery White", "Electric Blue", "Copper Gold"] },
  { name: "Galaxy S6", brand: "Samsung", category: Category.Phones, storages: ["32GB", "64GB", "128GB"], hasBatteryHealth: false, rams: ["3GB"], colors: ["White Pearl", "Black Sapphire", "Gold Platinum", "Blue Topaz"] },
  { name: "Galaxy S6 Edge", brand: "Samsung", category: Category.Phones, storages: ["32GB", "64GB", "128GB"], hasBatteryHealth: false, rams: ["3GB"], colors: ["White Pearl", "Black Sapphire", "Gold Platinum", "Emerald Green"] },
  { name: "Galaxy S7", brand: "Samsung", category: Category.Phones, storages: ["32GB", "64GB"], hasBatteryHealth: false, rams: ["4GB"], colors: ["Black Onyx", "Gold Platinum", "White Pearl", "Silver Titanium"] },
  { name: "Galaxy S7 Edge", brand: "Samsung", category: Category.Phones, storages: ["32GB", "64GB"], hasBatteryHealth: false, rams: ["4GB"], colors: ["Black Onyx", "Gold Platinum", "Silver Titanium", "Blue Coral"] },
  { name: "Galaxy S8", brand: "Samsung", category: Category.Phones, storages: ["64GB"], hasBatteryHealth: false, rams: ["4GB"], colors: ["Midnight Black", "Orchid Gray", "Arctic Silver", "Coral Blue", "Maple Gold"] },
  { name: "Galaxy S8+", brand: "Samsung", category: Category.Phones, storages: ["64GB", "128GB"], hasBatteryHealth: false, rams: ["4GB", "6GB"], colors: ["Midnight Black", "Orchid Gray", "Coral Blue", "Maple Gold"] },
  { name: "Galaxy S9", brand: "Samsung", category: Category.Phones, storages: ["64GB", "128GB", "256GB"], hasBatteryHealth: false, rams: ["4GB"], colors: ["Midnight Black", "Coral Blue", "Titanium Gray", "Lilac Purple"] },
  { name: "Galaxy S9+", brand: "Samsung", category: Category.Phones, storages: ["64GB", "128GB", "256GB"], hasBatteryHealth: false, rams: ["6GB"], colors: ["Midnight Black", "Coral Blue", "Titanium Gray", "Lilac Purple"] },
  { name: "Galaxy S10", brand: "Samsung", category: Category.Phones, storages: ["128GB", "512GB"], hasBatteryHealth: false, rams: ["8GB"], colors: ["Prism White", "Prism Black", "Prism Green", "Prism Blue", "Canary Yellow"] },
  { name: "Galaxy S10e", brand: "Samsung", category: Category.Phones, storages: ["128GB", "256GB"], hasBatteryHealth: false, rams: ["6GB", "8GB"], colors: ["Prism White", "Prism Black", "Prism Green", "Prism Blue", "Canary Yellow"] },
  { name: "Galaxy S10+", brand: "Samsung", category: Category.Phones, storages: ["128GB", "512GB", "1TB"], hasBatteryHealth: false, rams: ["8GB", "12GB"], colors: ["Prism White", "Prism Black", "Prism Blue", "Ceramic Black", "Ceramic White"] },
  { name: "Galaxy S20", brand: "Samsung", category: Category.Phones, storages: ["128GB"], hasBatteryHealth: false, rams: ["8GB", "12GB"], colors: ["Cosmic Grey", "Cloud Blue", "Cloud Pink", "Cloud White"] },
  { name: "Galaxy S20 FE", brand: "Samsung", category: Category.Phones, storages: ["128GB", "256GB"], hasBatteryHealth: false, rams: ["6GB", "8GB"], colors: ["Cloud Navy", "Cloud Lavender", "Cloud Mint", "Cloud Red", "Cloud White"] },
  { name: "Galaxy S20+", brand: "Samsung", category: Category.Phones, storages: ["128GB", "256GB", "512GB"], hasBatteryHealth: false, rams: ["8GB", "12GB"], colors: ["Cosmic Grey", "Cosmic Black", "Cloud Blue", "Aura Blue"] },
  { name: "Galaxy S20 Ultra", brand: "Samsung", category: Category.Phones, storages: ["128GB", "256GB", "512GB"], hasBatteryHealth: false, rams: ["12GB", "16GB"], colors: ["Cosmic Grey", "Cosmic Black", "Cloud White"] },
  { name: "Galaxy S21", brand: "Samsung", category: Category.Phones, storages: ["128GB", "256GB"], hasBatteryHealth: false, rams: ["8GB"], colors: ["Phantom Grey", "Phantom White", "Phantom Violet", "Phantom Pink"] },
  { name: "Galaxy S21 FE", brand: "Samsung", category: Category.Phones, storages: ["128GB", "256GB"], hasBatteryHealth: false, rams: ["6GB", "8GB"], colors: ["Olive", "Lavender", "White", "Graphite"] },
  { name: "Galaxy S21+", brand: "Samsung", category: Category.Phones, storages: ["128GB", "256GB"], hasBatteryHealth: false, rams: ["8GB"], colors: ["Phantom Black", "Phantom Silver", "Phantom Violet", "Phantom Gold"] },
  { name: "Galaxy S21 Ultra", brand: "Samsung", category: Category.Phones, storages: ["128GB", "256GB", "512GB"], hasBatteryHealth: false, rams: ["12GB", "16GB"], colors: ["Phantom Black", "Phantom Silver", "Phantom Titanium", "Phantom Navy"] },
  { name: "Galaxy S22", brand: "Samsung", category: Category.Phones, storages: ["128GB", "256GB"], hasBatteryHealth: false, rams: ["8GB"], colors: ["Phantom Black", "White", "Pink Gold", "Green", "Bora Purple"] },
  { name: "Galaxy S22+", brand: "Samsung", category: Category.Phones, storages: ["128GB", "256GB"], hasBatteryHealth: false, rams: ["8GB"], colors: ["Phantom Black", "Phantom White", "Green", "Pink Gold"] },
  { name: "Galaxy S22 Ultra", brand: "Samsung", category: Category.Phones, storages: ["128GB", "256GB", "512GB", "1TB"], hasBatteryHealth: false, rams: ["8GB", "12GB"], colors: ["Phantom Black", "Phantom White", "Green", "Burgundy"] },
  { name: "Galaxy S23", brand: "Samsung", category: Category.Phones, storages: ["128GB", "256GB", "512GB"], hasBatteryHealth: false, rams: ["8GB"], colors: ["Phantom Black", "Cream", "Green", "Lavender"] },
  { name: "Galaxy S23 FE", brand: "Samsung", category: Category.Phones, storages: ["128GB", "256GB"], hasBatteryHealth: false, rams: ["8GB"], colors: ["Mint", "Cream", "Graphite", "Purple"] },
  { name: "Galaxy S23+", brand: "Samsung", category: Category.Phones, storages: ["256GB", "512GB"], hasBatteryHealth: false, rams: ["8GB"], colors: ["Phantom Black", "Cream", "Green", "Lavender"] },
  { name: "Galaxy S23 Ultra", brand: "Samsung", category: Category.Phones, storages: ["256GB", "512GB", "1TB"], hasBatteryHealth: false, rams: ["8GB", "12GB"], colors: ["Phantom Black", "Cream", "Green", "Lavender", "Lime", "Sky Blue"] },
  { name: "Galaxy S24", brand: "Samsung", category: Category.Phones, storages: ["128GB", "256GB", "512GB"], hasBatteryHealth: false, rams: ["8GB"], colors: ["Onyx Black", "Marble Gray", "Cobalt Violet", "Amber Yellow"] },
  { name: "Galaxy S24 FE", brand: "Samsung", category: Category.Phones, storages: ["128GB", "256GB", "512GB"], hasBatteryHealth: false, rams: ["8GB"], colors: ["Blue", "Graphite", "Gray", "Mint", "Yellow"] },
  { name: "Galaxy S24+", brand: "Samsung", category: Category.Phones, storages: ["256GB", "512GB"], hasBatteryHealth: false, rams: ["12GB"], colors: ["Onyx Black", "Marble Gray", "Cobalt Violet", "Amber Yellow"] },
  { name: "Galaxy S24 Ultra", brand: "Samsung", category: Category.Phones, storages: ["256GB", "512GB", "1TB"], hasBatteryHealth: false, rams: ["12GB"], colors: ["Titanium Black", "Titanium Gray", "Titanium Yellow", "Titanium Violet"] },
  { name: "Galaxy S25", brand: "Samsung", category: Category.Phones, storages: ["128GB", "256GB", "512GB"], hasBatteryHealth: false, rams: ["12GB"], colors: ["Sparkling Blue", "Opal Blue", "Silver Shadow"] },
  { name: "Galaxy S25+", brand: "Samsung", category: Category.Phones, storages: ["256GB", "512GB"], hasBatteryHealth: false, rams: ["12GB"], colors: ["Sparkling Blue", "Opal Blue", "Silver Shadow"] },
  { name: "Galaxy S25 Ultra", brand: "Samsung", category: Category.Phones, storages: ["256GB", "512GB", "1TB"], hasBatteryHealth: false, rams: ["12GB", "16GB"], colors: ["Titanium Black", "Titanium Gray", "Titanium Silver", "Titanium Blue"] },
  { name: "Galaxy S22 FE", brand: "Samsung", category: Category.Phones, storages: ["128GB", "256GB"], hasBatteryHealth: false, rams: ["8GB"], colors: ["Graphite", "White", "Olive", "Lavender"] },
  { name: "Galaxy S25 FE", brand: "Samsung", category: Category.Phones, storages: ["128GB", "256GB"], hasBatteryHealth: false, rams: ["8GB", "12GB"], colors: ["Graphite", "Silver Shadow", "Blue"] },

  // --- Galaxy Note Series ---
  { name: "Galaxy Note (Original)", brand: "Samsung", category: Category.Phones, storages: ["16GB", "32GB"], hasBatteryHealth: false, rams: ["1GB"], colors: ["Carbon Blue", "Ceramic White"] },
  { name: "Galaxy Note 2", brand: "Samsung", category: Category.Phones, storages: ["16GB", "32GB", "64GB"], hasBatteryHealth: false, rams: ["2GB"], colors: ["Titanium Gray", "Marble White"] },
  { name: "Galaxy Note 3", brand: "Samsung", category: Category.Phones, storages: ["16GB", "32GB", "64GB"], hasBatteryHealth: false, rams: ["3GB"], colors: ["Classic Black", "Classic White", "Blush Pink"] },
  { name: "Galaxy Note 4", brand: "Samsung", category: Category.Phones, storages: ["32GB"], hasBatteryHealth: false, rams: ["3GB"], colors: ["Charcoal Black", "Frost White", "Bronze Gold", "Blossom Pink"] },
  { name: "Galaxy Note Edge", brand: "Samsung", category: Category.Phones, storages: ["32GB", "64GB"], hasBatteryHealth: false, rams: ["3GB"], colors: ["Charcoal Black", "Frost White"] },
  { name: "Galaxy Note 5", brand: "Samsung", category: Category.Phones, storages: ["32GB", "64GB", "128GB"], hasBatteryHealth: false, rams: ["4GB"], colors: ["Black Sapphire", "Gold Platinum", "Silver Titanium", "White Pearl"] },
  { name: "Galaxy Note 7", brand: "Samsung", category: Category.Phones, storages: ["64GB"], hasBatteryHealth: false, rams: ["4GB"], colors: ["Blue Coral", "Gold Platinum", "Silver Titanium", "Black Onyx"] },
  { name: "Galaxy Note FE", brand: "Samsung", category: Category.Phones, storages: ["64GB"], hasBatteryHealth: false, rams: ["4GB"], colors: ["Blue Coral", "Gold Platinum", "Silver Titanium", "Black Onyx"] },
  { name: "Galaxy Note 8", brand: "Samsung", category: Category.Phones, storages: ["64GB", "128GB", "256GB"], hasBatteryHealth: false, rams: ["6GB"], colors: ["Midnight Black", "Maple Gold", "Orchid Gray", "Deepsea Blue"] },
  { name: "Galaxy Note 9", brand: "Samsung", category: Category.Phones, storages: ["128GB", "512GB"], hasBatteryHealth: false, rams: ["6GB", "8GB"], colors: ["Ocean Blue", "Midnight Black", "Lavender Purple", "Metallic Copper"] },
  { name: "Galaxy Note 10", brand: "Samsung", category: Category.Phones, storages: ["256GB"], hasBatteryHealth: false, rams: ["8GB"], colors: ["Aura Glow", "Aura Black", "Aura White", "Aura Pink", "Aura Red"] },
  { name: "Galaxy Note 10 Lite", brand: "Samsung", category: Category.Phones, storages: ["128GB"], hasBatteryHealth: false, rams: ["6GB", "8GB"], colors: ["Aura Glow", "Aura Black", "Aura Red"] },
  { name: "Galaxy Note 10+", brand: "Samsung", category: Category.Phones, storages: ["256GB", "512GB"], hasBatteryHealth: false, rams: ["12GB"], colors: ["Aura Glow", "Aura Black", "Aura White", "Aura Blue"] },
  { name: "Galaxy Note 20", brand: "Samsung", category: Category.Phones, storages: ["256GB"], hasBatteryHealth: false, rams: ["8GB"], colors: ["Mystic Bronze", "Mystic Green", "Mystic Gray"] },
  { name: "Galaxy Note 20 Ultra", brand: "Samsung", category: Category.Phones, storages: ["128GB", "256GB", "512GB"], hasBatteryHealth: false, rams: ["12GB"], colors: ["Mystic Bronze", "Mystic Black", "Mystic White"] },

  // --- Galaxy M Series ---
  { name: "Galaxy M10", brand: "Samsung", category: Category.Phones, storages: ["16GB", "32GB"], hasBatteryHealth: false, rams: ["2GB", "3GB"], colors: ["Ocean Blue", "Charcoal Black"] },
  { name: "Galaxy M20", brand: "Samsung", category: Category.Phones, storages: ["32GB", "64GB"], hasBatteryHealth: false, rams: ["3GB", "4GB"], colors: ["Ocean Blue", "Charcoal Black"] },
  { name: "Galaxy M30", brand: "Samsung", category: Category.Phones, storages: ["32GB", "64GB", "128GB"], hasBatteryHealth: false, rams: ["3GB", "4GB", "6GB"], colors: ["Gradation Blue", "Gradation Black"] },
  { name: "Galaxy M40", brand: "Samsung", category: Category.Phones, storages: ["64GB", "128GB"], hasBatteryHealth: false, rams: ["4GB", "6GB"], colors: ["Midnight Blue", "Seawater Blue"] },
  { name: "Galaxy M11", brand: "Samsung", category: Category.Phones, storages: ["32GB", "64GB"], hasBatteryHealth: false, rams: ["3GB", "4GB"], colors: ["Black", "Metallic Blue", "Violet"] },
  { name: "Galaxy M21", brand: "Samsung", category: Category.Phones, storages: ["64GB", "128GB"], hasBatteryHealth: false, rams: ["4GB", "6GB"], colors: ["Midnight Blue", "Raven Black"] },
  { name: "Galaxy M31", brand: "Samsung", category: Category.Phones, storages: ["64GB", "128GB"], hasBatteryHealth: false, rams: ["6GB", "8GB"], colors: ["Ocean Blue", "Space Black", "Red"] },
  { name: "Galaxy M51", brand: "Samsung", category: Category.Phones, storages: ["128GB"], hasBatteryHealth: false, rams: ["6GB", "8GB"], colors: ["Celestial Black", "Electric Blue"] },
  { name: "Galaxy M12", brand: "Samsung", category: Category.Phones, storages: ["32GB", "64GB", "128GB"], hasBatteryHealth: false, rams: ["3GB", "4GB", "6GB"], colors: ["Black", "Blue", "Green"] },
  { name: "Galaxy M22", brand: "Samsung", category: Category.Phones, storages: ["64GB", "128GB"], hasBatteryHealth: false, rams: ["4GB", "6GB"], colors: ["Black", "Light Blue", "White"] },
  { name: "Galaxy M32", brand: "Samsung", category: Category.Phones, storages: ["64GB", "128GB"], hasBatteryHealth: false, rams: ["4GB", "6GB", "8GB"], colors: ["Black", "Light Blue"] },
  { name: "Galaxy M52 5G", brand: "Samsung", category: Category.Phones, storages: ["128GB"], hasBatteryHealth: false, rams: ["6GB", "8GB"], colors: ["Icy Blue", "Blazing Black", "White"] },
  { name: "Galaxy M13", brand: "Samsung", category: Category.Phones, storages: ["64GB", "128GB"], hasBatteryHealth: false, rams: ["4GB", "6GB"], colors: ["Deep Green", "Light Blue", "Orange Copper"] },
  { name: "Galaxy M23", brand: "Samsung", category: Category.Phones, storages: ["128GB"], hasBatteryHealth: false, rams: ["4GB", "6GB"], colors: ["Deep Green", "Light Blue", "Orange Copper"] },
  { name: "Galaxy M33", brand: "Samsung", category: Category.Phones, storages: ["128GB"], hasBatteryHealth: false, rams: ["6GB", "8GB"], colors: ["Green", "Blue", "Brown"] },
  { name: "Galaxy M53 5G", brand: "Samsung", category: Category.Phones, storages: ["128GB", "256GB"], hasBatteryHealth: false, rams: ["6GB", "8GB"], colors: ["Green", "Blue", "Brown"] },
  { name: "Galaxy M14", brand: "Samsung", category: Category.Phones, storages: ["64GB", "128GB"], hasBatteryHealth: false, rams: ["4GB", "6GB"], colors: ["Navy Blue", "Light Blue", "Silver"] },
  { name: "Galaxy M34 5G", brand: "Samsung", category: Category.Phones, storages: ["128GB", "256GB"], hasBatteryHealth: false, rams: ["6GB", "8GB"], colors: ["Midnight Blue", "Prism Silver", "Waterfall Blue"] },
  { name: "Galaxy M54 5G", brand: "Samsung", category: Category.Phones, storages: ["128GB", "256GB"], hasBatteryHealth: false, rams: ["8GB"], colors: ["Dark Blue", "Silver"] },
  { name: "Galaxy M15 5G", brand: "Samsung", category: Category.Phones, storages: ["128GB"], hasBatteryHealth: false, rams: ["4GB", "6GB", "8GB"], colors: ["Light Blue", "Dark Blue", "Gray"] },
  { name: "Galaxy M35 5G", brand: "Samsung", category: Category.Phones, storages: ["128GB", "256GB"], hasBatteryHealth: false, rams: ["6GB", "8GB"], colors: ["Dark Blue", "Light Blue", "Gray"] },
  { name: "Galaxy M55 5G", brand: "Samsung", category: Category.Phones, storages: ["128GB", "256GB"], hasBatteryHealth: false, rams: ["8GB", "12GB"], colors: ["Dark Blue", "Light Green"] },

  // --- Galaxy A Series ---
  { name: "Galaxy A03", brand: "Samsung", category: Category.Phones, storages: ["32GB", "64GB", "128GB"], hasBatteryHealth: false, rams: ["3GB", "4GB"], colors: ["Black", "Blue", "Red"] },
  { name: "Galaxy A04", brand: "Samsung", category: Category.Phones, storages: ["32GB", "64GB", "128GB"], hasBatteryHealth: false, rams: ["3GB", "4GB", "8GB"], colors: ["Black", "Green", "Copper", "White"] },
  { name: "Galaxy A05", brand: "Samsung", category: Category.Phones, storages: ["64GB", "128GB"], hasBatteryHealth: false, rams: ["4GB", "6GB"], colors: ["Black", "Light Green", "Silver"] },
  { name: "Galaxy A06", brand: "Samsung", category: Category.Phones, storages: ["64GB", "128GB"], hasBatteryHealth: false, rams: ["4GB", "6GB"], colors: ["Black", "Light Blue", "Gold"] },
  { name: "Galaxy A10", brand: "Samsung", category: Category.Phones, storages: ["32GB"], hasBatteryHealth: false, rams: ["2GB", "4GB"], colors: ["Black", "Blue", "Red", "Gold"] },
  { name: "Galaxy A11", brand: "Samsung", category: Category.Phones, storages: ["32GB", "64GB"], hasBatteryHealth: false, rams: ["2GB", "3GB", "4GB"], colors: ["Black", "White", "Blue", "Red"] },
  { name: "Galaxy A12", brand: "Samsung", category: Category.Phones, storages: ["32GB", "64GB", "128GB"], hasBatteryHealth: false, rams: ["3GB", "4GB", "6GB"], colors: ["Black", "White", "Blue", "Red"] },
  { name: "Galaxy A13", brand: "Samsung", category: Category.Phones, storages: ["32GB", "64GB", "128GB"], hasBatteryHealth: false, rams: ["3GB", "4GB", "6GB"], colors: ["Black", "White", "Blue", "Peach"] },
  { name: "Galaxy A14", brand: "Samsung", category: Category.Phones, storages: ["64GB", "128GB"], hasBatteryHealth: false, rams: ["4GB", "6GB"], colors: ["Black", "Light Green", "Silver", "Dark Red"] },
  { name: "Galaxy A15", brand: "Samsung", category: Category.Phones, storages: ["128GB", "256GB"], hasBatteryHealth: false, rams: ["4GB", "6GB", "8GB"], colors: ["Brave Black", "Optimistic Blue", "Light Blue", "Yellow"] },
  { name: "Galaxy A16", brand: "Samsung", category: Category.Phones, storages: ["128GB", "256GB"], hasBatteryHealth: false, rams: ["4GB", "8GB"], colors: ["Black", "Light Green", "Gray", "Gold"] },
  { name: "Galaxy A20", brand: "Samsung", category: Category.Phones, storages: ["32GB"], hasBatteryHealth: false, rams: ["3GB"], colors: ["Black", "Deep Blue", "Red", "Gold"] },
  { name: "Galaxy A21", brand: "Samsung", category: Category.Phones, storages: ["32GB"], hasBatteryHealth: false, rams: ["3GB"], colors: ["Black"] },
  { name: "Galaxy A22", brand: "Samsung", category: Category.Phones, storages: ["64GB", "128GB"], hasBatteryHealth: false, rams: ["4GB", "6GB", "8GB"], colors: ["Black", "White", "Mint", "Violet"] },
  { name: "Galaxy A23", brand: "Samsung", category: Category.Phones, storages: ["64GB", "128GB"], hasBatteryHealth: false, rams: ["4GB", "6GB", "8GB"], colors: ["Black", "White", "Blue", "Peach"] },
  { name: "Galaxy A24", brand: "Samsung", category: Category.Phones, storages: ["128GB"], hasBatteryHealth: false, rams: ["4GB", "6GB", "8GB"], colors: ["Black", "Lime Green", "Silver", "Dark Red"] },
  { name: "Galaxy A25", brand: "Samsung", category: Category.Phones, storages: ["128GB", "256GB"], hasBatteryHealth: false, rams: ["6GB", "8GB"], colors: ["Black", "Blue", "Light Blue", "Yellow"] },
  { name: "Galaxy A30", brand: "Samsung", category: Category.Phones, storages: ["32GB", "64GB"], hasBatteryHealth: false, rams: ["3GB", "4GB"], colors: ["Black", "White", "Blue", "Red"] },
  { name: "Galaxy A31", brand: "Samsung", category: Category.Phones, storages: ["64GB", "128GB"], hasBatteryHealth: false, rams: ["4GB", "6GB", "8GB"], colors: ["Prism Crush Black", "Prism Crush Blue", "Prism Crush Red", "Prism Crush White"] },
  { name: "Galaxy A32", brand: "Samsung", category: Category.Phones, storages: ["64GB", "128GB"], hasBatteryHealth: false, rams: ["4GB", "6GB", "8GB"], colors: ["Awesome Black", "Awesome White", "Awesome Blue", "Awesome Violet"] },
  { name: "Galaxy A33", brand: "Samsung", category: Category.Phones, storages: ["128GB", "256GB"], hasBatteryHealth: false, rams: ["6GB", "8GB"], colors: ["Awesome Black", "Awesome White", "Awesome Blue", "Awesome Peach"] },
  { name: "Galaxy A34", brand: "Samsung", category: Category.Phones, storages: ["128GB", "256GB"], hasBatteryHealth: false, rams: ["6GB", "8GB"], colors: ["Awesome Graphite", "Awesome Lime", "Awesome Violet", "Awesome Silver"] },
  { name: "Galaxy A35", brand: "Samsung", category: Category.Phones, storages: ["128GB", "256GB"], hasBatteryHealth: false, rams: ["6GB", "8GB"], colors: ["Awesome Iceblue", "Awesome Lemon", "Awesome Lilac", "Awesome Navy"] },
  { name: "Galaxy A50", brand: "Samsung", category: Category.Phones, storages: ["64GB", "128GB"], hasBatteryHealth: false, rams: ["4GB", "6GB"], colors: ["Black", "White", "Blue", "Coral"] },
  { name: "Galaxy A51", brand: "Samsung", category: Category.Phones, storages: ["64GB", "128GB", "256GB"], hasBatteryHealth: false, rams: ["4GB", "6GB", "8GB"], colors: ["Prism Crush Black", "Prism Crush White", "Prism Crush Blue", "Prism Crush Pink"] },
  { name: "Galaxy A52", brand: "Samsung", category: Category.Phones, storages: ["128GB", "256GB"], hasBatteryHealth: false, rams: ["4GB", "6GB", "8GB"], colors: ["Awesome Black", "Awesome White", "Awesome Blue", "Awesome Violet"] },
  { name: "Galaxy A53", brand: "Samsung", category: Category.Phones, storages: ["128GB", "256GB"], hasBatteryHealth: false, rams: ["4GB", "6GB", "8GB"], colors: ["Awesome Black", "Awesome White", "Awesome Blue", "Awesome Peach"] },
  { name: "Galaxy A54", brand: "Samsung", category: Category.Phones, storages: ["128GB", "256GB"], hasBatteryHealth: false, rams: ["6GB", "8GB"], colors: ["Awesome Lime", "Awesome Graphite", "Awesome Violet", "Awesome White"] },
  { name: "Galaxy A55", brand: "Samsung", category: Category.Phones, storages: ["128GB", "256GB"], hasBatteryHealth: false, rams: ["8GB", "12GB"], colors: ["Awesome Iceblue", "Awesome Lemon", "Awesome Lilac", "Awesome Navy"] },
  { name: "Galaxy A70", brand: "Samsung", category: Category.Phones, storages: ["128GB"], hasBatteryHealth: false, rams: ["6GB", "8GB"], colors: ["Black", "White", "Blue", "Coral"] },
  { name: "Galaxy A71", brand: "Samsung", category: Category.Phones, storages: ["128GB"], hasBatteryHealth: false, rams: ["6GB", "8GB"], colors: ["Prism Crush Black", "Prism Crush Silver", "Prism Crush Blue", "Prism Crush Pink"] },
  { name: "Galaxy A72", brand: "Samsung", category: Category.Phones, storages: ["128GB", "256GB"], hasBatteryHealth: false, rams: ["6GB", "8GB"], colors: ["Awesome Black", "Awesome White", "Awesome Blue", "Awesome Violet"] },
  { name: "Galaxy A73", brand: "Samsung", category: Category.Phones, storages: ["128GB", "256GB"], hasBatteryHealth: false, rams: ["6GB", "8GB"], colors: ["Awesome Gray", "Awesome White", "Awesome Mint"] },

  // --- Galaxy Z Series ---
  { name: "Galaxy Z Fold", brand: "Samsung", category: Category.Phones, storages: ["512GB"], hasBatteryHealth: false, rams: ["12GB"], colors: ["Space Silver", "Cosmos Black"] },
  { name: "Galaxy Z Fold 2", brand: "Samsung", category: Category.Phones, storages: ["256GB", "512GB"], hasBatteryHealth: false, rams: ["12GB"], colors: ["Mystic Bronze", "Mystic Black"] },
  { name: "Galaxy Z Fold 3", brand: "Samsung", category: Category.Phones, storages: ["256GB", "512GB"], hasBatteryHealth: false, rams: ["12GB"], colors: ["Phantom Black", "Phantom Green", "Phantom Silver"] },
  { name: "Galaxy Z Fold 4", brand: "Samsung", category: Category.Phones, storages: ["256GB", "512GB", "1TB"], hasBatteryHealth: false, rams: ["12GB"], colors: ["Graygreen", "Phantom Black", "Beige"] },
  { name: "Galaxy Z Fold 5", brand: "Samsung", category: Category.Phones, storages: ["256GB", "512GB", "1TB"], hasBatteryHealth: false, rams: ["12GB"], colors: ["Icy Blue", "Phantom Black", "Cream", "Gray", "Blue"] },
  { name: "Galaxy Z Fold 6", brand: "Samsung", category: Category.Phones, storages: ["256GB", "512GB", "1TB"], hasBatteryHealth: false, rams: ["12GB"], colors: ["Silver Shadow", "Pink", "Navy", "Crafted Black", "White"] },
  { name: "Galaxy Z Flip", brand: "Samsung", category: Category.Phones, storages: ["256GB"], hasBatteryHealth: false, rams: ["8GB"], colors: ["Mirror Black", "Mirror Purple", "Mirror Gold"] },
  { name: "Galaxy Z Flip 3", brand: "Samsung", category: Category.Phones, storages: ["128GB", "256GB"], hasBatteryHealth: false, rams: ["8GB"], colors: ["Cream", "Green", "Lavender", "Phantom Black", "Gray", "White", "Pink"] },
  { name: "Galaxy Z Flip 4", brand: "Samsung", category: Category.Phones, storages: ["128GB", "256GB", "512GB"], hasBatteryHealth: false, rams: ["8GB"], colors: ["Bora Purple", "Graphite", "Pink Gold", "Blue"] },
  { name: "Galaxy Z Flip 5", brand: "Samsung", category: Category.Phones, storages: ["256GB", "512GB"], hasBatteryHealth: false, rams: ["8GB"], colors: ["Mint", "Graphite", "Cream", "Lavender", "Gray", "Blue", "Green", "Yellow"] },
  { name: "Galaxy Z Flip 6", brand: "Samsung", category: Category.Phones, storages: ["256GB", "512GB"], hasBatteryHealth: false, rams: ["12GB"], colors: ["Blue", "Mint", "Yellow", "Silver Shadow", "Crafted Black", "White", "Peach"] },

  // ================= TECNO PHONES =================
  { name: "Camon 30 Pro", brand: "Tecno", category: Category.Phones, storages: ["256GB", "512GB"], hasBatteryHealth: false },
  { name: "Camon 30", brand: "Tecno", category: Category.Phones, storages: ["128GB", "256GB"], hasBatteryHealth: false },
  { name: "Camon 20 Pro", brand: "Tecno", category: Category.Phones, storages: ["256GB"], hasBatteryHealth: false },
  { name: "Camon 20", brand: "Tecno", category: Category.Phones, storages: ["128GB", "256GB"], hasBatteryHealth: false },
  { name: "Spark 20 Pro", brand: "Tecno", category: Category.Phones, storages: ["256GB"], hasBatteryHealth: false },
  { name: "Spark 20", brand: "Tecno", category: Category.Phones, storages: ["128GB", "256GB"], hasBatteryHealth: false },
  { name: "Spark 10", brand: "Tecno", category: Category.Phones, storages: ["64GB", "128GB"], hasBatteryHealth: false },
  { name: "Pop 8", brand: "Tecno", category: Category.Phones, storages: ["64GB", "128GB"], hasBatteryHealth: false },
  { name: "Phantom V Fold 2", brand: "Tecno", category: Category.Phones, storages: ["512GB"], hasBatteryHealth: false },

  // ================= INFINIX PHONES =================
  { name: "Note 40 Pro", brand: "Infinix", category: Category.Phones, storages: ["256GB"], hasBatteryHealth: false },
  { name: "Note 40", brand: "Infinix", category: Category.Phones, storages: ["128GB", "256GB"], hasBatteryHealth: false },
  { name: "Note 30 Pro", brand: "Infinix", category: Category.Phones, storages: ["256GB"], hasBatteryHealth: false },
  { name: "Note 30", brand: "Infinix", category: Category.Phones, storages: ["128GB", "256GB"], hasBatteryHealth: false },
  { name: "Hot 40 Pro", brand: "Infinix", category: Category.Phones, storages: ["128GB", "256GB"], hasBatteryHealth: false },
  { name: "Hot 40", brand: "Infinix", category: Category.Phones, storages: ["128GB", "256GB"], hasBatteryHealth: false },
  { name: "Hot 30", brand: "Infinix", category: Category.Phones, storages: ["128GB"], hasBatteryHealth: false },
  { name: "Zero 40", brand: "Infinix", category: Category.Phones, storages: ["256GB", "512GB"], hasBatteryHealth: false },
  { name: "Zero 30", brand: "Infinix", category: Category.Phones, storages: ["256GB"], hasBatteryHealth: false },

  // ================= ITEL PHONES =================
  { name: "itel S24", brand: "itel", category: Category.Phones, storages: ["128GB", "256GB"], hasBatteryHealth: false },
  { name: "itel P55+", brand: "itel", category: Category.Phones, storages: ["128GB", "256GB"], hasBatteryHealth: false },
  { name: "itel P55", brand: "itel", category: Category.Phones, storages: ["128GB", "256GB"], hasBatteryHealth: false },
  { name: "itel A70", brand: "itel", category: Category.Phones, storages: ["64GB", "128GB", "256GB"], hasBatteryHealth: false },
  { name: "itel A60s", brand: "itel", category: Category.Phones, storages: ["64GB", "128GB"], hasBatteryHealth: false },

  // ================= XIAOMI / REDMI / POCO PHONES =================
  { name: "Xiaomi 14 Ultra", brand: "Xiaomi", category: Category.Phones, storages: ["512GB", "1TB"], hasBatteryHealth: false },
  { name: "Xiaomi 14", brand: "Xiaomi", category: Category.Phones, storages: ["256GB", "512GB"], hasBatteryHealth: false },
  { name: "Redmi Note 13 Pro+", brand: "Redmi", category: Category.Phones, storages: ["256GB", "512GB"], hasBatteryHealth: false },
  { name: "Redmi Note 13 Pro", brand: "Redmi", category: Category.Phones, storages: ["128GB", "256GB", "512GB"], hasBatteryHealth: false },
  { name: "Redmi Note 13", brand: "Redmi", category: Category.Phones, storages: ["128GB", "256GB"], hasBatteryHealth: false },
  { name: "Redmi Note 12", brand: "Redmi", category: Category.Phones, storages: ["128GB", "256GB"], hasBatteryHealth: false },
  { name: "Redmi 13C", brand: "Redmi", category: Category.Phones, storages: ["128GB", "256GB"], hasBatteryHealth: false },
  { name: "Redmi A3", brand: "Redmi", category: Category.Phones, storages: ["64GB", "128GB"], hasBatteryHealth: false },
  { name: "Poco F6 Pro", brand: "Poco", category: Category.Phones, storages: ["256GB", "512GB", "1TB"], hasBatteryHealth: false },
  { name: "Poco X6 Pro", brand: "Poco", category: Category.Phones, storages: ["256GB", "512GB"], hasBatteryHealth: false },
  { name: "Poco M6", brand: "Poco", category: Category.Phones, storages: ["128GB", "256GB"], hasBatteryHealth: false },

  // ================= OPPO PHONES =================
  { name: "Reno 12 Pro", brand: "Oppo", category: Category.Phones, storages: ["256GB", "512GB"], hasBatteryHealth: false },
  { name: "Reno 11 Pro", brand: "Oppo", category: Category.Phones, storages: ["256GB", "512GB"], hasBatteryHealth: false },
  { name: "Reno 11", brand: "Oppo", category: Category.Phones, storages: ["128GB", "256GB"], hasBatteryHealth: false },
  { name: "Reno 10", brand: "Oppo", category: Category.Phones, storages: ["128GB", "256GB"], hasBatteryHealth: false },
  { name: "Oppo A78", brand: "Oppo", category: Category.Phones, storages: ["128GB", "256GB"], hasBatteryHealth: false },
  { name: "Oppo A58", brand: "Oppo", category: Category.Phones, storages: ["128GB"], hasBatteryHealth: false },
  { name: "Find N3", brand: "Oppo", category: Category.Phones, storages: ["512GB"], hasBatteryHealth: false },

  // ================= VIVO PHONES =================
  { name: "V30 Pro", brand: "Vivo", category: Category.Phones, storages: ["256GB", "512GB"], hasBatteryHealth: false },
  { name: "V30", brand: "Vivo", category: Category.Phones, storages: ["128GB", "256GB"], hasBatteryHealth: false },
  { name: "Vivo Y200", brand: "Vivo", category: Category.Phones, storages: ["128GB", "256GB"], hasBatteryHealth: false },
  { name: "Vivo Y100", brand: "Vivo", category: Category.Phones, storages: ["128GB", "256GB"], hasBatteryHealth: false },
  { name: "Vivo Y17s", brand: "Vivo", category: Category.Phones, storages: ["64GB", "128GB"], hasBatteryHealth: false },

  // ================= HUAWEI PHONES =================
  { name: "P60 Pro", brand: "Huawei", category: Category.Phones, storages: ["256GB", "512GB"], hasBatteryHealth: false },
  { name: "Mate 60 Pro", brand: "Huawei", category: Category.Phones, storages: ["512GB", "1TB"], hasBatteryHealth: false },
  { name: "Nova 11", brand: "Huawei", category: Category.Phones, storages: ["128GB", "256GB"], hasBatteryHealth: false },
  { name: "Nova 12", brand: "Huawei", category: Category.Phones, storages: ["256GB", "512GB"], hasBatteryHealth: false },
  { name: "Pura 70", brand: "Huawei", category: Category.Phones, storages: ["256GB", "512GB"], hasBatteryHealth: false },

  // ================= GOOGLE PIXEL PHONES =================
  { name: "Pixel 9 Pro XL", brand: "Google Pixel", category: Category.Phones, storages: ["128GB", "256GB", "512GB", "1TB"], hasBatteryHealth: false },
  { name: "Pixel 9 Pro", brand: "Google Pixel", category: Category.Phones, storages: ["128GB", "256GB", "512GB", "1TB"], hasBatteryHealth: false },
  { name: "Pixel 9", brand: "Google Pixel", category: Category.Phones, storages: ["128GB", "256GB"], hasBatteryHealth: false },
  { name: "Pixel 8 Pro", brand: "Google Pixel", category: Category.Phones, storages: ["128GB", "256GB", "512GB"], hasBatteryHealth: false },
  { name: "Pixel 8", brand: "Google Pixel", category: Category.Phones, storages: ["128GB", "256GB"], hasBatteryHealth: false },
  { name: "Pixel 7 Pro", brand: "Google Pixel", category: Category.Phones, storages: ["128GB", "256GB", "512GB"], hasBatteryHealth: false },
  { name: "Pixel 7", brand: "Google Pixel", category: Category.Phones, storages: ["128GB", "256GB"], hasBatteryHealth: false },
  { name: "Pixel 6 Pro", brand: "Google Pixel", category: Category.Phones, storages: ["128GB", "256GB"], hasBatteryHealth: false },
  { name: "Pixel 6a", brand: "Google Pixel", category: Category.Phones, storages: ["128GB"], hasBatteryHealth: false },

  // ================= ONEPLUS PHONES =================
  { name: "OnePlus 12", brand: "OnePlus", category: Category.Phones, storages: ["256GB", "512GB"], hasBatteryHealth: false },
  { name: "OnePlus 12R", brand: "OnePlus", category: Category.Phones, storages: ["128GB", "256GB"], hasBatteryHealth: false },
  { name: "OnePlus 11", brand: "OnePlus", category: Category.Phones, storages: ["128GB", "256GB"], hasBatteryHealth: false },
  { name: "OnePlus Nord CE 4", brand: "OnePlus", category: Category.Phones, storages: ["128GB", "256GB"], hasBatteryHealth: false },
  { name: "OnePlus Nord 3", brand: "OnePlus", category: Category.Phones, storages: ["128GB", "256GB"], hasBatteryHealth: false },

  // ================= NOTHING PHONES =================
  { name: "Nothing Phone (2)", brand: "Nothing", category: Category.Phones, storages: ["128GB", "256GB", "512GB"], hasBatteryHealth: false },
  { name: "Nothing Phone (2a)", brand: "Nothing", category: Category.Phones, storages: ["128GB", "256GB"], hasBatteryHealth: false },
  { name: "Nothing Phone (1)", brand: "Nothing", category: Category.Phones, storages: ["128GB", "256GB"], hasBatteryHealth: false },

  // ================= MOTOROLA PHONES =================
  { name: "Edge 50 Pro", brand: "Motorola", category: Category.Phones, storages: ["128GB", "256GB", "512GB"], hasBatteryHealth: false },
  { name: "Razr 50", brand: "Motorola", category: Category.Phones, storages: ["256GB", "512GB"], hasBatteryHealth: false },
  { name: "Moto G84", brand: "Motorola", category: Category.Phones, storages: ["128GB", "256GB"], hasBatteryHealth: false },

  // ================= HONOR PHONES =================
  { name: "Honor 200", brand: "Honor", category: Category.Phones, storages: ["256GB", "512GB"], hasBatteryHealth: false },
  { name: "Honor 90", brand: "Honor", category: Category.Phones, storages: ["256GB", "512GB"], hasBatteryHealth: false },
  { name: "Honor X9b", brand: "Honor", category: Category.Phones, storages: ["256GB"], hasBatteryHealth: false },

  // ================= REALME PHONES =================
  { name: "Realme GT 6", brand: "Realme", category: Category.Phones, storages: ["256GB", "512GB"], hasBatteryHealth: false },
  { name: "Realme 12 Pro+", brand: "Realme", category: Category.Phones, storages: ["128GB", "256GB"], hasBatteryHealth: false },
  { name: "Realme C67", brand: "Realme", category: Category.Phones, storages: ["128GB", "256GB"], hasBatteryHealth: false },

  // ================= TABLETS =================
  { name: "iPad 9th Generation", brand: "Apple", category: Category.Tablets, storages: ["64GB", "256GB"], hasBatteryHealth: false },
  { name: "iPad 10th Generation", brand: "Apple", category: Category.Tablets, storages: ["64GB", "256GB"], hasBatteryHealth: false },
  { name: "iPad 11th Generation", brand: "Apple", category: Category.Tablets, storages: ["128GB", "256GB"], hasBatteryHealth: false },
  { name: "iPad Air", brand: "Apple", category: Category.Tablets, storages: ["64GB", "128GB", "256GB", "512GB"], hasBatteryHealth: false },
  { name: "iPad Mini", brand: "Apple", category: Category.Tablets, storages: ["64GB", "128GB", "256GB"], hasBatteryHealth: false },
  { name: "iPad Pro 11-inch", brand: "Apple", category: Category.Tablets, storages: ["128GB", "256GB", "512GB", "1TB", "2TB"], hasBatteryHealth: false },
  { name: "iPad Pro 13-inch", brand: "Apple", category: Category.Tablets, storages: ["256GB", "512GB", "1TB", "2TB"], hasBatteryHealth: false },

  { name: "Galaxy Tab S9 Ultra", brand: "Samsung", category: Category.Tablets, storages: ["256GB", "512GB", "1TB"], hasBatteryHealth: false },
  { name: "Galaxy Tab S9", brand: "Samsung", category: Category.Tablets, storages: ["128GB", "256GB"], hasBatteryHealth: false },
  { name: "Galaxy Tab S8 Ultra", brand: "Samsung", category: Category.Tablets, storages: ["128GB", "256GB", "512GB"], hasBatteryHealth: false },
  { name: "Galaxy Tab A9+", brand: "Samsung", category: Category.Tablets, storages: ["64GB", "128GB"], hasBatteryHealth: false },
  { name: "Galaxy Tab A8", brand: "Samsung", category: Category.Tablets, storages: ["32GB", "64GB", "128GB"], hasBatteryHealth: false },

  { name: "Lenovo Tab P12", brand: "Lenovo", category: Category.Tablets, storages: ["128GB", "256GB"], hasBatteryHealth: false },
  { name: "Lenovo Tab M10 Plus", brand: "Lenovo", category: Category.Tablets, storages: ["64GB", "128GB"], hasBatteryHealth: false },
  { name: "Lenovo Tab K11", brand: "Lenovo", category: Category.Tablets, storages: ["64GB", "128GB"], hasBatteryHealth: false },

  { name: "MatePad Pro", brand: "Huawei", category: Category.Tablets, storages: ["128GB", "256GB", "512GB"], hasBatteryHealth: false },
  { name: "MatePad 11.5", brand: "Huawei", category: Category.Tablets, storages: ["128GB"], hasBatteryHealth: false },
  { name: "MatePad SE", brand: "Huawei", category: Category.Tablets, storages: ["64GB", "128GB"], hasBatteryHealth: false },

  { name: "Surface Pro 11", brand: "Microsoft", category: Category.Tablets, storages: ["256GB SSD", "512GB SSD", "1TB SSD"], hasBatteryHealth: false },
  { name: "Surface Pro 9", brand: "Microsoft", category: Category.Tablets, storages: ["128GB SSD", "256GB SSD", "512GB SSD", "1TB SSD"], hasBatteryHealth: false },
  { name: "Surface Go 4", brand: "Microsoft", category: Category.Tablets, storages: ["64GB UFS", "128GB UFS", "256GB UFS"], hasBatteryHealth: false },

  { name: "Fire HD 10", brand: "Amazon", category: Category.Tablets, storages: ["32GB", "64GB"], hasBatteryHealth: false },
  { name: "Fire HD 8", brand: "Amazon", category: Category.Tablets, storages: ["32GB", "64GB"], hasBatteryHealth: false },
  { name: "Fire Max 11", brand: "Amazon", category: Category.Tablets, storages: ["64GB", "128GB"], hasBatteryHealth: false },

  { name: "Xiaomi Pad 6", brand: "Xiaomi", category: Category.Tablets, storages: ["128GB", "256GB"], hasBatteryHealth: false },
  { name: "Xiaomi Pad 6 Pro", brand: "Xiaomi", category: Category.Tablets, storages: ["128GB", "256GB", "512GB"], hasBatteryHealth: false },
  { name: "Redmi Pad SE", brand: "Xiaomi", category: Category.Tablets, storages: ["64GB", "128GB", "256GB"], hasBatteryHealth: false },

  // ================= LAPTOPS =================
  { name: "MacBook Pro M3", brand: "Apple", category: Category.Laptops, storages: ["512GB SSD", "1TB SSD", "2TB SSD"], hasBatteryHealth: true },
  { name: "MacBook Pro M2", brand: "Apple", category: Category.Laptops, storages: ["256GB SSD", "512GB SSD", "1TB SSD"], hasBatteryHealth: true },
  { name: "MacBook Pro M1", brand: "Apple", category: Category.Laptops, storages: ["256GB SSD", "512GB SSD", "1TB SSD"], hasBatteryHealth: true },
  { name: "MacBook Air M3", brand: "Apple", category: Category.Laptops, storages: ["256GB SSD", "512GB SSD"], hasBatteryHealth: true },
  { name: "MacBook Air M2", brand: "Apple", category: Category.Laptops, storages: ["256GB SSD", "512GB SSD"], hasBatteryHealth: true },
  { name: "MacBook Air M1", brand: "Apple", category: Category.Laptops, storages: ["256GB SSD", "512GB SSD"], hasBatteryHealth: true },

  { name: "HP Spectre x360", brand: "HP", category: Category.Laptops, storages: ["256GB SSD", "512GB SSD", "1TB SSD", "2TB SSD"], hasBatteryHealth: false },
  { name: "HP Envy 16", brand: "HP", category: Category.Laptops, storages: ["256GB SSD", "512GB SSD", "1TB SSD", "2TB SSD"], hasBatteryHealth: false },
  { name: "HP Pavilion 15", brand: "HP", category: Category.Laptops, storages: ["128GB SSD", "256GB SSD", "512GB SSD", "1TB SSD", "2TB SSD"], hasBatteryHealth: false },
  { name: "HP EliteBook 840", brand: "HP", category: Category.Laptops, storages: ["128GB SSD", "256GB SSD", "512GB SSD", "1TB SSD", "2TB SSD"], hasBatteryHealth: false },

  { name: "Dell XPS 13", brand: "Dell", category: Category.Laptops, storages: ["128GB SSD", "256GB SSD", "512GB SSD", "1TB SSD", "2TB SSD"], hasBatteryHealth: false },
  { name: "Dell XPS 15", brand: "Dell", category: Category.Laptops, storages: ["256GB SSD", "512GB SSD", "1TB SSD", "2TB SSD"], hasBatteryHealth: false },
  { name: "Dell Inspiron 16", brand: "Dell", category: Category.Laptops, storages: ["128GB SSD", "256GB SSD", "512GB SSD", "1TB SSD", "2TB SSD"], hasBatteryHealth: false },
  { name: "Dell Latitude 5440", brand: "Dell", category: Category.Laptops, storages: ["128GB SSD", "256GB SSD", "512GB SSD", "1TB SSD", "2TB SSD"], hasBatteryHealth: false },

  { name: "Lenovo ThinkPad X1 Carbon", brand: "Lenovo", category: Category.Laptops, storages: ["256GB SSD", "512GB SSD", "1TB SSD", "2TB SSD"], hasBatteryHealth: false },
  { name: "Lenovo Yoga 9i", brand: "Lenovo", category: Category.Laptops, storages: ["256GB SSD", "512GB SSD", "1TB SSD", "2TB SSD"], hasBatteryHealth: false },
  { name: "Lenovo IdeaPad 3", brand: "Lenovo", category: Category.Laptops, storages: ["128GB SSD", "256GB SSD", "512GB SSD", "1TB SSD", "2TB SSD"], hasBatteryHealth: false },
  { name: "Lenovo Legion 5", brand: "Lenovo", category: Category.Laptops, storages: ["256GB SSD", "512GB SSD", "1TB SSD", "2TB SSD"], hasBatteryHealth: false },

  { name: "ASUS Zenbook 14", brand: "ASUS", category: Category.Laptops, storages: ["256GB SSD", "512GB SSD", "1TB SSD", "2TB SSD"], hasBatteryHealth: false },
  { name: "ASUS Vivobook 15", brand: "ASUS", category: Category.Laptops, storages: ["128GB SSD", "256GB SSD", "512GB SSD", "1TB SSD", "2TB SSD"], hasBatteryHealth: false },
  { name: "ASUS ROG Zephyrus G14", brand: "ASUS", category: Category.Laptops, storages: ["256GB SSD", "512GB SSD", "1TB SSD", "2TB SSD"], hasBatteryHealth: false },

  { name: "Acer Aspire 5", brand: "Acer", category: Category.Laptops, storages: ["128GB SSD", "256GB SSD", "512GB SSD", "1TB SSD", "2TB SSD"], hasBatteryHealth: false },
  { name: "Acer Swift Go", brand: "Acer", category: Category.Laptops, storages: ["256GB SSD", "512GB SSD", "1TB SSD", "2TB SSD"], hasBatteryHealth: false },
  { name: "Acer Nitro 5", brand: "Acer", category: Category.Laptops, storages: ["256GB SSD", "512GB SSD", "1TB SSD", "2TB SSD"], hasBatteryHealth: false },

  { name: "MSI Raider GE78", brand: "MSI", category: Category.Laptops, storages: ["1TB SSD", "2TB SSD"], hasBatteryHealth: false },
  { name: "MSI Cyborg 15", brand: "MSI", category: Category.Laptops, storages: ["512GB SSD", "1TB SSD"], hasBatteryHealth: false },
  { name: "MSI Modern 14", brand: "MSI", category: Category.Laptops, storages: ["256GB SSD", "512GB SSD"], hasBatteryHealth: false },

  { name: "MateBook X Pro", brand: "Huawei", category: Category.Laptops, storages: ["512GB SSD", "1TB SSD", "2TB SSD"], hasBatteryHealth: false },
  { name: "MateBook D16", brand: "Huawei", category: Category.Laptops, storages: ["256GB SSD", "512GB SSD"], hasBatteryHealth: false },
  { name: "MateBook 14", brand: "Huawei", category: Category.Laptops, storages: ["512GB SSD", "1TB SSD"], hasBatteryHealth: false },

  { name: "Surface Laptop 5", brand: "Microsoft", category: Category.Laptops, storages: ["256GB SSD", "512GB SSD", "1TB SSD"], hasBatteryHealth: false },
  { name: "Surface Laptop Studio 2", brand: "Microsoft", category: Category.Laptops, storages: ["512GB SSD", "1TB SSD", "2TB SSD"], hasBatteryHealth: false },
  { name: "Surface Laptop Go 3", brand: "Microsoft", category: Category.Laptops, storages: ["128GB SSD", "256GB SSD"], hasBatteryHealth: false },

  { name: "Galaxy Book 4 Ultra", brand: "Samsung", category: Category.Laptops, storages: ["512GB SSD", "1TB SSD", "2TB SSD"], hasBatteryHealth: false },
  { name: "Galaxy Book 4 Pro", brand: "Samsung", category: Category.Laptops, storages: ["256GB SSD", "512GB SSD", "1TB SSD"], hasBatteryHealth: false },
  { name: "Galaxy Book 3", brand: "Samsung", category: Category.Laptops, storages: ["256GB SSD", "512GB SSD"], hasBatteryHealth: false },

  // ================= SMART WATCHES =================
  { name: "Apple Watch Ultra 2", brand: "Apple", category: Category.SmartWatches, storages: ["49mm"], hasBatteryHealth: true },
  { name: "Apple Watch Series 9", brand: "Apple", category: Category.SmartWatches, storages: ["41mm", "45mm"], hasBatteryHealth: true },
  { name: "Apple Watch Series 8", brand: "Apple", category: Category.SmartWatches, storages: ["41mm", "45mm"], hasBatteryHealth: true },
  { name: "Apple Watch SE", brand: "Apple", category: Category.SmartWatches, storages: ["40mm", "44mm"], hasBatteryHealth: true },

  { name: "Galaxy Watch 6 Classic", brand: "Samsung", category: Category.SmartWatches, storages: ["43mm", "47mm"], hasBatteryHealth: false },
  { name: "Galaxy Watch 6", brand: "Samsung", category: Category.SmartWatches, storages: ["40mm", "44mm"], hasBatteryHealth: false },
  { name: "Galaxy Watch 5 Pro", brand: "Samsung", category: Category.SmartWatches, storages: ["45mm"], hasBatteryHealth: false },

  { name: "Watch GT 4", brand: "Huawei", category: Category.SmartWatches, storages: ["41mm", "46mm"], hasBatteryHealth: false },
  { name: "Watch Ultimate", brand: "Huawei", category: Category.SmartWatches, storages: ["48mm"], hasBatteryHealth: false },
  { name: "Watch Fit 3", brand: "Huawei", category: Category.SmartWatches, storages: ["43mm"], hasBatteryHealth: false },

  { name: "Pixel Watch 3", brand: "Google", category: Category.SmartWatches, storages: ["41mm", "45mm"], hasBatteryHealth: false },
  { name: "Pixel Watch 2", brand: "Google", category: Category.SmartWatches, storages: ["41mm"], hasBatteryHealth: false },

  { name: "Garmin Fenix 7", brand: "Garmin", category: Category.SmartWatches, storages: ["42mm", "47mm", "51mm"], hasBatteryHealth: false },
  { name: "Garmin Venu 3", brand: "Garmin", category: Category.SmartWatches, storages: ["41mm", "45mm"], hasBatteryHealth: false },

  { name: "Fitbit Sense 2", brand: "Fitbit", category: Category.SmartWatches, storages: ["Official Size"], hasBatteryHealth: false },
  { name: "Fitbit Versa 4", brand: "Fitbit", category: Category.SmartWatches, storages: ["Official Size"], hasBatteryHealth: false },
  { name: "Fitbit Charge 6", brand: "Fitbit", category: Category.SmartWatches, storages: ["Official Size"], hasBatteryHealth: false },

  { name: "Amazfit GTR 4", brand: "Amazfit", category: Category.SmartWatches, storages: ["46mm"], hasBatteryHealth: false },
  { name: "Amazfit GTS 4", brand: "Amazfit", category: Category.SmartWatches, storages: ["43mm"], hasBatteryHealth: false },
  { name: "Amazfit Bip 5", brand: "Amazfit", category: Category.SmartWatches, storages: ["Official Size"], hasBatteryHealth: false },

  { name: "Xiaomi Watch 2 Pro", brand: "Xiaomi", category: Category.SmartWatches, storages: ["46mm"], hasBatteryHealth: false },
  { name: "Redmi Watch 4", brand: "Xiaomi", category: Category.SmartWatches, storages: ["Official Size"], hasBatteryHealth: false },

  // ================= GAMING CONSOLES =================
  { name: "PS3", brand: "Sony PlayStation", category: Category.GameConsoles, storages: ["120GB", "160GB", "250GB", "320GB", "500GB"], hasBatteryHealth: false },
  { name: "PS4", brand: "Sony PlayStation", category: Category.GameConsoles, storages: ["500GB", "1TB"], hasBatteryHealth: false },
  { name: "PS4 Slim", brand: "Sony PlayStation", category: Category.GameConsoles, storages: ["500GB", "1TB"], hasBatteryHealth: false },
  { name: "PS4 Pro", brand: "Sony PlayStation", category: Category.GameConsoles, storages: ["1TB", "2TB"], hasBatteryHealth: false },
  { name: "PS5 Digital Edition", brand: "Sony PlayStation", category: Category.GameConsoles, storages: ["825GB", "1TB"], hasBatteryHealth: false },
  { name: "PS5 Disc Edition", brand: "Sony PlayStation", category: Category.GameConsoles, storages: ["825GB", "1TB"], hasBatteryHealth: false },
  { name: "PS5 Slim Digital", brand: "Sony PlayStation", category: Category.GameConsoles, storages: ["1TB"], hasBatteryHealth: false },
  { name: "PS5 Slim Disc", brand: "Sony PlayStation", category: Category.GameConsoles, storages: ["1TB"], hasBatteryHealth: false },
  { name: "PS5 Pro", brand: "Sony PlayStation", category: Category.GameConsoles, storages: ["2TB"], hasBatteryHealth: false },

  { name: "Xbox One", brand: "Microsoft Xbox", category: Category.GameConsoles, storages: ["500GB", "1TB"], hasBatteryHealth: false },
  { name: "Xbox One S", brand: "Microsoft Xbox", category: Category.GameConsoles, storages: ["500GB", "1TB", "2TB"], hasBatteryHealth: false },
  { name: "Xbox One X", brand: "Microsoft Xbox", category: Category.GameConsoles, storages: ["1TB"], hasBatteryHealth: false },
  { name: "Xbox Series S", brand: "Microsoft Xbox", category: Category.GameConsoles, storages: ["512GB", "1TB"], hasBatteryHealth: false },
  { name: "Xbox Series X", brand: "Microsoft Xbox", category: Category.GameConsoles, storages: ["1TB", "2TB"], hasBatteryHealth: false },

  { name: "Nintendo Switch", brand: "Nintendo", category: Category.GameConsoles, storages: ["32GB", "64GB"], hasBatteryHealth: false },
  { name: "Switch Lite", brand: "Nintendo", category: Category.GameConsoles, storages: ["32GB", "64GB"], hasBatteryHealth: false },
  { name: "Switch OLED", brand: "Nintendo", category: Category.GameConsoles, storages: ["64GB"], hasBatteryHealth: false },

  // ================= ACCESSORIES =================
  { name: "AirPods Pro 2", brand: "Apple", category: Category.Accessories, storages: ["Universal"], hasBatteryHealth: false },
  { name: "AirPods 3", brand: "Apple", category: Category.Accessories, storages: ["Universal"], hasBatteryHealth: false },
  { name: "Galaxy Buds 2 Pro", brand: "Samsung", category: Category.Accessories, storages: ["Universal"], hasBatteryHealth: false },
  { name: "Oraimo FreePods 4", brand: "Oraimo", category: Category.Accessories, storages: ["Universal"], hasBatteryHealth: false },
  { name: "Oraimo FreePods Lite", brand: "Oraimo", category: Category.Accessories, storages: ["Universal"], hasBatteryHealth: false },
  { name: "Anker PowerCore 20k", brand: "Anker", category: Category.Accessories, storages: ["Universal"], hasBatteryHealth: false },
  { name: "Anker Nano Charger", brand: "Anker", category: Category.Accessories, storages: ["Universal"], hasBatteryHealth: false },
  { name: "JBL Go 4", brand: "JBL", category: Category.Accessories, storages: ["Universal"], hasBatteryHealth: false },
  { name: "JBL Charge 5", brand: "JBL", category: Category.Accessories, storages: ["Universal"], hasBatteryHealth: false }
];

export const BRANDS = [
  "Apple", "Samsung", "Tecno", "Infinix", "itel", "Xiaomi", "Redmi", "Poco", 
  "Oppo", "Vivo", "Huawei", "Google Pixel", "OnePlus", "Nothing", "Motorola", "Honor", "Realme",
  "Lenovo", "Microsoft", "Amazon", "Google", "Garmin", "Fitbit", "Amazfit",
  "HP", "Dell", "ASUS", "Acer", "MSI",
  "Sony PlayStation", "Microsoft Xbox", "Nintendo", "Oraimo", "Anker", "JBL", "Other"
];

export const WARRANTY_OPTIONS = [
  "No Warranty",
  "7 Days",
  "14 Days",
  "30 Days",
  "60 Days",
  "90 Days",
  "6 Months",
  "1 Year",
  "Custom"
];

export function parseShortenedPriceToNumber(val: string): number {
  if (!val) return 0;
  let clean = val.toLowerCase().replace(/,/g, "").trim();
  
  let multiplier = 1;
  if (clean.endsWith("k")) {
    multiplier = 1000;
    clean = clean.slice(0, -1).trim();
  } else if (clean.endsWith("m")) {
    multiplier = 1000000;
    clean = clean.slice(0, -1).trim();
  }
  
  // Clean other non-numeric symbols except dots
  clean = clean.replace(/[^0-9.]/g, "");
  
  const num = parseFloat(clean);
  return isNaN(num) ? 0 : Math.round(num * multiplier);
}

export function formatShortenedPriceInput(val: string): string {
  const parsed = parseShortenedPriceToNumber(val);
  return parsed > 0 ? parsed.toLocaleString() : "";
}

export function getCategoryQuickTags(category: Category, brand?: string): string[] {
  const brandLower = (brand || "").trim().toLowerCase();
  if (category === Category.Phones) {
    if (brandLower === "apple") {
      return [
        "Brand New", "UK Used", "US Used", "Good Deal", "Physical SIM", "eSIM", "eSIM Locked", "WiFi Only", "MDM", "IBM", "ICM", "IDM", "Green Line", "No Face ID", 
        "Line on screen", "Ink on Screen", "Locked", "Dual SIM", 
        "Cracked Back", "Other"
      ];
    } else {
      return [
        "Clean", "Like New", "Brand New", "UK Used", "US Used", "Good Deal", "Physical SIM", "WiFi Only", "Green Line", "Pink Line", "Cracked Screen", 
        "Water Damage", "Carrier Locked", "Board Repair", "Dual SIM", "Other"
      ];
    }
  }
  
  switch (category) {
    case Category.Laptops:
      return [
        "SSD", "HDD", "SSD + HDD", "Touchscreen", "Convertible (2-in-1)", "Gaming", 
        "Backlit Keyboard", "Fingerprint", "Dedicated GPU", "Original Charger", "No Charger", "Other"
      ];
    case Category.Tablets:
      return [
        "Wi-Fi", "Wi-Fi + Cellular", "Stylus Included", "Keyboard Included", "Original Charger", 
        "Clean", "Like New", "Other"
      ];
    case Category.SmartWatches:
      return [
        "GPS", "GPS + Cellular", "41mm", "45mm", "Original Strap", "Extra Strap", 
        "Original Charger", "Clean", "Like New", "Other"
      ];
    case Category.GameConsoles:
      return [
        "Disc Edition", "Digital Edition", "1 Controller", "2 Controllers", "Jailbreak", 
        "Clean", "Original Box", "Original Accessories", "Other"
      ];
    case Category.Accessories:
      return [
        "Brand New", "Open Box", "Original", "Generic", "Sealed", "Used", "Other"
      ];
    default:
      return ["Other"];
  }
}

export function getCategoryModelExample(category?: Category | string): string {
  switch (category) {
    case Category.Laptops:
    case "Laptops":
      return "HP EliteBook 840 G8";
    case Category.Tablets:
    case "Tablets":
      return "iPad 11th Generation";
    case Category.GameConsoles:
    case "Gaming Consoles":
    case "GameConsoles":
      return "PlayStation 5 Disc Edition";
    case Category.SmartWatches:
    case "Smart Watches":
    case "SmartWatches":
      return "Apple Watch Series 10";
    case Category.Accessories:
    case "Accessories":
      return "AirPods Pro 2";
    case Category.Phones:
    case "Phones":
    default:
      return "iPhone 12 Pro";
  }
}

export function getCategoryRecommendations(category?: Category | string): string[] {
  switch (category) {
    case Category.Laptops:
    case "Laptops":
      return ["HP EliteBook 840 G8", "MacBook Pro M2 14-inch", "Dell XPS 13 9310", "Lenovo ThinkPad X1 Carbon"];
    case Category.Tablets:
    case "Tablets":
      return ["iPad 11th Generation", "iPad Pro 12.9 M2", "Galaxy Tab S9 Ultra", "iPad Air 5"];
    case Category.GameConsoles:
    case "Gaming Consoles":
    case "GameConsoles":
      return ["PlayStation 5 Disc Edition", "PlayStation 5 Digital Edition", "Xbox Series X", "Nintendo Switch OLED"];
    case Category.SmartWatches:
    case "Smart Watches":
    case "SmartWatches":
      return ["Apple Watch Series 10", "Apple Watch Ultra 2", "Galaxy Watch 6 Classic", "Pixel Watch 2"];
    case Category.Accessories:
    case "Accessories":
      return ["AirPods Pro 2", "Galaxy Buds 2 Pro", "Oraimo FreePods 4", "Anker PowerCore 20k"];
    case Category.Phones:
    case "Phones":
    default:
      return ["iPhone 12 Pro", "iPhone 13 Pro Max", "Galaxy S24 Ultra", "Pixel 8 Pro"];
  }
}

export function getCategoryPlaceholder(category?: string): string {
  switch (category) {
    case Category.Laptops:
      return "https://images.unsplash.com/photo-1496181130204-755241544e35?auto=format&fit=crop&q=80&w=600";
    case Category.Tablets:
      return "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?auto=format&fit=crop&q=80&w=600";
    case Category.SmartWatches:
      return "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&q=80&w=600";
    case Category.GameConsoles:
      return "https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?auto=format&fit=crop&q=80&w=600";
    case Category.Accessories:
      return "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&q=80&w=600";
    default:
      return "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&q=80&w=600";
  }
}

