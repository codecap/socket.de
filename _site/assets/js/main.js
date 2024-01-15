jQuery(document).ready(function ($) {
  // Responsive menu with hamburger.
  $("#hamburger").on("click", function () {
    $(this).toggleClass("hamburger__open");
    $(".nav-top").toggleClass("open");
    $("html").toggleClass("fixed");
  });

  // #Responsive menu with hamburger.
});

// ====== Loading data depends on browser loale ====== //
function getBrowserLanguage() {
  return navigator.language || navigator.userLanguage;
}

function loadLanguageContent() {
  var browserLanguage = getBrowserLanguage().toLowerCase();
  var contentPath = browserLanguage.startsWith("de")
    ? "/de/index.html"
    : "/en/index.html";

  // Відображаємо прелоадер
  var loader = document.getElementById("loader");
  loader.style.display = "flex";

  // Використовуємо Ajax-запит для отримання вмісту
  var xhr = new XMLHttpRequest();
  xhr.onreadystatechange = function () {
    loader.style.display = "none";
    if (xhr.readyState === XMLHttpRequest.DONE) {
      if (xhr.status === 200) {
        // Замінюємо вміст на сторінці отриманим від сервера
        document.getElementById("content").innerHTML = xhr.responseText;
        // ======  tabs on the main page ====//
        const tabLinks = document.querySelectorAll(".tabs a");
        const tabPanels = document.querySelectorAll(".tabs-panel");
        for (let el of tabLinks) {
          el.addEventListener("click", (e) => {
            e.preventDefault();
            document
              .querySelector(".tabs li.active")
              .classList.remove("active");
            document
              .querySelector(".tabs-panel.active")
              .classList.remove("active");
            const parentListItem = el.parentElement;
            parentListItem.classList.add("active");
            const index = [...parentListItem.parentElement.children].indexOf(
              parentListItem
            );
            const panel = [...tabPanels].filter(
              (el) => el.getAttribute("data-index") == index
            );
            panel[0].classList.add("active");
          });
        }
        // ======  tabs on the main page ====//
      } else {
        loadEnContent();
      }
    }
  };
  xhr.open("GET", contentPath, true);
  xhr.send();
}
// Функція для завантаження контенту 404 (en/404.html) у випадку не підтримуваної мови браузером
function loadEnContent() {
  var xhrDefault = new XMLHttpRequest();
  xhrDefault.onreadystatechange = function () {
    if (xhrDefault.readyState === XMLHttpRequest.DONE) {
      // Вставити стандартний контент 404 на сторінку
      document.getElementById("content").innerHTML = xhrDefault.responseText;
    }
  };
  // Завантажити стандартний контент 404 (en/404.html)
  xhrDefault.open("GET", "en/index.html", true);
  xhrDefault.send();
}

document.onreadystatechange = function () {
  if (document.readyState === "complete") {
    loadLanguageContent();
  }
};
// ====== #Loading data depends on browser loale ====== //

// ====== Loading 404 content depends on browser loale ====== //
var userLanguage = navigator.language || navigator.userLanguage;

// Функція для завантаження контенту з файлу
function loadContent(language) {
  var xhr = new XMLHttpRequest();
  xhr.onreadystatechange = function () {
    if (xhr.readyState === 4) {
      if (xhr.status === 200) {
        // Вставити контент на сторінку
        document.getElementById("content-404").innerHTML = xhr.responseText;
      } else {
        // Завантажити стандартний контент 404 (en/404.html), якщо файл для визначеної мови не знайдено
        loadDefaultContent();
      }
    }
  };
  // Спробувати завантажити контент для визначеної мови
  xhr.open("GET", language + "/404.html", true);
  xhr.send();
}
// Функція для завантаження контенту 404 (en/404.html) у випадку не підтримуваної мови браузером
function loadDefaultContent() {
  var xhrDefault = new XMLHttpRequest();
  xhrDefault.onreadystatechange = function () {
    if (xhrDefault.readyState === 4 && xhrDefault.status === 200) {
      // Вставити стандартний контент 404 на сторінку
      document.getElementById("content-404").innerHTML =
        xhrDefault.responseText;
    }
  };
  // Завантажити стандартний контент 404 (en/404.html)
  xhrDefault.open("GET", "en/404.html", true);
  xhrDefault.send();
}

// Викликати функцію для завантаження контенту відповідно до мови
loadContent(userLanguage);
// ====== #Loading 404 content depends on browser loale ====== //

// Google map.
function initMap() {
  // The location of Uluru
  const sl = { lat: 50.13603820381762, lng: 8.57100497383925 };
  // The map, centered at Uluru
  const map = new google.maps.Map(document.getElementById("map"), {
    zoom: 15,
    center: sl,
  });
  let url = window.location.href;
  // The marker, positioned at Uluru
  const iconFolder = url + "assets/img/icons/";
  const marker = new google.maps.Marker({
    position: sl,
    map: map,
    icon: `${iconFolder}location.svg`,
  });
}
// #Google map.

// Load More
const loadmore = document.querySelector("#loadmore");
let currentItems = 2;
loadmore.addEventListener("click", (e) => {
  e.preventDefault();
  const elementList = [
    ...document.querySelectorAll(".clients_block .client_block"),
  ];
  const el = elementList.length - 2; // Take the penultimate item
  for (let i = currentItems; i <= currentItems + 2; i++) {
    if (elementList[i] && i != el) {
      elementList[i].style.display = "block";
    }
  }
  currentItems += 2;
  if (currentItems >= elementList.length) {
    event.target.style.display = "none";
  }
});
