/**
 * Client-side browser Canvas utility to resize and compress photos before upload
 * Keeps document text sharp while reducing multi-megabyte mobile photos to ~300KB-800KB.
 */
export async function compressAndResizeImage(
  file: File,
  maxDimension = 1600,
  quality = 0.85
): Promise<{ blob: Blob; dataUrl: string; width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onerror = () => reject(new Error("Failed to read image file."));

    reader.onload = () => {
      const img = new Image();

      img.onerror = () => reject(new Error("Failed to decode image data."));

      img.onload = () => {
        let { width, height } = img;

        // Calculate aspect ratio preserving resize
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Unable to create canvas context for image processing."));
          return;
        }

        // Draw image onto canvas with high quality image smoothing
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";
        ctx.drawImage(img, 0, 0, width, height);

        // Convert to dataUrl for instant local preview
        const dataUrl = canvas.toDataURL("image/jpeg", quality);

        // Convert to Blob for upload
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error("Failed to export compressed image blob."));
              return;
            }
            resolve({ blob, dataUrl, width, height });
          },
          "image/jpeg",
          quality
        );
      };

      img.src = reader.result as string;
    };

    reader.readAsDataURL(file);
  });
}
