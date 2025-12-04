// === Cached DOM references ===
let DOM = {
  body: document.body,
  loader: null,
  pageContent: null,
};

const pageCache = {};

// === Constants ===
const DEFAULT_LANGUAGE = 'en';
const GERMAN_PREFIX = 'de';
const ROOT_PATHS = ['', '/'];

const LANG_PAGES_CONFIG = [
  { url: "/", de: "/de/", en: "/en/" },
  { url: "/services", de: "/de/services/", en: "/en/services/" },
  { url: "/about", de: "/de/about/", en: "/en/about/" },
  { url: "/vna", de: "/de/vna/", en: "/en/vna/" },
  { url: "/imprint", de: "/de/imprint/", en: "/en/imprint/" },
];

// === DOMContentLoaded ===
document.addEventListener("DOMContentLoaded", () => {
  DOM.loader = document.getElementById("loader");
  DOM.pageContent = document.querySelector("#page-content");

  // Обробка /vna без фізичного файлу
  handleVnaPlaceholder();

  initializeAjaxNavigation();
  initializePreloadOnHover();
  initializeContentScripts();
});

// === Handle /vna without physical file ===
function handleVnaPlaceholder() {
  const path = window.location.pathname;
  if (path === '/vna' || path === '/vna/') {
    const lang = navigator.language?.startsWith(GERMAN_PREFIX) ? 'de' : 'en';
    const targetUrl = `/${lang}/vna/`;
    handleAjaxLoad(targetUrl);
  }
}

// === Utility Functions ===
const normalizePath = (path) => (path.length > 1 && path.endsWith('/')) ? path.slice(0, -1) : path;

const getConfigPageData = (path) => {
  const normalized = normalizePath(path);
  return LANG_PAGES_CONFIG.find((p) =>
    ROOT_PATHS.includes(normalized) ? ROOT_PATHS.includes(p.url) : p.url === normalized
  );
};

// === Language Redirect ===
const checkLanguageRedirect = () => {
  const browserLang = navigator.language?.startsWith(GERMAN_PREFIX)
    ? GERMAN_PREFIX
    : DEFAULT_LANGUAGE;

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

// === Loader ===
function showLoader() {
  if (!DOM.loader) return;
  DOM.body.classList.add('is-loading');
  DOM.loader.style.display = 'flex';
}

function hideLoader() {
  if (!DOM.loader) return;
  DOM.body.classList.remove('is-loading');
  DOM.loader.style.display = 'none';
}

// === AJAX Navigation with Fade ===
function handleAjaxLoad(targetUrl) {
  if (targetUrl !== '/' && !targetUrl.endsWith('/')) targetUrl += '/';
  const content = DOM.pageContent;

  showLoader();
  content.classList.add('fade-out');

  setTimeout(() => {
    const fetchPage = pageCache[targetUrl]
      ? Promise.resolve(pageCache[targetUrl])
      : fetch(targetUrl, { redirect: 'follow' }).then(res => res.text()).then(html => {
          pageCache[targetUrl] = html;
          return html;
        });

    fetchPage.then(html => {
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      const newContent = doc.querySelector('#page-content');

      if (newContent) {
        content.innerHTML = newContent.innerHTML;
        runScripts(newContent);
      }

      document.title = doc.querySelector('title')?.textContent || document.title;
      window.history.pushState({}, '', targetUrl);

      initializeContentScripts();
      content.classList.remove('fade-out');
      content.classList.add('fade-in');

      setTimeout(() => content.classList.remove('fade-in'), 300);
      hideLoader();
      window.scrollTo(0, 0);
    }).catch(() => {
      hideLoader();
      window.location.href = targetUrl;
    });
  }, 300); // fade-out duration
}

// === Execute scripts from loaded content ===
function runScripts(container) {
  const scripts = container.querySelectorAll('script');
  scripts.forEach((script) => {
    const newScript = document.createElement('script');
    if (script.src) {
      newScript.src = script.src;
    } else {
      newScript.textContent = script.textContent;
    }
    document.body.appendChild(newScript);
    document.body.removeChild(newScript);
  });
}

// === AJAX Navigation ===
function initializeAjaxNavigation() {
  document.body.addEventListener('click', (event) => {
    const link = event.target.closest('a');
    if (!link) return;

    let href = link.getAttribute('href');
    if (!href) return;

    // Handle root/home (логотип)
    if (href === '/' || href === '/index.html') {
      event.preventDefault();
      handleAjaxLoad('/');
      return;
    }

    // Convert relative href to absolute URL for internal links
    if (!href.startsWith('http')) href = new URL(href, window.location.origin).pathname;
    if (!href.startsWith('/')) href = '/' + href;

    if (link.target || link.dataset.noAjax) return;

    // Tabs
    if (link.closest('.tabs')) {
      event.preventDefault();
      handleTabs(link);
      return;
    }

    event.preventDefault();
    handleAjaxLoad(href);
  });
}

// === Preload pages on hover ===
function initializePreloadOnHover() {
  document.body.addEventListener('mouseover', (e) => {
    const link = e.target.closest('a');
    if (!link) return;
    let href = link.getAttribute('href');
    if (!href.startsWith('/')) return;
    if (!pageCache[href]) fetch(href).then(r => r.text()).then(html => pageCache[href] = html);
  });
}

// === Tabs ===
function handleTabs(link) {
  const li = link.parentElement;
  const tabs = link.closest('.tabs');
  const block = tabs.closest('.tabs_block');
  const panels = block?.querySelector('.tabs-content');
  if (!li || !panels) return;

  const activeTab = tabs.querySelector('li.active');
  const activePanel = panels.querySelector('.tabs-panel.active');
  if (activeTab) activeTab.classList.remove('active');
  if (activePanel) activePanel.classList.remove('active');

  li.classList.add('active');
  const index = [...li.parentElement.children].indexOf(li);
  const panel = panels.children[index];
  if (panel) panel.classList.add('active');

  const mapEl = panel.querySelector("#map");
  if (mapEl && window.google?.maps) {
    const mapInstance = Object.values(google.maps).find(obj => obj instanceof google.maps.Map);
    if (mapInstance) {
      google.maps.event.trigger(mapInstance, 'resize');
      mapInstance.setCenter(mapInstance.getCenter());
    }
  }
}

// === Initialize content after AJAX ===
function initializeContentScripts() {
  checkLanguageRedirect();
  loadMoreClients();
  if (document.getElementById("map") && typeof initMap === "function") initMap();
}

// === Google Maps ===
function initMap() {
  const coords = { lat: 50.13603820381762, lng: 8.57100497383925 };
  const el = document.getElementById("map");
  if (!window.google?.maps || !el) return;

  const map = new google.maps.Map(el, {
    zoom: 15,
    center: coords,
  });

  new google.maps.Marker({
    position: coords,
    map,
    icon: `${window.location.origin}/assets/img/icons/location.svg`,
  });
}

// === Load more clients ===
function loadMoreClients() {
  const btn = document.querySelector("#loadmore");
  if (!btn) return;

  const items = document.querySelectorAll(".clients_block .client_block");
  let current = 2;

  btn.addEventListener("click", (e) => {
    e.preventDefault();
    for (let i = current; i < current + 2 && i < items.length; i++) items[i].style.display = 'block';
    current += 2;
    if (current >= items.length) btn.style.display = 'none';
  });
}

// === jQuery Hamburger Menu ===
jQuery(document).ready(($) => {
  $("#hamburger").on("click", function () {
    $(this).toggleClass("hamburger__open");
    $(".nav-top").toggleClass("open");
    $("html").toggleClass("fixed");
  });
});
