// ====== Loading 404 content depends on browser loale ====== //
var userLanguage = navigator.language || navigator.userLanguage;

// Функція для завантаження контенту з файлу
function loadContent(language) {
  var xhr = new XMLHttpRequest();
  xhr.onreadystatechange = function () {
    if (xhr.readyState === 4) {
      if (xhr.status === 200) {
        // Вставити контент на сторінку
        document.addEventListener("DOMContentLoaded", function () {
          // ваш код, що встановлює innerHTML
          document.getElementById("content-404").innerHTML = xhr.responseText;
        });
      } else {
        // Завантажити стандартний контент 404 (en/404.html), якщо файл для визначеної мови не знайдено
        loadDefaultContent();
      }
    }
  };
  // Спробувати завантажити контент для визначеної мови
  xhr.open("GET", "/" + language + "/404.html", true);
  xhr.send();
}
// Функція для завантаження контенту 404 (en/404.html) у випадку не підтримуваної мови браузером
function loadDefaultContent() {
  var xhrDefault = new XMLHttpRequest();
  xhrDefault.onreadystatechange = function () {
    if (xhrDefault.readyState === 4 && xhrDefault.status === 200) {
      // Вставити стандартний контент 404 на сторінку
      document.addEventListener("DOMContentLoaded", function () {
        // ваш код, що встановлює innerHTML
        document.getElementById("content-404").innerHTML =
          xhrDefault.responseText;
      });
    }
  };
  // Завантажити стандартний контент 404 (en/404.html)
  xhrDefault.open("GET", "en/404.html", true);
  xhrDefault.send();
}
// Викликати функцію для завантаження контенту відповідно до мови
loadContent(userLanguage);
// ====== #Loading 404 content depends on browser loale ====== //

// ====== Loading 403 content depends on browser loale ====== //
// Функція для завантаження контенту з файлу
function load403Content(language) {
  var xhr = new XMLHttpRequest();
  xhr.onreadystatechange = function () {
    if (xhr.readyState === 4) {
      if (xhr.status === 200) {
        // Вставити контент на сторінку
        document.addEventListener("DOMContentLoaded", function () {
          // ваш код, що встановлює innerHTML
          document.getElementById("content-403").innerHTML = xhr.responseText;
        });
      } else {
        // Завантажити стандартний контент 404 (en/404.html), якщо файл для визначеної мови не знайдено
        loadDefaultContent();
      }
    }
  };
  // Спробувати завантажити контент для визначеної мови
  xhr.open("GET", "/" + language + "/403.html", true);
  xhr.send();
}
// Функція для завантаження контенту 403 (en/403.html) у випадку не підтримуваної мови браузером
function loadDefaultContent() {
  var xhrDefault = new XMLHttpRequest();
  xhrDefault.onreadystatechange = function () {
    if (xhrDefault.readyState === 4 && xhrDefault.status === 200) {
      // Вставити стандартний контент 403 на сторінку
      document.addEventListener("DOMContentLoaded", function () {
        // ваш код, що встановлює innerHTML
        document.getElementById("content-403").innerHTML =
          xhrDefault.responseText;
      });
    }
  };
  // Завантажити стандартний контент 404 (en/404.html)
  xhrDefault.open("GET", "en/403.html", true);
  xhrDefault.send();
}
load403Content(userLanguage);
// ====== #Loading 403 content depends on browser loale ====== //

// ====== Loading 500 content depends on browser loale ====== //
// Функція для завантаження контенту з файлу
function load500Content(language) {
  var xhr = new XMLHttpRequest();
  xhr.onreadystatechange = function () {
    if (xhr.readyState === 4) {
      if (xhr.status === 200) {
        // Вставити контент на сторінку
        document.addEventListener("DOMContentLoaded", function () {
          // ваш код, що встановлює innerHTML
          document.getElementById("content-500").innerHTML = xhr.responseText;
        });
      } else {
        // Завантажити стандартний контент 500 (en/500.html), якщо файл для визначеної мови не знайдено
        loadDefaultContent();
      }
    }
  };
  // Спробувати завантажити контент для визначеної мови
  xhr.open("GET", "/" + language + "/500.html", true);
  xhr.send();
}
// Функція для завантаження контенту 403 (en/403.html) у випадку не підтримуваної мови браузером
function loadDefaultContent() {
  var xhrDefault = new XMLHttpRequest();
  xhrDefault.onreadystatechange = function () {
    if (xhrDefault.readyState === 4 && xhrDefault.status === 200) {
      // Вставити стандартний контент 500 на сторінку
      document.addEventListener("DOMContentLoaded", function () {
        // ваш код, що встановлює innerHTML
        document.getElementById("content-500").innerHTML =
          xhrDefault.responseText;
      });
    }
  };
  // Завантажити стандартний контент 404 (en/404.html)
  xhrDefault.open("GET", "en/500.html", true);
  xhrDefault.send();
}
load500Content(userLanguage);
// ====== #Loading 500 content depends on browser loale ====== //
// ====== Loading 503 content depends on browser loale ====== //
// Функція для завантаження контенту з файлу
function load503Content(language) {
  var xhr = new XMLHttpRequest();
  xhr.onreadystatechange = function () {
    if (xhr.readyState === 4) {
      if (xhr.status === 200) {
        // Вставити контент на сторінку
        document.addEventListener("DOMContentLoaded", function () {
          // ваш код, що встановлює innerHTML
          document.getElementById("content-503").innerHTML = xhr.responseText;
        });
      } else {
        // Завантажити стандартний контент 503 (en/503.html), якщо файл для визначеної мови не знайдено
        loadDefaultContent();
      }
    }
  };
  // Спробувати завантажити контент для визначеної мови
  xhr.open("GET", "/" + language + "/503.html", true);
  xhr.send();
}
// Функція для завантаження контенту 503 (en/503.html) у випадку не підтримуваної мови браузером
function loadDefaultContent() {
  var xhrDefault = new XMLHttpRequest();
  xhrDefault.onreadystatechange = function () {
    if (xhrDefault.readyState === 4 && xhrDefault.status === 200) {
      // Вставити стандартний контент 503 на сторінку
      document.addEventListener("DOMContentLoaded", function () {
        // ваш код, що встановлює innerHTML
        document.getElementById("content-503").innerHTML =
          xhrDefault.responseText;
      });
    }
  };
  // Завантажити стандартний контент 503 (en/503.html)
  xhrDefault.open("GET", "en/503.html", true);
  xhrDefault.send();
}
load503Content(userLanguage);
// ====== #Loading 503 content depends on browser loale ====== //
