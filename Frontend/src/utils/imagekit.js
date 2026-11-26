/**
 * ImageKit helper for Dar-ul-Ameen.
 * Generates optimized, CDN-served images with width, quality, and auto-format transformations.
 */
export function getImage(path, width) {
  const baseUrl = import.meta.env.VITE_IMAGEKIT_URL;

  if (!baseUrl) {
    if (typeof console !== "undefined" && console.warn) {
      console.warn("[ImageKit] Warning: VITE_IMAGEKIT_URL is missing in environment variables.");
    }
    return path || "";
  }

  if (!path) {
    const cleanBase = baseUrl.replace(/\/+$/, "");
    return width
      ? `${cleanBase}/default-avatar.png?tr=w-${width},q-80,f-auto`
      : `${cleanBase}/default-avatar.png?tr=q-80,f-auto`;
  }

  // Handle data URIs and blob URLs
  if (typeof path === "string" && (path.startsWith("data:") || path.startsWith("blob:"))) {
    return path;
  }

  // If path is already a full remote URL
  if (typeof path === "string" && (path.startsWith("http://") || path.startsWith("https://"))) {
    if (path.includes("ik.imagekit.io")) {
      const urlWithoutQuery = path.split("?")[0];
      const transform = width ? `?tr=w-${width},q-80,f-auto` : `?tr=q-80,f-auto`;
      return `${urlWithoutQuery}${transform}`;
    }
    return path;
  }

  // Strip leading slash and folder prefixes like 'public/' or 'assets/'
  const cleanBase = baseUrl.replace(/\/+$/, "");
  const cleanPath = String(path)
    .replace(/^\/+/, "")
    .replace(/^(public|src\/assets|assets)\//, "");

  const transform = width ? `?tr=w-${width},q-80,f-auto` : `?tr=q-80,f-auto`;

  return `${cleanBase}/${cleanPath}${transform}`;
}

export default getImage;
