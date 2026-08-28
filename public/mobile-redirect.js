(function routeMobileVisitor() {
  if (globalThis.__MWOLAB_MOBILE__) return;
  const url = new URL(window.location.href);
  const requestedView = String(url.searchParams.get("view") || "").toLowerCase();
  const preferenceKey = "mwolab:preferred-view:v1";
  let preferredView = "";

  try {
    preferredView = localStorage.getItem(preferenceKey) || "";
  } catch {
    // Storage can be unavailable in private or locked-down browser contexts.
  }

  if (requestedView === "desktop") {
    try {
      localStorage.setItem(preferenceKey, "desktop");
    } catch {
      // The current desktop request still wins even when it cannot be persisted.
    }
    url.searchParams.delete("view");
    window.history.replaceState(window.history.state, "", `${url.pathname}${url.search}${url.hash}`);
    return;
  }

  const forceMobile = requestedView === "mobile";
  if (forceMobile) {
    try {
      localStorage.removeItem(preferenceKey);
    } catch {
      // Continue with the explicit mobile request.
    }
    url.searchParams.delete("view");
  }

  if (!forceMobile && preferredView === "desktop") return;

  const userAgent = String(navigator.userAgent || "");
  const userAgentMobile = navigator.userAgentData?.mobile === true;
  const mobileOrTablet = userAgentMobile
    || /Android|iPhone|iPad|iPod|Mobile|Tablet|Silk|Kindle/i.test(userAgent)
    || (/Macintosh/i.test(userAgent) && Number(navigator.maxTouchPoints) > 1);
  if (!forceMobile && !mobileOrTablet) return;

  const rootPath = url.pathname.endsWith("/")
    ? url.pathname
    : url.pathname.endsWith("/index.html")
      ? url.pathname.slice(0, -"index.html".length)
      : `${url.pathname}/`;
  const destination = new URL(`${rootPath}mobile/`, url.origin);
  destination.search = url.search;
  destination.hash = url.hash;
  window.location.replace(destination.href);
}());
