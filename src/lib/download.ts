/**
 * Utility helper for downloading video/image files reliably.
 * Fetches cross-origin URLs as Blobs to enforce real browser downloads.
 * Returns { success: boolean, error?: string }
 */
export async function downloadMediaFile(url: string, filename: string): Promise<{ success: boolean; error?: string }> {
  try {
    if (!url) {
      return { success: false, error: "Media URL is missing or empty." };
    }

    const cleanFilename = filename.replace(/[^a-zA-Z0-9_.-]/g, "_");

    // Handle inline Data URLs or Blob URLs directly
    if (url.startsWith("data:") || url.startsWith("blob:")) {
      const link = document.createElement("a");
      link.href = url;
      link.download = cleanFilename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      return { success: true };
    }

    // Attempt CORS blob fetch for remote HTTP/HTTPS links
    try {
      const response = await fetch(url, { mode: "cors" });
      if (!response.ok) {
        throw new Error(`HTTP Status ${response.status}: ${response.statusText}`);
      }
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = cleanFilename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
      return { success: true };
    } catch (fetchErr: any) {
      // Fallback: Open in new tab with download attribute if CORS fails
      const link = document.createElement("a");
      link.href = url;
      link.target = "_blank";
      link.download = cleanFilename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      return { success: true };
    }
  } catch (err: any) {
    return {
      success: false,
      error: err?.message || "Failed to download media file. Storage connection refused or link expired."
    };
  }
}
