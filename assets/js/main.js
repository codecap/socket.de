// --- Global constants ---
const DEFAULT_LANGUAGE = 'en';
const GERMAN_PREFIX = 'de';
const ROOT_PATHS = ['', '/'];
const LANG_PAGES_CONFIG = [
  { url: "", de: "/de/", en: "/en/" },
  { url: "/", de: "/de/", en: "/en/" },
  { url: "/services", de: "/de/services", en: "/en/services" },
  { url: "/about", de: "/de/about", en: "/en/about" },
  { url: "/vna", de: "/de/vna", en: "/en/vna" },
  { url: "/imprint", de: "/de/imprint", en: "/en/imprint" },
];

/**
 * Retrieves page configuration data from the global array based on the current path.
 * @param {string} path - The current URL pathname.
 * @returns {object|undefined} The configuration object for the page.
 */
const getConfigPageData = (path) => {
  const normalizedPath = (path.length > 1 && path.endsWith('/')) 
    ? path.slice(0, -1) 
    : path;

  return LANG_PAGES_CONFIG.find((page) => {
    if (ROOT_PATHS.includes(normalizedPath)) {
      return ROOT_PATHS.includes(page.url);
    }
    return page.url === normalizedPath;
  });
};

/**
 * Handles automatic language redirection for placeholder pages (like root or /vna) 
 * based on the browser’s language.
 * Uses a hard redirect for the '/vna' placeholder to avoid 404 errors in the console.
 * @returns {boolean} True if a redirect was initiated, false otherwise.
 */
const checkLanguageRedirect = () => {
  const browserLang = (navigator.language || navigator.userLanguage).toLowerCase().startsWith(GERMAN_PREFIX)
    ? GERMAN_PREFIX
    : DEFAULT_LANGUAGE;

  const baseUrl = window.location.origin;
  const currentPath = window.location.pathname;
  const pageData = getConfigPageData(currentPath);

  if (pageData && !currentPath.startsWith(`/${DEFAULT_LANGUAGE}/`) && !currentPath.startsWith(`/${GERMAN_PREFIX}/`)) {
    
    const redirectPath = pageData[browserLang];
    const redirectUrl = baseUrl + redirectPath;
    
    const normalizedPath = currentPath.replace(/\/$/, '');
    
    if (window.location.href !== redirectUrl) {
        
        if (normalizedPath === '/vna') {
            
            
            // Execute hard redirect after a minimal delay (200ms)
            setTimeout(() => {
                window.location.href = redirectUrl;
            }, 200); 
            
        } else {
            // Standard AJAX navigation for other non-language-specific root paths
            handleAjaxLoad(redirectUrl); 
        }
    }
    return true; 
  }
  return false; 
};

/**
 * Handles fetching and replacing page content via AJAX for smooth navigation.
 * Includes a minimum display time for the preloader.
 * @param {string} targetUrl - The URL to fetch content from.
 */
function handleAjaxLoad(targetUrl) {
  const loader = document.getElementById('loader');
  const MINIMUM_PRELOADER_TIME = 200; // Minimum display time for the preloader

  document.body.classList.add('is-loading'); 
  
  const fetchPromise = fetch(targetUrl).then(response => response.text());
  
  const delayPromise = new Promise(resolve => {
      setTimeout(resolve, MINIMUM_PRELOADER_TIME);
  });
  
  // Wait for both content fetch and minimum delay
  Promise.all([fetchPromise, delayPromise])
    .then(([html]) => {
        const parser = new DOMParser();
        const newDocument = parser.parseFromString(html, 'text/html');
        
        const newContentContainer = newDocument.querySelector('#page-content');
        const currentPageContainer = document.querySelector('#page-content');

        if (newContentContainer && currentPageContainer) {
            currentPageContainer.innerHTML = newContentContainer.innerHTML;

            window.history.pushState({}, '', targetUrl);
            document.title = newDocument.querySelector('title').textContent;
            
            initializeContentScripts();
            
            window.scrollTo(0, 0);
        }
        
        // Explicitly hide the loader (overrides inline style set in DOMContentLoaded for /vna)
        if (loader) {
            loader.style.display = 'none'; 
        }

        document.body.classList.remove('is-loading'); 
    })
    .catch(error => {
        console.error('AJAX navigation failed, falling back to full load:', error);
        
        if (loader) {
            loader.style.display = 'none'; 
        }

        document.body.classList.remove('is-loading'); 
        window.location.href = targetUrl;
    });
}


/**
 * Sets up a click event handler using event delegation for AJAX links and tab components.
 */
function initializeAjaxNavigation() {
  
  document.body.addEventListener('click', (event) => {
      const link = event.target.closest('a'); 
      const targetUrl = link ? link.href : null;

      // Delegation for tabs.
      if (link && link.closest('.tabs')) {
          event.preventDefault();

          const parentListItem = link.parentElement;
          if (!parentListItem || parentListItem.tagName !== 'LI') return;

          const tabsContainer = link.closest('.tabs');
          
          const tabsBlock = tabsContainer.closest('.tabs_block');
          const panelsContainer = tabsBlock ? tabsBlock.querySelector('.tabs-content') : null;
          
          if (!panelsContainer) {
              console.error("Tabs content container (.tabs-content) not found.");
              return;
          }

          // Deactivating active classes from containers.
          tabsContainer.querySelector("li.active")?.classList.remove("active");
          panelsContainer.querySelector(".tabs-panel.active")?.classList.remove("active");
          
          parentListItem.classList.add("active");
          
          const index = Array.from(parentListItem.parentElement.children).indexOf(parentListItem);

          const panel = panelsContainer.querySelectorAll('.tabs-panel')[index];
          
          if (panel) {
              panel.classList.add("active");
              
              // Updating Google Maps
              const mapElement = panel.querySelector("#map");
              if (mapElement && window.google && google.maps) {
                   const mapInstance = Object.values(google.maps).find(obj => obj instanceof google.maps.Map);
                   if (mapInstance) {
                       google.maps.event.trigger(mapInstance, 'resize');
                       mapInstance.setCenter(mapInstance.getCenter());
                   }
              }
          }
          return; 
      }
      
      // Delegation for AJAX navigation
      if (link && targetUrl && targetUrl.startsWith(window.location.origin) && !link.target && !link.dataset.noAjax) {
          event.preventDefault();
          handleAjaxLoad(targetUrl);
      }
  });
}

/**
 * A function for initializing all scripts that depend on the presence of content, 
 * called on initial load and after successful AJAX navigation.
 */
function initializeContentScripts() {
  // Smooth language redirection
  checkLanguageRedirect(); 
  
  // Initialization of content functions
  loadMoreClients(); 
  
  // Map initialization (if element exists)
  if (typeof initMap === 'function' && document.getElementById("map")) {
      initMap();
  }
}

/**
 * Initializes Google Map on the page using hardcoded coordinates.
 * Requires the Google Maps API script to be loaded globally.
 */
function initMap() {
  const sl = { lat: 50.13603820381762, lng: 8.57100497383925 };
  const mapElement = document.getElementById("map");
  
  if (!window.google || !google.maps || !mapElement) return;

  const map = new google.maps.Map(mapElement, {
    zoom: 15,
    center: sl,
  });
  
  const iconFolder = `${window.location.origin}/assets/img/icons/`; 
  
  new google.maps.Marker({
    position: sl,
    map: map,
    icon: `${iconFolder}location.svg`,
  });
}

/**
 * Implements "Load More" functionality for client blocks.
 */
const loadMoreClients = () => {
    const loadmore = document.querySelector("#loadmore");
    if (!loadmore) return;

    let currentItems = 2;
    loadmore.addEventListener("click", (e) => {
      e.preventDefault();
      
      const elementList = document.querySelectorAll(".clients_block .client_block");
      const elementCount = elementList.length;

      for (let i = currentItems; i < currentItems + 2 && i < elementCount; i++) {
        elementList[i].style.display = "block";
      }

      currentItems += 2;
      
      if (currentItems >= elementCount) {
        e.target.style.display = "none";
      }
    });
};

// Activates jQuery (for hamburger menu)
jQuery(document).ready(function ($) {
  $("#hamburger").on("click", function () {
    $(this).toggleClass("hamburger__open");
    $(".nav-top").toggleClass("open");
    $("html").toggleClass("fixed");
  });
});

// Activates AJAX and content scripts after DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  // AJAX initialization (delegation).
  initializeAjaxNavigation();

  // Initialization of content scripts on first load.
  initializeContentScripts();

  // Preloader Logic for Placeholder Pages (/vna)
  const loader = document.getElementById("loader");
  const currentPath = window.location.pathname.replace(/\/$/, ''); 
  
  if (loader && currentPath === '/vna') { 
    // On /vna, we add the class and force display.
    document.body.classList.add('is-loading');
    loader.style.display = 'flex'; 
    
  } else {
    // On all other pages, remove the class and explicitly hide the preloader.
    document.body.classList.remove('is-loading');
    if (loader) {
        loader.style.display = 'none';
    }
  }
});