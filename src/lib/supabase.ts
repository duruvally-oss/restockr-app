import { createClient } from "@supabase/supabase-js";

const supabaseUrl = (import.meta as any).env.VITE_SUPABASE_URL || "";
const supabaseAnonKey = (import.meta as any).env.VITE_SUPABASE_ANON_KEY || "";

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

// Lazy initialization pattern to prevent crashes if credentials are empty
export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

export async function uploadFileToSupabase(file: File | Blob, fileType: "image" | "video"): Promise<string> {
  if (supabase) {
    const fileExt = file instanceof File 
      ? file.name.split(".").pop() 
      : (fileType === "video" ? "mp4" : "jpg");
    
    const path = `${fileType === "video" ? "videos" : "images"}/${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`;
    const buckets = ["products", "media", "storage"];
    
    for (const bucket of buckets) {
      try {
        const { data, error } = await supabase.storage
          .from(bucket)
          .upload(path, file, {
            cacheControl: "3600",
            upsert: false,
          });

        if (!error && data) {
          const { data: publicUrlData } = supabase.storage
            .from(bucket)
            .getPublicUrl(path);
          if (publicUrlData?.publicUrl) {
            return publicUrlData.publicUrl;
          }
        }
      } catch (err) {
        console.warn(`[Supabase Storage] Upload to bucket ${bucket} failed:`, err);
      }
    }
  }

  // Strict enforcement: For videos, Supabase Storage is the single source of truth. No Base64/IndexedDB fallback.
  if (fileType === "video") {
    throw new Error(
      "Video upload failed. Supabase Storage is required for video hosting. Please check Supabase credentials and bucket permissions."
    );
  }

  // Fallback for images if Supabase Storage is unconfigured
  if (file && typeof file === "object") {
    try {
      return await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          if (typeof reader.result === "string") {
            resolve(reader.result);
          } else {
            reject(new Error("Failed to read image file"));
          }
        };
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(file);
      });
    } catch (err) {
      console.warn("[Storage Fallback] FileReader image conversion error:", err);
    }
  }

  return "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&q=80&w=600";
}

export async function deleteFileFromSupabase(url: string): Promise<boolean> {
  if (!supabase || !url) return false;

  try {
    // Only attempt Supabase storage removal if it's a Supabase storage URL
    if (url.includes("/storage/v1/object/public/")) {
      const parts = url.split("/storage/v1/object/public/")[1];
      if (parts) {
        const slashIdx = parts.indexOf("/");
        if (slashIdx > 0) {
          const bucket = parts.substring(0, slashIdx);
          const path = parts.substring(slashIdx + 1);
          const { error } = await supabase.storage.from(bucket).remove([path]);
          if (error) {
            console.warn("[Supabase Storage] Delete error:", error.message);
            return false;
          }
          console.log(`[Supabase Storage] Successfully deleted object: ${path} from bucket: ${bucket}`);
          return true;
        }
      }
    }
    return false;
  } catch (err) {
    console.warn("[Supabase Storage] Exception during file deletion:", err);
    return false;
  }
}

console.log(
  isSupabaseConfigured
    ? "[Restockr] Supabase client initialized successfully."
    : "[Restockr] Supabase keys missing. Running on local persistent simulated database engine."
);
