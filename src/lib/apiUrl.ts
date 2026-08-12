export function getApiUrl(path: string): string {
  if (typeof window === "undefined") {
    return path;
  }
  
  const pathname = window.location.pathname;
  // If loaded under /mdq-911-intelligence subpath, prefix the path
  if (pathname.includes("/mdq-911-intelligence")) {
    const cleanPath = path.startsWith("/") ? path : `/${path}`;
    return `/mdq-911-intelligence${cleanPath}`;
  }
  
  return path;
}
