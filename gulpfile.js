var gulp = require('gulp');
var ts = require('gulp-typescript');
var flatten = require('gulp-flatten');
var less = require('gulp-less');
var merge = require('merge2');
var electron = require('gulp-electron');
var del = require('del');

var hudProject = ts.createProject('src-hud/tsconfig.json');
var srvProject = ts.createProject('src-server/tsconfig.json');
var appProject = ts.createProject('src-app/tsconfig.json');

gulp.task('build', ['package-app']);

gulp.task('build-frontend', ['build-backend', 'copy-html', 'copy-img', 'compile-less'], () => hudProject.src().pipe(hudProject()).js.pipe(gulp.dest("bin/")));

gulp.task('build-backend', () => {
    let ts = srvProject.src().pipe(srvProject());
    return merge(
        ts.js.pipe(gulp.dest("bin/")),
        ts.dts.pipe(gulp.dest("ref/"))
    );
});

gulp.task('build-app', ['build-frontend', 'copy-config', 'copy-deps', 'copy-package'], () => appProject.src().pipe(appProject()).js.pipe(gulp.dest("bin/")));

gulp.task('package-app', ['clean-old-release', 'build-app'], () => {
    var packageJson = require('./bin/package.json');
    gulp.src("")
    .pipe(electron({
        src: './bin',
        packageJson: packageJson,
        release: './release',
        cache: './cache',
        version: 'v1.6.8',
        packaging: false,
        // token: 'abc123...',
        platforms: ['win32-x64'],
        platformResources: {
            win: {
                "version-string": packageJson.version,
                "file-version": packageJson.version,
                "product-version": packageJson.version,
                "icon": './img/pokemon.ico' //icon from http://www.iconspedia.com/icon/pokemon-icon-44128.html
            }
        }
    }))
    .pipe(gulp.dest(""));
});

gulp.task('clean-old-release', () => del('release/'));

gulp.task('compile-less', ['copy-fonts'], ()=> gulp.src('./styles/**/*.less') .pipe(less()).pipe(gulp.dest('bin/')));

gulp.task('copy-config', () => gulp.src('./config.json').pipe(gulp.dest('bin/')));

gulp.task('copy-fonts', () => gulp.src('./styles/fonts/*').pipe(gulp.dest('bin/fonts/')));

gulp.task('copy-html', () => gulp.src('./src*/*.html').pipe(flatten()).pipe(gulp.dest('bin/')));

gulp.task('copy-img', () => gulp.src('./img/**/*').pipe(gulp.dest('bin/img/')));

gulp.task('copy-package', () => gulp.src('./package.json').pipe(gulp.dest('bin/')));

gulp.task('copy-deps', () => gulp.src('./node_modules/react*/dist/*.js').pipe(flatten()).pipe(gulp.dest('bin/lib/')));