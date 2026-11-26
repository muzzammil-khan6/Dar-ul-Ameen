/**
 * Utility for client-side image compression before upload.
 * Reduces image dimensions and uses canvas compression (quality 0.75-0.8)
 * to keep file size well under 200KB, eliminating huge payloads and lag.
 */

export async function compressImage(fileOrDataUrl, options = {}) {
  const {
    maxWidth = 800,
    maxHeight = 800,
    quality = 0.75,
    outputType = "image/jpeg",
  } = options;

  return new Promise((resolve, reject) => {
    const processImage = (src) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // Calculate aspect-ratio-preserved bounding box
        if (width > maxWidth || height > maxHeight) {
          if (width / height > maxWidth / maxHeight) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(src);
          return;
        }

        // Draw image onto canvas
        ctx.fillStyle = "#FFFFFF";
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);

        // Convert to data URL
        try {
          const compressedDataUrl = canvas.toDataURL(outputType, quality);
          resolve(compressedDataUrl);
        } catch (err) {
          // Fallback to original src if canvas export fails
          resolve(src);
        }
      };

      img.onerror = () => {
        // If image loading fails, resolve original
        resolve(src);
      };

      img.src = src;
    };

    if (typeof fileOrDataUrl === "string") {
      processImage(fileOrDataUrl);
    } else if (fileOrDataUrl instanceof Blob || fileOrDataUrl instanceof File) {
      const reader = new FileReader();
      reader.onload = (e) => {
        processImage(e.target.result);
      };
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(fileOrDataUrl);
    } else {
      resolve(fileOrDataUrl);
    }
  });
}

/**
 * Converts a data URL to a File object for multipart form submissions.
 */
export function dataURLtoFile(dataurl, filename = "upload.jpg") {
  const arr = dataurl.split(",");
  const mimeMatch = arr[0].match(/:(.*?);/);
  const mime = mimeMatch ? mimeMatch[1] : "image/jpeg";
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new File([u8arr], filename, { type: mime });
}
