// === Cached DOM ===
let DOM = {
  pageContent: document.querySelector("#page-content")
};

const pageCache = {};

// === Language config ===
const DEFAULT_LANGUAGE = 'en';
const GERMAN_PREFIX = 'de';

const LANG_PAGES_CONFIG = [
  { url: "/", de: "/de/", en: "/en/" },
  { url: "/services", de: "/de/services/", en: "/en/services/" },
  { url: "/about", de: "/de/about/", en: "/en/about/" },
  { url: "/vna", de: "/de/vna/", en: "/en/vna/" },
  { url: "/imprint", de: "/de/imprint/", en: "/en/imprint/" }
];

// === Normalize path ===
const normalizePath = path => path.endsWith('/') && path.length > 1 ? path.slice(0, -1) : path;

// === Get page config ===
const getConfigPageData = path => {
  const normalized = normalizePath(path);
  return LANG_PAGES_CONFIG.find(p =>
    p.url === normalized || (['', '/'].includes(normalized) && ['', '/'].includes(p.url))
  );
};

// === Check language redirect for other pages ===
const checkLanguageRedirect = () => {
  const browserLang = navigator.language?.startsWith(GERMAN_PREFIX) ? 'de' : DEFAULT_LANGUAGE;
  const currentPath = window.location.pathname;
  const pageData = getConfigPageData(currentPath);
  if (!pageData) return false;

  const isLocalized = currentPath.startsWith('/en/') || currentPath.startsWith('/de/');
  if (isLocalized) return false;

  const redirectPath = pageData[browserLang].endsWith('/') ? pageData[browserLang] : pageData[browserLang] + '/';
  if (redirectPath === window.location.pathname) return false;

  handleAjaxLoad(redirectPath);
  return true;
};

// === AJAX Load ===
function handleAjaxLoad(targetUrl) {
  let fetchUrl = targetUrl;

  // Спец. обробка /vna/
  if (targetUrl.endsWith('/vna/')) fetchUrl = `/${targetUrl.split('/')[1]}/vna.html`;

  const content = DOM.pageContent;

  const fetchPage = pageCache[fetchUrl]
    ? Promise.resolve(pageCache[fetchUrl])
    : fetch(fetchUrl).then(res => res.text()).then(html => {
        pageCache[fetchUrl] = html;
        return html;
      });

  fetchPage.then(html => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const newContent = doc.querySelector('#page-content');
    if (newContent) content.innerHTML = newContent.innerHTML;

    document.title = doc.querySelector('title')?.textContent || document.title;
    window.history.pushState({}, '', targetUrl);
    initializeContentScripts();
    window.scrollTo(0, 0);
  }).catch(() => {
    window.location.href = targetUrl;
  });
}

// === Initialize navigation ===
document.addEventListener("DOMContentLoaded", () => {
  initializeAjaxNavigation();
  initializePreloadOnHover();
  initializeContentScripts();
  handleVnaPlaceholder();
});

// === /vna/ placeholder ===
function handleVnaPlaceholder() {
  const path = window.location.pathname;
  if (path === '/vna' || path === '/vna/') {
    const lang = navigator.language?.startsWith(GERMAN_PREFIX) ? 'de' : 'en';
    handleAjaxLoad(`/${lang}/vna/`);
  }
}

// === AJAX navigation click ===
function initializeAjaxNavigation() {
  document.body.addEventListener('click', event => {
    const link = event.target.closest('a');
    if (!link) return;

    let href = link.getAttribute('href');
    if (!href) return;

    if (href === '/' || href === '/index.html') {
      event.preventDefault();
      handleAjaxLoad('/');
      return;
    }

    if (!href.startsWith('http')) href = new URL(href, window.location.origin).pathname;
    if (!href.startsWith('/')) href = '/' + href;

    if (link.target || link.dataset.noAjax) return;

    event.preventDefault();
    handleAjaxLoad(href);
  });
}

// === Preload pages on hover ===
function initializePreloadOnHover() {
  document.body.addEventListener('mouseover', e => {
    const link = e.target.closest('a');
    if (!link) return;
    let href = link.getAttribute('href');
    if (!href.startsWith('/')) return;

    let preloadUrl = href;
    if (href.endsWith('/vna/')) preloadUrl = `/${href.split('/')[1]}/vna.html`;
    if (!pageCache[preloadUrl]) fetch(preloadUrl).then(r => r.text()).then(html => pageCache[preloadUrl] = html);
  });
}

// === Initialize content scripts after AJAX ===
function initializeContentScripts() {
  checkLanguageRedirect();
  if (document.getElementById("map") && typeof initMap === "function") initMap();
}

// === Google Maps example ===
function initMap() {
  const coords = { lat: 50.13603820381762, lng: 8.57100497383925 };
  const el = document.getElementById("map");
  if (!window.google?.maps || !el) return;
  const map = new google.maps.Map(el, { zoom: 15, center: coords });
  new google.maps.Marker({ position: coords, map, icon: `${window.location.origin}/assets/img/icons/location.svg` });
}
