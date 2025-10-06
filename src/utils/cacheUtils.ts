export const disableCaching = () => {
  // Clear all storage
  localStorage.clear();
  sessionStorage.clear();
  
  // Clear cookies
  document.cookie.split(";").forEach((c) => {
    const eqPos = c.indexOf("=");
    const name = eqPos > -1 ? c.substr(0, eqPos).trim() : c.trim();
    document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/";
  });

  // Add no-cache meta tags
  const addMetaTag = (httpEquiv: string, content: string) => {
    const existing = document.querySelector(`meta[http-equiv="${httpEquiv}"]`);
    if (existing) existing.remove();
    
    const meta = document.createElement('meta');
    meta.setAttribute('http-equiv', httpEquiv);
    meta.setAttribute('content', content);
    document.head.appendChild(meta);
  };

  addMetaTag('Cache-Control', 'no-cache, no-store, must-revalidate, private');
  addMetaTag('Pragma', 'no-cache');
  addMetaTag('Expires', '0');
};

export const forcePageReload = () => {
  window.location.href = window.location.href;
};