export function getApiUrl(path: string): string {
  if (typeof window === "undefined") {
    return path;
  }
  
  const pathname = window.location.pathname.replace(/\/$/, "");
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  
  if (pathname.includes("/mdq-911-intelligence")) {
    return `/mdq-911-intelligence${cleanPath}`;
  }
  
  return path;
}

export function getAppPath(path: string): string {
  if (typeof window === "undefined") {
    return path;
  }
  const pathname = window.location.pathname.replace(/\/$/, "");
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  if (pathname.includes("/mdq-911-intelligence")) {
    return `/mdq-911-intelligence${cleanPath}`;
  }
  return path;
}
