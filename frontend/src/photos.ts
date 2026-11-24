
import { t } from "./i18n";/** Photos for the AI: picked in the browser, shrunk, sent once, never kept. */

export const MAX_PHOTOS = 4;
const PHOTO_CHARS_MAX = 800_000; // per photo as base64, so four fit in one message

/** Shrink a photo in the browser: a smaller JPEG is all the AI needs, and it keeps the request small. */
export async function shrinkPhoto(file: File): Promise<string> {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error(t("photos.this_photo_could_not_be_opened")));
      image.src = url;
    });
    let result = "";
    for (const [side, quality] of [[1280, 0.8], [1024, 0.65], [800, 0.5]] as const) {
      const scale = Math.min(1, side / Math.max(img.naturalWidth, img.naturalHeight));
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(img.naturalWidth * scale));
      canvas.height = Math.max(1, Math.round(img.naturalHeight * scale));
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error(t("photos.this_browser_cannot_prepare_photos"));
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      result = canvas.toDataURL("image/jpeg", quality);
      if (result.length <= PHOTO_CHARS_MAX) break;
    }
    return result;
  } finally {
    URL.revokeObjectURL(url);
  }
}
