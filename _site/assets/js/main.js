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
 * Keys: URL paths, Values: HTML strings.
 */
const pageCache = {};

/** Default language */
const DEFAULT_LANGUAGE = 'en';
/** Prefix to detect German language */
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
 * @returns {boolean} True if redirected.
 */
function checkLanguageRedirect() {
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
}

/**
 * Load content via AJAX and update DOM/history.
 * @param {string} targetUrl
 */
function handleAjaxLoad(targetUrl) {
  let fetchUrl = targetUrl;
  if (targetUrl.endsWith('/vna/')) fetchUrl = `/${targetUrl.split('/')[1]}/vna.html`;

  const content = DOM.pageContent();
  const fetchPage = pageCache[fetchUrl]
    ? Promise.resolve(pageCache[fetchUrl])
    : fetch(fetchUrl)
        .then(res => res.text())
        .then(html => { pageCache[fetchUrl] = html; return html; });

  fetchPage.then(html => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const newContent = doc.querySelector('#page-content');

    if (newContent) content.innerHTML = newContent.innerHTML;
    document.title = doc.querySelector('title')?.textContent || document.title;
    window.history.pushState({}, '', targetUrl);

    initializeContentScripts();
    closeHamburgerMenu();
    window.scrollTo(0, 0);
  }).catch(() => {
    window.location.href = targetUrl;
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

    if (!href.startsWith('http')) href = new URL(href, window.location.origin).pathname;
    if (!href.startsWith('/')) href = '/' + href;

    e.preventDefault();
    handleAjaxLoad(href);
  });
}

/**
 * Preload page content on hover for perceived speed.
 */
function initializePreloadOnHover() {
  document.body.addEventListener('mouseover', e => {
    const link = e.target.closest('a');
    if (!link) return;

    let href = link.getAttribute('href');
    if (!href.startsWith('/')) return;

    let preloadUrl = href;
    if (href.endsWith('/vna/')) preloadUrl = `/${href.split('/')[1]}/vna.html`;

    if (!pageCache[preloadUrl])
      fetch(preloadUrl).then(r => r.text()).then(html => pageCache[preloadUrl] = html);
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
 * Initialize tabs for elements with '.tabs_block'.
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
 * Handle /vna initial load.
 */
function handleVnaPlaceholder() {
  const path = window.location.pathname;
  if (path === '/vna' || path === '/vna/') {
    const lang = navigator.language?.startsWith(GERMAN_PREFIX) ? 'de' : 'en';
    handleAjaxLoad(`/${lang}/vna/`);
  }
}

/**
 * Initialize Google Maps for #map element.
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
 * Highlight active menu link based on URL.
 */
function highlightActiveMenuItem() {
  const path = window.location.pathname.replace(/\/$/, "");
  document.querySelectorAll('.nav-top a').forEach(a => {
    const href = a.getAttribute('href')?.replace(/\/$/, "");
    if (!href) return;

    a.classList.toggle('current', path === href);
  });
}

/**
 * Initialize all content scripts.
 */
function initializeContentScripts() {
  checkLanguageRedirect();
  initHamburger();
  initTabs();
  highlightActiveMenuItem();
  if (document.getElementById("map") && typeof initMap === "function") initMap();
}

/**
 * Handle browser back/forward navigation.
 */
window.addEventListener("popstate", () => {
  handleAjaxLoad(window.location.pathname);
});

/**
 * Initialize scripts on DOMContentLoaded.
 */
document.addEventListener("DOMContentLoaded", () => {
  initializeAjaxNavigation();
  initializePreloadOnHover();
  initializeContentScripts();
  handleVnaPlaceholder();
  highlightActiveMenuItem();
});
