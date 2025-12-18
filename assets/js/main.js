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
 * Load content via AJAX and update DOM/history.
 * @param {string} targetUrl
 */
function handleAjaxLoad(targetUrl) {
  let finalUrl = targetUrl;
  const currentPath = normalizePath(targetUrl);
  
  if (!currentPath.startsWith('/en/') && !currentPath.startsWith('/de/')) {
    const pageData = getConfigPageData(currentPath);
    if (pageData) {
      const browserLang = navigator.language?.startsWith(GERMAN_PREFIX) ? 'de' : 'en';
      finalUrl = pageData[browserLang];
    }
  }

  const container = DOM.pageContent();
  if (!container) return;

  // Fix for GitHub Pages/Jekyll
  let fetchUrl = finalUrl;
  if (finalUrl.endsWith('/vna/')) {
    fetchUrl = `/${finalUrl.split('/')[1] || DEFAULT_LANGUAGE}/vna.html`;
  } else if (finalUrl.endsWith('/')) {
    fetchUrl = finalUrl + 'index.html';
  } else if (!finalUrl.includes('.')) {
    fetchUrl = finalUrl + '/index.html';
  }

  // Use absolute path to avoid issues on GitHub Pages
  const absoluteFetchUrl = window.location.origin + fetchUrl;

  const fetchPage = pageCache[absoluteFetchUrl]
    ? Promise.resolve(pageCache[absoluteFetchUrl])
    : fetch(absoluteFetchUrl)
        .then(res => {
          if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
          return res.text();
        })
        .then(html => { pageCache[absoluteFetchUrl] = html; return html; });

  fetchPage.then(html => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const newContent = doc.querySelector('#page-content');

    if (newContent) {
      container.innerHTML = newContent.innerHTML;
      document.title = doc.querySelector('title')?.textContent || document.title;
      
      if (window.location.pathname !== finalUrl) {
        window.history.pushState({}, '', finalUrl);
      }
      
      initializeContentScripts();
      closeHamburgerMenu();
      window.scrollTo(0, 0);
    }
  }).catch(err => {
    console.error("AJAX load failed:", err);
    if (window.location.pathname !== finalUrl) window.location.href = finalUrl;
  });
}

/**
 * Initialize AJAX navigation for internal links.
 */
function initializeAjaxNavigation() {
  document.body.addEventListener('click', e => {
    const link = e.target.closest('a');
    if (!link || link.target || link.dataset.noAjax) return;
    let href = link.getAttribute('href');
    if (!href || href === '#' || href.startsWith('javascript:') || href.startsWith('http')) return;

    try {
      const url = new URL(href, window.location.origin);
      if (url.origin === window.location.origin) {
        e.preventDefault();
        handleAjaxLoad(url.pathname);
      }
    } catch (e) {}
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
    if (!href || href.startsWith('http') || href.startsWith('#')) return;

    let pUrl = new URL(href, window.location.origin).pathname;
    if (pUrl.endsWith('/vna/')) {
        pUrl = `/${pUrl.split('/')[1] || DEFAULT_LANGUAGE}/vna.html`;
    } else if (pUrl.endsWith('/')) {
        pUrl += 'index.html';
    }

    const absolutePUrl = window.location.origin + pUrl;
    if (!pageCache[absolutePUrl]) {
      fetch(absolutePUrl).then(r => r.ok ? r.text() : null).then(h => { if (h) pageCache[absolutePUrl] = h; });
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
  DOM.hamburger()?.classList.remove('hamburger__open');
  DOM.navTop()?.classList.remove('open');
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
 * Initialize Google Maps.
 */
window.initMap = function() {
  const el = document.getElementById("map");
  // Check if Cookiebot allowed Google Maps (statistics/marketing cookies)
  if (typeof Cookiebot !== "undefined" && !Cookiebot.consent.statistics) {
    if (el) el.innerHTML = "<p style='padding:20px; text-align:center;'>Please accept cookies to view the map.</p>";
    return;
  }
  if (!window.google?.maps || !el) return;
  const coords = { lat: 50.13603820381762, lng: 8.57100497383925 };
  const map = new google.maps.Map(el, { zoom: 15, center: coords });
  new google.maps.Marker({ position: coords, map, icon: `${window.location.origin}/assets/img/icons/location.svg` });
};

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
  initHamburger();
  initTabs();
  highlightActiveMenuItem();
  if (document.getElementById("map")) window.initMap();
}

window.addEventListener("popstate", () => handleAjaxLoad(window.location.pathname));

/** Listen for Cookiebot consent to reload the map if it was blocked */
window.addEventListener('CookiebotOnAccept', function (e) {
    if (Cookiebot.consent.statistics && document.getElementById("map")) window.initMap();
});

/**
 * Main initialization.
 */
const init = () => {
  initializeAjaxNavigation();
  initializePreloadOnHover();
  
  const currentPath = window.location.pathname;
  // If we are at root or unlocalized, run handleAjaxLoad immediately with a small delay to beat Cookiebot auto-blocking
  if (currentPath === '/' || (!currentPath.startsWith('/en/') && !currentPath.startsWith('/de/'))) {
    setTimeout(() => handleAjaxLoad(currentPath), 50);
  } else {
    initializeContentScripts();
  }
};

if (document.readyState === 'loading') {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}