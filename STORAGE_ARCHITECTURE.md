# RESTOCKR - Supabase Storage Architecture & Media Specification

## Overview
RESTOCKR uses Supabase Storage for hosting binary assets including product photos, video clips, and storefront logos. It provides media uploads and automatic asset cleanup when products are updated or deleted.

---

## Storage Buckets Structure

| Bucket Name | Access Control | Max File Size | Allowed MIME Types | Purpose |
|---|---|---|---|---|
| `product-videos` | Public | 50MB | `video/mp4`, `video/webm`, `video/quicktime` | Product video clips |
| `product-images` | Public | 10MB | `image/jpeg`, `image/png`, `image/webp` | Product photos |
| `shop-logos` | Public | 5MB | `image/jpeg`, `image/png`, `image/svg+xml` | Store logos & banners |

---

## Storage Operations Flow

### 1. File Upload Pipeline
```
User selects file (UI File Picker or Drag-and-Drop)
                     │
                     ▼
File type inspected (Image vs. Video)
                     │
                     ▼
`uploadFileToSupabase(file, bucketName)` invoked in `src/lib/supabase.ts`
                     │
                     ▼
Sanitized filename constructed: `[timestamp]-[randomString].[ext]`
                     │
                     ▼
Uploaded to Supabase Storage bucket with `upsert: true`
                     │
                     ▼
Public CDN URL resolved via `supabase.storage.from(bucket).getPublicUrl(path)`
                     │
                     ▼
Public URL attached to Product record in database
```

### 2. Media Deletion & Cleanup
When a product video or photo is replaced or a product is deleted from the inventory:
1. `deleteFileFromSupabase(publicUrl)` parses the bucket name and relative object path from the public URL.
2. Invokes `supabase.storage.from(bucket).remove([filePath])`.
3. Ensures no orphaned video files remain in Supabase Storage.

### 3. Media Download Flow
- **Videos**: Handled in `src/lib/download.ts` via `downloadVideo()`. Fetches media as a Blob, generates an object URL, and triggers an anchor download attribute.
- **Photos**: Downloaded directly via `downloadImage()` or copied to clipboard.

---

## Fallback Mechanisms
If Supabase environment variables (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`) are unconfigured or transient network failure occurs:
- Photos fallback to Base64 data URLs or localized mock URLs (`https://images.unsplash.com/...`).
- Videos fallback to local object URLs or demo MP4 streams.
- The UI gracefully notifies the user while keeping the core inventory operation functional.
