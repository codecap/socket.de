"use strict";
const { src, dest, watch, series, parallel } = require('gulp');
// Gulp Plugins
var uglify = require('gulp-uglify');
const rename = require('gulp-rename'); 
const replace = require('gulp-replace'); 

const sourcemaps = require('gulp-sourcemaps');

const dartSass = require('sass');
const sass = require('gulp-sass')(dartSass)

const postcss = require('gulp-postcss');
const autoprefixer = require('autoprefixer');
const cssnano = require('cssnano');
const newer = require('gulp-newer');

const cp = require("child_process"); 
const browserSync = require('browser-sync').create(); 

// --- IMAGEMIN PLUGINS ---
const imageminGifsicle = async () => (await import('imagemin-gifsicle')).default;
const imageminMozjpeg = async () => (await import('imagemin-mozjpeg')).default;
const imageminOptipng = async () => (await import('imagemin-optipng')).default;
const imageminSvgo = async () => (await import('imagemin-svgo')).default;


// --- Paths ---
const PATHS = {
    jekyllDest: './_site',
    sitemapSource: './_site/sitemap.xml',
    sitemapRelPath: '/sitemap.xml'
};
const files = {
    scssPath: '_sass/**/*.scss',
    cssPath: 'assets/',
    jsPath: 'assets/js/main.js',
    imgPath: 'assets/img/**/*',
}


// --- SASS ---
function scssTask(){
    return src(files.scssPath)
        .pipe(sourcemaps.init())
        .pipe(sass().on('error', sass.logError))
        .pipe(postcss([ autoprefixer(),cssnano() ]))
        .pipe(sourcemaps.write('.'))
        .pipe(dest(files.cssPath))
        .pipe(browserSync.stream());
}

// --- JS ---
function jsTask(){
    return src([files.jsPath])
        .pipe(uglify())
        .pipe(dest('_site/assets/js/'))
        .pipe(browserSync.stream());
}

// --- IMAGES ---
async function imgTask() {    
    const imagemin = (await import('gulp-imagemin')).default;
    
    return src(files.imgPath)
        .pipe(newer("_site/assets/img/"))
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

function jekyllBuild(done) {
    const jekyllArgs = [
        "exec", 
        "jekyll", 
        "build", 
        "--config", 
        "_config.yaml" 
    ];
    
    const jekyllProcess = cp.spawn("bundle", jekyllArgs, { stdio: "inherit" });
    jekyllProcess.on('close', done);
}

// --- SEO: COPY SITEMAP ---
function sitemapCopy() {
    
    // 1. sitemap.xml in /en/
    src(PATHS.sitemapSource)
        .pipe(replace(PATHS.sitemapRelPath, '/en' + PATHS.sitemapRelPath)) 
        .pipe(dest(PATHS.jekyllDest + '/en'));

    // 2. sitemap.xml in /de/
    return src(PATHS.sitemapSource)
        .pipe(replace(PATHS.sitemapRelPath, '/de' + PATHS.sitemapRelPath))
        .pipe(dest(PATHS.jekyllDest + '/de'));
}
// --- BrowserSync ---
function browserSyncServe(done) {
    browserSync.init({
        server: {
            baseDir: PATHS.jekyllDest,
        },
        port: 3000,
        host: 'localhost',
        browser: 'default',
    });
    done();
}

function browserSyncReload(done) {
    browserSync.reload();
    done();
}

// --- WATCH TASK ---
function watchTask(){

    watch(files.scssPath, series(scssTask)); 
    watch(files.jsPath, series(jsTask)); 
    watch(files.imgPath, series(imgTask)); 
    
    watch(
        [
            '**/*.html', 
            '**/*.md', 
            '_data/**/*.yml', 
            '_layouts/**/*', 
            '_includes/**/*'
        ], 
        { ignored: PATHS.jekyllDest + '/**' }, 
        series(jekyllBuild, sitemapCopy, browserSyncReload)
    ); 
}

exports.default = series(
    parallel(jekyllBuild, scssTask, jsTask, imgTask), 
    sitemapCopy, 
    parallel(browserSyncServe, watchTask)
);

exports.build = series(
    parallel(jekyllBuild, scssTask, jsTask, imgTask),
    sitemapCopy
);