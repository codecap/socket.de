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
  { url: "/imprint", de: "/de/imprint/", en: "/en/imprint/" },
  { url: "/privatepolicy", de: "/de/privatepolicy/", en: "/en/privatepolicy/" }
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
 * Vertical Accordion Toggle Logic
 * Synchronized with SCSS transitions
 */
function initPrivacyAccordion() {
  const accordion = document.querySelector('#privacyAccordion');
  if (!accordion) return;

  accordion.addEventListener('click', (e) => {
    const header = e.target.closest('.accordion_header');
    if (!header) return;

    const item = header.parentElement;
    const isActive = item.classList.contains('active');
    
    // Close other items
    const allItems = accordion.querySelectorAll('.accordion_item');
    allItems.forEach(i => {
      if (i !== item) i.classList.remove('active');
    });

    // Toggle current item
    item.classList.toggle('active');

    // Smooth scroll if opening
    if (!isActive) {
      setTimeout(() => {
        item.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }, 250);
    }
  });
}

/**
 * Google Maps initialization with Placeholder toggle logic.
 */
window.initMap = function() {
  const mapEl = document.getElementById("map");
  const placeholderEl = document.getElementById("map-placeholder");
  
  if (!mapEl) return;

  const hasConsent = typeof Cookiebot !== "undefined" && 
                     Cookiebot.consent && 
                     Cookiebot.consent.statistics;

  if (!hasConsent) {
    mapEl.style.display = 'none';
    if (placeholderEl) placeholderEl.style.display = 'block';
    return;
  }

  if (placeholderEl) placeholderEl.style.display = 'none';
  mapEl.style.display = 'block';

  if (!window.google?.maps) {
    console.warn("Google Maps API not available yet.");
    return;
  }

  const coords = { lat: 50.13603820381762, lng: 8.57100497383925 };
  const map = new google.maps.Map(mapEl, { 
    zoom: 15, 
    center: coords,
    mapTypeControl: false,
    streetViewControl: false
  });

  new google.maps.Marker({ 
    position: coords, 
    map: map, 
    icon: '/assets/img/icons/location.svg' 
  });
};

/**
 * Cookiebot API trigger.
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
  } else if (finalUrl.endsWith('/privatepolicy/')) {
    fetchUrl = `/${finalUrl.split('/')[1] || DEFAULT_LANGUAGE}/privatepolicy/index.html`;
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
 * UI Initializers.
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

/**
 * Sticky Contact Panel Toggle and Scroll Behavior Logic.
 * Hides the button on scroll down, shows on scroll up.
 */
function initStickyContacts() {
  const trigger = document.getElementById('contactTrigger');
  const panel = document.getElementById('contactPanel');
  const container = document.querySelector('.sticky-contacts-container');

  if (!trigger || !panel || !container) return;

  let lastScrollTop = 0;
  const scrollThreshold = 10; // Minimum scroll amount to trigger visibility change

  // Handle scroll behavior to hide/show the button
  window.addEventListener('scroll', () => {
    let scrollTop = window.pageYOffset || document.documentElement.scrollTop;

    if (Math.abs(lastScrollTop - scrollTop) <= scrollThreshold) return;

    if (scrollTop > lastScrollTop && scrollTop > 100) {
      // Scrolling down - hide the button and close panel
      container.style.transform = 'translateY(100px)';
      container.style.transition = 'transform 0.3s ease';
      panel.classList.remove('active');
    } else {
      // Scrolling up - show the button
      container.style.transform = 'translateY(0)';
    }
    lastScrollTop = scrollTop;
  });

  // Toggle active class on trigger click
  trigger.addEventListener('click', (e) => {
    e.stopPropagation();
    panel.classList.toggle('active');
  });

  // Close panel when clicking anywhere else on the document
  document.addEventListener('click', (e) => {
    if (!panel.contains(e.target) && e.target !== trigger) {
      panel.classList.remove('active');
    }
  });
}
/**
 * Fixed header shadow on scroll.
 */
function initHeaderScroll() {
  const header = document.querySelector('header');
  if (!header) return;

  const handleScroll = () => {
    if (window.scrollY > 10) {
      header.classList.add('header-scrolled');
    } else {
      header.classList.remove('header-scrolled');
    }
  };

  handleScroll();
  
  window.addEventListener('scroll', handleScroll);
}

function initializeContentScripts() {
  initHeaderScroll();
  initHamburger();
  initTabs();
  //initPrivacyAccordion(); 
  highlightActiveMenuItem();
  initStickyContacts();
  if (document.getElementById("map")) window.initMap();
}

/**
 * Global Listeners.
 */
window.addEventListener("popstate", () => handleAjaxLoad(window.location.pathname));

/**
 * Handle automatic map toggling with polling to wait for Google Maps API.
 */
window.addEventListener('CookiebotOnAccept', () => {
  let attempts = 0;
  const maxAttempts = 20;

  const tryInitMap = () => {
    if (window.google && window.google.maps) {
      window.initMap();
    } else if (attempts < maxAttempts) {
      attempts++;
      setTimeout(tryInitMap, 500);
    }
  };

  tryInitMap();
});

window.addEventListener('CookiebotOnDecline', () => {
  if (document.getElementById("map")) window.initMap();
});

/**
 * Global Initialization
 */
(function init() {
  initializeAjaxNavigation();
  
  const currentPath = window.location.pathname;
  if (currentPath === '/' || (!currentPath.startsWith('/en/') && !currentPath.startsWith('/de/'))) {
    handleAjaxLoad(currentPath);
  } else {
    initializeContentScripts();
  }
})();