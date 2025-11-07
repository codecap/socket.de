// --- Глобальні константи ---
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
 * Дані про сторінку з конфігураційного масиву.
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
 * Автоматичне перенаправлення на мову браузера.
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

    if (window.location.href !== redirectUrl) {
      handleAjaxLoad(redirectUrl); 
    }
    return true; 
  }
  return false; 
};

/**
 * Обробка AJAX-завантаження вмісту.
 */
function handleAjaxLoad(targetUrl) {
  document.body.classList.add('is-loading'); 

  fetch(targetUrl)
    .then(response => response.text())
    .then(html => {
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
        document.body.classList.remove('is-loading'); 
    })
    .catch(error => {
        console.error('AJAX navigation failed, falling back to full load:', error);
        window.location.href = targetUrl;
    });
}


/**
 * Обробник кліку, який використовує делегування подій для AJAX та Вкладок.
 */
function initializeAjaxNavigation() {
  
  document.body.addEventListener('click', (event) => {
      const link = event.target.closest('a'); 
      const targetUrl = link ? link.href : null;

      // Делегування для вкладок.
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

          // Деактивація активних класів з контейнерів.
          tabsContainer.querySelector("li.active")?.classList.remove("active");
          panelsContainer.querySelector(".tabs-panel.active")?.classList.remove("active");
          
          parentListItem.classList.add("active");
          
          const index = Array.from(parentListItem.parentElement.children).indexOf(parentListItem);

          const panel = panelsContainer.querySelectorAll('.tabs-panel')[index];
          
          if (panel) {
              panel.classList.add("active");
              
              // Оновлення GOOGLE MAPS
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
      
      //  Делегування для AJAX-навігації
      if (link && targetUrl && targetUrl.startsWith(window.location.origin) && !link.target && !link.dataset.noAjax) {
          event.preventDefault();
          handleAjaxLoad(targetUrl);
      }
  });
}

/**
 * Функція для ініціалізації всіх скриптів, які залежать від наявності контенту.
 */
function initializeContentScripts() {
  //Плавне перенаправлення мови
  checkLanguageRedirect(); 
  
  // Ініціалізація контентних функцій
  loadMoreClients(); 
  
  // Ініціалізація карти (якщо є елемент) = initMap тепер глобальна функція.
  if (typeof initMap === 'function' && document.getElementById("map")) {
      initMap();
  }
}

/**
 * Ініціалізує Google Map на сторінці.
 * 
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
 * Обробляє "Завантажити більше".
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
// Активація jQuery (для гамбургер-меню)
jQuery(document).ready(function ($) {
  $("#hamburger").on("click", function () {
    $(this).toggleClass("hamburger__open");
    $(".nav-top").toggleClass("open");
    $("html").toggleClass("fixed");
  });
});

// Активація AJAX та Контентних скриптів після завантаження DOM
document.addEventListener('DOMContentLoaded', () => {
  // Ініціалізація AJAX (делегування)
  initializeAjaxNavigation();

  // Ініціалізація контентних скриптів при першому завантаженні
  initializeContentScripts();

  // Preloader (якщо потрібен)
  const loader = document.getElementById("loader");
  if (loader) {
    loader.style.display = "flex";
    setTimeout(() => {
        loader.style.display = "none";
    }, 100);
  }
});