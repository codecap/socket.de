"use strict";

const { src, dest, watch, series, parallel } = require('gulp');
const uglify = require('gulp-uglify');
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

const imageminGifsicle = async () => (await import('imagemin-gifsicle')).default;
const imageminMozjpeg = async () => (await import('imagemin-mozjpeg')).default;
const imageminOptipng = async () => (await import('imagemin-optipng')).default;
const imageminSvgo = async () => (await import('imagemin-svgo')).default;

const PATHS = {
    jekyllDest: './_site',
    sitemapSource: './_site/sitemap.xml',
    sitemapRelPath: '/sitemap.xml'
};

const files = {
    scssPath: '_sass/**/*.scss',
    cssPath: 'assets/styles/',
    jsPath: 'assets/js/main.js',
    imgPath: 'assets/img/**/*'
};

/**
 * Compile SCSS files into minified CSS with autoprefixing.
 * @returns {NodeJS.ReadWriteStream}
 */
function scssTask(){
    return src(files.scssPath)
        .pipe(sourcemaps.init())
        .pipe(sass().on('error', sass.logError))
        .pipe(postcss([ autoprefixer(), cssnano() ]))
        .pipe(sourcemaps.write('.'))
        .pipe(dest(files.cssPath))
        .pipe(browserSync.stream());
}

/**
 * Minify JavaScript files and output to _site.
 * @returns {NodeJS.ReadWriteStream}
 */
function jsTask(){
    return src([files.jsPath])
        .pipe(uglify())
        .pipe(dest('_site/assets/js/'))
        .pipe(browserSync.stream());
}

/**
 * Optimize images and output to _site.
 * @returns {Promise<NodeJS.ReadWriteStream>}
 */
async function imgTask() {    
    const imagemin = (await import('gulp-imagemin')).default;
    
    return src(files.imgPath)
        .pipe(newer("_site/assets/img/"))
        .pipe(imagemin([
            (await imageminGifsicle())({ interlaced: true }),
            (await imageminMozjpeg())({ quality: 75 }),
            (await imageminOptipng())({ optimizationLevel: 5 }),
            (await imageminSvgo())({ plugins: [{ name: 'removeViewBox', active: false }] })
        ]))
        .pipe(dest("_site/assets/img/"))
        .pipe(browserSync.stream());
}

/**
 * Build Jekyll site using the specified configuration.
 * @param {Function} done
 */
function jekyllBuild(done) {
    const jekyllArgs = ["exec", "jekyll", "build", "--config", "_config.yaml"];
    const jekyllProcess = cp.spawn("bundle", jekyllArgs, { stdio: "inherit" });
    jekyllProcess.on('close', done);
}

/**
 * Copy sitemap.xml to /en and /de directories with localized paths.
 * @returns {NodeJS.ReadWriteStream}
 */
function sitemapCopy() {
    src(PATHS.sitemapSource)
        .pipe(replace(PATHS.sitemapRelPath, '/en' + PATHS.sitemapRelPath)) 
        .pipe(dest(PATHS.jekyllDest + '/en'));

    return src(PATHS.sitemapSource)
        .pipe(replace(PATHS.sitemapRelPath, '/de' + PATHS.sitemapRelPath))
        .pipe(dest(PATHS.jekyllDest + '/de'));
}

/**
 * Start BrowserSync server for live reload.
 * @param {Function} done
 */
function browserSyncServe(done) {
    browserSync.init({
        server: { baseDir: PATHS.jekyllDest },
        port: 3000,
        host: 'localhost',
        browser: 'default',
    });
    done();
}

/**
 * Reload BrowserSync server.
 * @param {Function} done
 */
function browserSyncReload(done) {
    browserSync.reload();
    done();
}

/**
 * Watch for changes in source files and trigger tasks.
 */
function watchTask(){
    watch(files.scssPath, series(scssTask)); 
    watch(files.jsPath, series(jsTask)); 
    watch(files.imgPath, series(imgTask)); 
    
    watch(
        ['**/*.html', '**/*.md', '_data/**/*.yml', '_layouts/**/*', '_includes/**/*'],
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
