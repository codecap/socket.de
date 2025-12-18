/**
 * Create a native fetch reference to bypass Cookiebot interceptors
 * during AJAX page transitions.
 */
const _nativeFetch = window.fetch.bind(window);

/**
 * Cached DOM elements for utility access.
 */
const DOM = {
  pageContent: () => document.querySelector("#page-content"),
  hamburger: () => document.querySelector("#hamburger"),
  navTop: () => document.querySelector(".nav-top"),
};

const pageCache = {};
const LANGUAGES = ['en', 'de'];
const DEFAULT_LANGUAGE = 'en';
const GERMAN_PREFIX = 'de';

const LANG_PAGES_CONFIG = [
  { url: "/", de: "/de/", en: "/en/" },
  { url: "/services", de: "/de/services/", en: "/en/services/" },
  { url: "/about", de: "/de/about/", en: "/en/about/" },
  { url: "/vna", de: "/de/vna/", en: "/en/vna/" },
  { url: "/imprint", de: "/de/imprint/", en: "/en/imprint/" }
];

const normalizePath = path =>
  path.endsWith('/') && path.length > 1 ? path.slice(0, -1) : path;

const getConfigPageData = path => {
  const normalized = normalizePath(path);
  return LANG_PAGES_CONFIG.find(p =>
    p.url === normalized || (['', '/'].includes(normalized) && ['', '/'].includes(p.url))
  );
};

/**
 * Google Maps initialization with Placeholder toggle logic.
 */
window.initMap = function() {
  const mapEl = document.getElementById("map");
  const placeholderEl = document.getElementById("map-placeholder");
  
  if (!mapEl || !placeholderEl) return;

  // Check Cookiebot consent for statistics
  const hasConsent = typeof Cookiebot !== "undefined" && 
                     Cookiebot.consent && 
                     Cookiebot.consent.statistics;

  if (!hasConsent) {
    // Show placeholder, hide map container
    mapEl.style.display = 'none';
    placeholderEl.style.display = 'block';
    return;
  }

  // Consent given: Show map, hide placeholder
  placeholderEl.style.display = 'none';
  mapEl.style.display = 'block';

  if (!window.google?.maps) return;

  const coords = { lat: 50.13603820381762, lng: 8.57100497383925 };
  const map = new google.maps.Map(mapEl, { zoom: 15, center: coords });
  new google.maps.Marker({ 
    position: coords, 
    map, 
    icon: '/assets/img/icons/location.svg' 
  });
};

/**
 * Cookiebot API trigger - Fixed spelling from previous error.
 */
window.triggerCookieBanner = function() {
  if (typeof Cookiebot !== "undefined") {
    Cookiebot.renew();
  } else {
    console.warn("Cookiebot is not loaded.");
  }
};

/**
 * Handle AJAX loading and history management.
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

  let fetchUrl = finalUrl;
  if (finalUrl.endsWith('/vna/')) {
    fetchUrl = `/${finalUrl.split('/')[1] || DEFAULT_LANGUAGE}/vna.html`;
  } else if (finalUrl.endsWith('/')) {
    fetchUrl = finalUrl + 'index.html';
  } else if (!finalUrl.includes('.')) {
    fetchUrl = finalUrl + '/index.html';
  }

  fetchUrl = fetchUrl.replace(/\/+/g, '/');

  const fetchPage = pageCache[fetchUrl]
    ? Promise.resolve(pageCache[fetchUrl])
    : _nativeFetch(fetchUrl)
        .then(res => {
          if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
          return res.text();
        })
        .then(html => { 
          pageCache[fetchUrl] = html; 
          return html; 
        });

  fetchPage.then(html => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const newContent = doc.querySelector('#page-content');

    if (newContent && container) {
      container.innerHTML = newContent.innerHTML;
      document.title = doc.querySelector('title')?.textContent || document.title;
      
      if (window.location.pathname !== finalUrl) {
        window.history.pushState({}, '', finalUrl);
      }
      
      initializeContentScripts();
      closeHamburgerMenu();
      window.scrollTo(0, 0);
    } else {
      window.location.href = finalUrl;
    }
  }).catch(err => {
    console.error("AJAX load failed:", err);
    if (window.location.pathname !== finalUrl) window.location.href = finalUrl;
  });
}

/**
 * Event listeners and UI Initializers.
 */
function initializeAjaxNavigation() {
  document.body.addEventListener('click', e => {
    const link = e.target.closest('a');
    if (!link || link.target || link.dataset.noAjax) return;
    let href = link.getAttribute('href');
    if (!href || href === '#' || href.startsWith('javascript:')) return;
    if (link.origin === window.location.origin) {
      e.preventDefault();
      handleAjaxLoad(link.pathname);
    }
  });
}

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

function closeHamburgerMenu() {
  DOM.hamburger()?.classList.remove('hamburger__open');
  DOM.navTop()?.classList.remove('open');
}

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

function highlightActiveMenuItem() {
  const path = normalizePath(window.location.pathname);
  document.querySelectorAll('.nav-top a').forEach(a => {
    const href = normalizePath(a.getAttribute('href') || "");
    a.classList.toggle('current', path === href);
  });
}

function initializeContentScripts() {
  initHamburger();
  initTabs();
  highlightActiveMenuItem();
  // Map init is called whenever content is swapped
  if (document.getElementById("map")) window.initMap();
}

/**
 * Global Listeners.
 */
window.addEventListener("popstate", () => handleAjaxLoad(window.location.pathname));

/**
 * Listener for Cookiebot event - redraw map when user clicks "Accept"
 */
window.addEventListener('CookiebotOnAccept', function () {
  if (document.getElementById("map")) {
    window.initMap();
  }
});

/**
 * Global Initialization
 */
(function init() {
  initializeAjaxNavigation();
  
  const currentPath = window.location.pathname;
  // If landing on root or a path without lang prefix, trigger localization load
  if (currentPath === '/' || (!currentPath.startsWith('/en/') && !currentPath.startsWith('/de/'))) {
    handleAjaxLoad(currentPath);
  } else {
    initializeContentScripts();
  }
})();