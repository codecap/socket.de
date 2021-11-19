jQuery(document).ready(function($){
	// Responsive menu with hamburger.
	$("#hamburger").on("click", function(){
		  $(this).toggleClass("hamburger__open");
		  $( ".nav-top" ).toggleClass( "open" );
		  $("html").toggleClass( "fixed" );
	}); // #Responsive menu with hamburger.


});

// Google map.
function initMap(){
  // The location of Uluru
    const sl = { lat: 50.084265, lng: 8.661599 };
    // The map, centered at Uluru
    const map = new google.maps.Map(document.getElementById("map"), {
      zoom: 15,
      center: sl,
    });
    // The marker, positioned at Uluru
    const iconFolder = 'assets/img/';
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
  el.addEventListener("click", e => {
    e.preventDefault();

    document.querySelector(".tabs li.active").classList.remove("active");
    document.querySelector(".tabs-panel.active").classList.remove("active");

    const parentListItem = el.parentElement;
    parentListItem.classList.add("active");
    const index = [...parentListItem.parentElement.children].indexOf(parentListItem);

    const panel = [...tabPanels].filter(el => el.getAttribute("data-index") == index);
    panel[0].classList.add("active");
    });
  }

// Load More
const loadmore = document.querySelector('#loadmore');
let currentItems = 2;
loadmore.addEventListener('click', (e) => {
	e.preventDefault();
    const elementList = [...document.querySelectorAll('.clients_block .client_block')];
		const el = elementList.length - 2; // Take the penultimate item
		for (let i = currentItems; i <= currentItems + 2; i++) {
			  if (elementList[i] && i != el) {
					elementList[i].style.display = 'block';
        }
    }
    currentItems += 2;

    if (currentItems >= elementList.length) {
        event.target.style.display = 'none';
    }
});
