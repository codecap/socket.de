/**
 * Cached DOM elements for utility access.
 */
const DOM = {
  pageContent: () => document.querySelector("#page-content"),
  hamburger: () => document.querySelector("#hamburger"),
  navTop: () => document.querySelector(".nav-top"),
};

/**
 * Cache storage for fetched pages.
 */
const pageCache = {};

/** Available languages */
const LANGUAGES = ['en', 'de'];
const DEFAULT_LANGUAGE = 'en';
const GERMAN_PREFIX = 'de';

/**
 * Configuration for page localization.
 */
const LANG_PAGES_CONFIG = [
  { url: "/", de: "/de/", en: "/en/" },
  { url: "/services", de: "/de/services/", en: "/en/services/" },
  { url: "/about", de: "/de/about/", en: "/en/about/" },
  { url: "/vna", de: "/de/vna/", en: "/en/vna/" },
  { url: "/imprint", de: "/de/imprint/", en: "/en/imprint/" }
];

/**
 * Normalize a path by removing trailing slash unless it's root.
 * @param {string} path
 * @returns {string}
 */
const normalizePath = path =>
  path.endsWith('/') && path.length > 1 ? path.slice(0, -1) : path;

/**
 * Get page configuration for a given path.
 * @param {string} path
 * @returns {object|undefined}
 */
const getConfigPageData = path => {
  const normalized = normalizePath(path);
  return LANG_PAGES_CONFIG.find(p =>
    p.url === normalized || (['', '/'].includes(normalized) && ['', '/'].includes(p.url))
  );
};

/**
 * Redirects to localized path if necessary based on browser language.
 * Strictly falls back to 'en' if browser language is not 'de'.
 * @returns {boolean} True if redirected.
 */
function checkLanguageRedirect() {
  const currentPath = window.location.pathname;
  
  // If the URL already contains /en/ or /de/, do nothing
  if (currentPath.startsWith('/en/') || currentPath.startsWith('/de/')) return false;

  // STRICT FALLBACK: If not German, then English only.
  const browserLang = navigator.language?.startsWith(GERMAN_PREFIX) ? 'de' : 'en';
  const pageData = getConfigPageData(currentPath);
  
  if (!pageData) return false;

  const redirectPath = pageData[browserLang];
  if (redirectPath === currentPath) return false;

  handleAjaxLoad(redirectPath);
  return true;
}

/**
 * Load content via AJAX and update DOM/history.
 * @param {string} targetUrl
 */
function handleAjaxLoad(targetUrl) {
  let fetchUrl = targetUrl;
  
  // Logic to prevent double language prefixing (e.g., /en/en/)
  if (targetUrl.endsWith('/vna/')) {
    const parts = targetUrl.split('/').filter(Boolean);
    const lang = LANGUAGES.includes(parts[0]) ? parts[0] : DEFAULT_LANGUAGE;
    fetchUrl = `/${lang}/vna.html`;
  }

  const content = DOM.pageContent();
  if (!content) return;

  const fetchPage = pageCache[fetchUrl]
    ? Promise.resolve(pageCache[fetchUrl])
    : fetch(fetchUrl)
        .then(res => {
          if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
          return res.text();
        })
        .then(html => { pageCache[fetchUrl] = html; return html; });

  fetchPage.then(html => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const newContent = doc.querySelector('#page-content');

    if (newContent) {
      content.innerHTML = newContent.innerHTML;
      document.title = doc.querySelector('title')?.textContent || document.title;
      window.history.pushState({}, '', targetUrl);
      
      initializeContentScripts();
      closeHamburgerMenu();
      window.scrollTo(0, 0);
    }
  }).catch(err => {
    console.error("AJAX load failed:", err);
    // Hard redirect on failure to ensure user sees content
    if (window.location.pathname !== targetUrl) window.location.href = targetUrl;
  });
}

/**
 * Initialize AJAX navigation for internal links.
 */
function initializeAjaxNavigation() {
  document.body.addEventListener('click', e => {
    const link = e.target.closest('a');
    if (!link) return;

    let href = link.getAttribute('href');
    if (!href || href === '#' || href.startsWith('javascript:')) return;
    if (link.target || link.dataset.noAjax) return;

    const url = new URL(href, window.location.origin);
    // Ensure we only handle internal links
    if (url.origin !== window.location.origin) return;

    e.preventDefault();
    handleAjaxLoad(url.pathname);
  });
}

/**
 * Preload page content on hover.
 */
function initializePreloadOnHover() {
  document.body.addEventListener('mouseover', e => {
    const link = e.target.closest('a');
    if (!link) return;

    let href = link.getAttribute('href');
    if (!href || href.startsWith('http') || href.startsWith('javascript:')) return;

    const url = new URL(href, window.location.origin);
    let preloadUrl = url.pathname;
    
    if (preloadUrl.endsWith('/vna/')) {
        const parts = preloadUrl.split('/').filter(Boolean);
        const lang = LANGUAGES.includes(parts[0]) ? parts[0] : DEFAULT_LANGUAGE;
        preloadUrl = `/${lang}/vna.html`;
    }

    if (!pageCache[preloadUrl]) {
      fetch(preloadUrl).then(r => r.ok ? r.text() : null).then(html => {
          if (html) pageCache[preloadUrl] = html;
      });
    }
  });
}

/**
 * Initialize hamburger toggle.
 */
function initHamburger() {
  const hamburger = DOM.hamburger();
  const navTop = DOM.navTop();
  if (!hamburger || !navTop) return;

  const newHamburger = hamburger.cloneNode(true);
  hamburger.parentNode.replaceChild(newHamburger, hamburger);

  newHamburger.addEventListener('click', () => {
    newHamburger.classList.toggle('hamburger__open');
    navTop.classList.toggle('open');
  });
}

/**
 * Close mobile menu.
 */
function closeHamburgerMenu() {
  const hamburger = DOM.hamburger();
  const navTop = DOM.navTop();
  if (hamburger && navTop) {
    hamburger.classList.remove('hamburger__open');
    navTop.classList.remove('open');
  }
}

/**
 * Initialize tabs.
 */
function initTabs() {
  document.querySelectorAll(".tabs_block").forEach(block => {
    const tabs = block.querySelectorAll(".tabs li");
    const panels = block.querySelectorAll(".tabs-panel");

    tabs.forEach((tab, i) => {
      tab.addEventListener('click', e => {
        e.preventDefault();
        tabs.forEach(t => t.classList.remove("active"));
        tab.classList.add("active");
        panels.forEach(p => p.classList.remove("active"));
        panels[i].classList.add("active");
      });
    });
  });
}

/**
 * Handle initial redirection for root paths.
 */
function handleVnaPlaceholder() {
  const path = window.location.pathname;
  if (path === '/vna' || path === '/vna/') {
    const lang = navigator.language?.startsWith(GERMAN_PREFIX) ? 'de' : 'en';
    handleAjaxLoad(`/${lang}/vna/`);
  }
}

/**
 * Initialize Google Maps.
 */
function initMap() {
  const coords = { lat: 50.13603820381762, lng: 8.57100497383925 };
  const el = document.getElementById("map");
  if (!window.google?.maps || !el) return;

  const map = new google.maps.Map(el, { zoom: 15, center: coords });
  new google.maps.Marker({
    position: coords,
    map,
    icon: `${window.location.origin}/assets/img/icons/location.svg`
  });
}

/**
 * Highlight active menu link.
 */
function highlightActiveMenuItem() {
  const path = normalizePath(window.location.pathname);
  document.querySelectorAll('.nav-top a').forEach(a => {
    const href = normalizePath(a.getAttribute('href') || "");
    a.classList.toggle('current', path === href);
  });
}

/**
 * Run content scripts after AJAX load.
 */
function initializeContentScripts() {
  checkLanguageRedirect();
  initHamburger();
  initTabs();
  highlightActiveMenuItem();
  if (document.getElementById("map")) initMap();
}

window.addEventListener("popstate", () => {
  handleAjaxLoad(window.location.pathname);
});

document.addEventListener("DOMContentLoaded", () => {
  initializeAjaxNavigation();
  initializePreloadOnHover();
  initializeContentScripts();
  handleVnaPlaceholder();
});