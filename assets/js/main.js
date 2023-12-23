jQuery(document).ready(function ($) {
  // Responsive menu with hamburger.
  $("#hamburger").on("click", function () {
    $(this).toggleClass("hamburger__open");
    $(".nav-top").toggleClass("open");
    $("html").toggleClass("fixed");
  }); // #Responsive menu with hamburger.

  var userLang = navigator.language || navigator.userLanguage;
  var supportedLanguages = ["de", "en"]; // Replace with your supported languages
  var defaultLanguage = "de"; // Replace with your default language

  // get current path
  let path = window.location.pathname;
  let pathFirstString = path.split("/")[1];
  // check if first path matches one of our supported languages
  // if it does, update path variable to remove the first path
  if (supportedLanguages.indexOf(pathFirstString) !== -1) {
    path = "/" + path.split("/").slice(2).join("/");
  }
  // Check if the browser language is supported, otherwise redirect to the default language
  if (supportedLanguages.indexOf(userLang) === -1) {
    if (path != window.location.pathname) {
      window.location.href = window.location.origin + path;
    }
  } else if (pathFirstString != userLang) {
    // if userLang does not equal the defaultLanguage, go to userLang URL
    if (userLang != defaultLanguage) {
      window.location.href = window.location.origin + "/" + userLang + path;
      // else if user is not currently on default page, go to default page
    } else if (path != window.location.pathname) {
      window.location.href = window.location.origin + path;
    }
  }
});

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

// Tabs with services at home page.
const tabLinks = document.querySelectorAll(".tabs a");
const tabPanels = document.querySelectorAll(".tabs-panel");
for (let el of tabLinks) {
  el.addEventListener("click", (e) => {
    e.preventDefault();
    document.querySelector(".tabs li.active").classList.remove("active");
    document.querySelector(".tabs-panel.active").classList.remove("active");
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
