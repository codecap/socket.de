"use strict";

const { src, dest, watch, series, parallel } = require('gulp');
// Gulp Plugins
var uglify = require('gulp-uglify');
var concat = require('gulp-concat'); 
const rename = require('gulp-rename'); 

const sourcemaps = require('gulp-sourcemaps');

// --- 🛠 FIX: LEGACY JS API ---
// Встановлюємо новий компілятор Dart Sass
const dartSass = require('sass');
// І передаємо його в gulp-sass, щоб використовувати сучасний API
const sass = require('gulp-sass')(dartSass)
// -----------------------------

const postcss = require('gulp-postcss');
const autoprefixer = require('autoprefixer');
const cssnano = require('cssnano');
const newer = require('gulp-newer');

const cp = require("child_process");
const browserSync = require('browser-sync').create(); 

// --- 🛠 FIX: IMAGEMIN PLUGINS (Requires npm install imagemin-*) ---
// Імпорт плагінів для gulp-imagemin. Вони мають бути встановлені окремо.
const imageminGifsicle = async () => (await import('imagemin-gifsicle')).default;
const imageminMozjpeg = async () => (await import('imagemin-mozjpeg')).default;
const imageminOptipng = async () => (await import('imagemin-optipng')).default;
const imageminSvgo = async () => (await import('imagemin-svgo')).default;
// -----------------------------------------------------------------


// File paths
const files = {
    scssPath: '_sass/**/*.scss',
    cssPath: 'assets/',
    jsPath: 'assets/js/main.js',
    imgPath: 'assets/img/**/*',
}


// SCSS Task
function scssTask(){
    return src(files.scssPath)
        .pipe(sourcemaps.init())
        // Виклик sass() коректний, оскільки ми передали dartSass при require
        .pipe(sass().on('error', sass.logError))
        .pipe(postcss([ autoprefixer(),cssnano() ]))
        .pipe(sourcemaps.write('.'))
        .pipe(dest(files.cssPath))
        .pipe(browserSync.stream());
}

// JS Task
function jsTask(){
    return src([
        files.jsPath
    ])
        .pipe(uglify())
        .pipe(dest('_site/assets/js/'))
        .pipe(browserSync.stream());
}

// --- 🛠 FIX: IMAGETASK (Використовує новий синтаксис з плагінами) ---
async function imgTask() {    
    const imagemin = (await import('gulp-imagemin')).default;
    
    return src(files.imgPath)
        .pipe(newer("_site/assets/img/"))
        // Новий синтаксис: imagemin викликається з масивом плагінів
        .pipe(imagemin([
            (await imageminGifsicle())({ interlaced: true }),
            (await imageminMozjpeg())({ quality: 75 }),
            (await imageminOptipng())({ optimizationLevel: 5 }),
            (await imageminSvgo())({ 
                plugins: [
                    { name: 'removeViewBox', active: false }
                ]
            })
        ]))
        .pipe(dest("_site/assets/img/"))
        .pipe(browserSync.stream());
}
// -------------------------------------------------------------------


// Jekyll (вимагає перезавантаження всієї сторінки)
function jekyll(done) {
    const jekyllProcess = cp.spawn("bundle", ["exec", "jekyll", "build"], { stdio: "inherit" });
    jekyllProcess.on('close', done);
    return jekyllProcess;
}

// BrowserSync: ініціалізація сервера
function browserSyncServe(done) {
    browserSync.init({
        server: {
            baseDir: "_site"
        },
        port: 3000,
        host: 'localhost',
        browser: 'default',
        index: 'index.html',
    });
    done();
}

// BrowserSync: перезавантаження сторінки (для Jekyll)
function browserSyncReload(done) {
    browserSync.reload();
    done();
}

// Watch Task: спостерігає за змінами
function watchTask(){

    watch(files.scssPath, series(scssTask)); 
    watch(files.jsPath, series(jsTask)); 
    watch(files.imgPath, series(imgTask)); 
    
    watch(['_includes/**', '_layouts/**/*', 'pages/**','*.html'], series(jekyll, browserSyncReload)); 
}


// --- Gulp Tasks Exports ---

exports.default = series(
    parallel(jekyll, scssTask, jsTask, imgTask), 
    browserSyncServe,
    watchTask
);

// Додатковий таск для чистої збірки
exports.build = series(
    parallel(jekyll, scssTask, jsTask, imgTask)
);