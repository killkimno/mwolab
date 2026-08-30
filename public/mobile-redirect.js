(function routeMobileVisitor() {
  if (globalThis.__MWOLAB_MOBILE__) return;
  const url = new URL(window.location.href);
  const preferenceKey = "mwolab:preferred-view:v1";

  try {
    localStorage.removeItem(preferenceKey);
  } catch {
    // Legacy view preferences are optional cleanup only.
  }

  if (url.searchParams.has("view")) {
    url.searchParams.delete("view");
    window.history.replaceState(window.history.state, "", `${url.pathname}${url.search}${url.hash}`);
  }

  const userAgent = String(navigator.userAgent || "");
  const userAgentMobile = navigator.userAgentData?.mobile === true;
  const mobileOrTablet = userAgentMobile
    || /Android|iPhone|iPad|iPod|Mobile|Tablet|Silk|Kindle/i.test(userAgent)
    || (/Macintosh/i.test(userAgent) && Number(navigator.maxTouchPoints) > 1);
  if (!mobileOrTablet) return;

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
