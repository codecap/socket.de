/**
 * Створюємо копію оригінального fetch до того, як його перехопить Cookiebot
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

  let fetchUrl = finalUrl;
  if (finalUrl.endsWith('/vna/')) {
    fetchUrl = `/${finalUrl.split('/')[1] || DEFAULT_LANGUAGE}/vna.html`;
  } else if (finalUrl.endsWith('/')) {
    fetchUrl = finalUrl + 'index.html';
  } else if (!finalUrl.includes('.')) {
    fetchUrl = finalUrl + '/index.html';
  }

  // Використовуємо збережений _nativeFetch, щоб Cookiebot не міг його заблокувати
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
 * Initialize AJAX navigation for internal links.
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

/**
 * Preload page content on hover.
 */
function initializePreloadOnHover() {
  document.body.addEventListener('mouseover', e => {
    const link = e.target.closest('a');
    if (!link || link.origin !== window.location.origin) return;
    let pUrl = link.pathname;
    if (pUrl.endsWith('/')) pUrl += 'index.html';

    if (!pageCache[pUrl]) {
      _nativeFetch(pUrl).then(r => r.ok ? r.text() : null).then(h => { if (h) pageCache[pUrl] = h; });
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
  if (typeof Cookiebot !== "undefined" && !Cookiebot.consent.statistics) {
    if (el) el.innerHTML = "<p style='padding:20px; text-align:center;'>Please accept cookies to view the map.</p>";
    return;
  }
  if (!window.google?.maps || !el) return;
  const coords = { lat: 50.13603820381762, lng: 8.57100497383925 };
  const map = new google.maps.Map(el, { zoom: 15, center: coords });
  new google.maps.Marker({ position: coords, map, icon: '/assets/img/icons/location.svg' });
};

function highlightActiveMenuItem() {
  const path = normalizePath(window.location.pathname);
  document.querySelectorAll('.nav-top a').forEach(a => {
    a.classList.toggle('current', normalizePath(a.getAttribute('href') || "") === path);
  });
}

function initializeContentScripts() {
  initHamburger();
  initTabs();
  highlightActiveMenuItem();
  if (document.getElementById("map")) window.initMap();
}

window.addEventListener("popstate", () => handleAjaxLoad(window.location.pathname));

window.addEventListener('CookiebotOnAccept', function (e) {
    if (Cookiebot.consent.statistics && document.getElementById("map")) window.initMap();
});

// Запускаємо відразу, щоб не чекати подій, які бот може заблокувати
(function() {
  initializeAjaxNavigation();
  initializePreloadOnHover();
  
  const currentPath = window.location.pathname;
  if (currentPath === '/' || (!currentPath.startsWith('/en/') && !currentPath.startsWith('/de/'))) {
    handleAjaxLoad(currentPath);
  } else {
    initializeContentScripts();
  }
})();