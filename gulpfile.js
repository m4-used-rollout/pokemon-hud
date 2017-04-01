var gulp = require('gulp');
var ts = require('gulp-typescript');
var flatten = require('gulp-flatten');
var less = require('gulp-less');
var browserify = require('gulp-browserify');

var hudProject = ts.createProject('src/tsconfig.json');

gulp.task('build', ['build-frontend', 'copy-config', 'copy-deps', 'copy-package']);

gulp.task('build-frontend', ['copy-html', 'compile-less'], () => hudProject.src().pipe(hudProject()).js.pipe(browserify()).pipe(gulp.dest("bin/")));

gulp.task('compile-less', ['copy-fonts'], ()=> gulp.src('./styles/**/*.less') .pipe(less()).pipe(gulp.dest('bin/')));

gulp.task('copy-config', () => gulp.src('./config.json').pipe(gulp.dest('bin/')));

gulp.task('copy-fonts', () => gulp.src('./styles/fonts/*').pipe(gulp.dest('bin/fonts/')));

gulp.task('copy-html', () => gulp.src('./src/*.html').pipe(gulp.dest('bin/')));

gulp.task('copy-package', () => gulp.src('./package.json').pipe(gulp.dest('bin/')));

gulp.task('copy-deps', () => gulp.src('./node_modules/react*/dist/*.js').pipe(flatten()).pipe(gulp.dest('bin/lib/')));