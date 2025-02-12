var gulp = require('gulp');
var ts = require('gulp-typescript');
var flatten = require('gulp-flatten');
var less = require('gulp-less');
var merge = require('merge2');
var electron = require('gulp-electron');
var sourcemaps = require('gulp-sourcemaps');
var del = require('del');
var changed = require('gulp-changed');

var hudProject = ts.createProject('src-hud/tsconfig.json');
var dexNavProject = ts.createProject('src-dexnav/tsconfig.json');
var srvProject = ts.createProject('src-server/tsconfig.json');
var appProject = ts.createProject('src-app/tsconfig.json');

gulp.task('clean-old-release', () => del('release/'));

gulp.task('copy-ini', () => gulp.src('./*.ini', { encoding: false }).pipe(gulp.dest('bin/')));

gulp.task('copy-data', () => gulp.src('./src-server/data/**/*', { encoding: false }).pipe(gulp.dest('bin/data/')));

gulp.task('copy-fonts', () => gulp.src('./styles/fonts/*', { encoding: false }).pipe(changed('bin/fonts/')).pipe(gulp.dest('bin/fonts/')));

gulp.task('copy-html', () => gulp.src('./src*/*.html', { encoding: false }).pipe(flatten()).pipe(gulp.dest('bin/')));

gulp.task('copy-img', () => gulp.src('./img/**/*', { encoding: false }).pipe(changed('bin/img/')).pipe(gulp.dest('bin/img/')));

gulp.task('copy-package', () => gulp.src('./package.json', { encoding: false }).pipe(gulp.dest('bin/')));

gulp.task('copy-node-packages', () => gulp.src('./node_modules/ini/**/*', { encoding: false }).pipe(gulp.dest('bin/node_modules/ini/')));

gulp.task('copy-deps', gulp.series('copy-node-packages', () => gulp.src('./node_modules/react*/dist/*.js', { encoding: false }).pipe(flatten()).pipe(gulp.dest('bin/lib/'))));

gulp.task('compile-less', gulp.series('copy-fonts', () => gulp.src('./styles/*.less').pipe(sourcemaps.init()).pipe(less()).pipe(sourcemaps.write()).pipe(gulp.dest('bin/'))));

gulp.task('copy-config', gulp.series('copy-ini', () => gulp.src('./config.json', { encoding: false }).pipe(gulp.dest('bin/'))));

gulp.task('build-backend', () => {
    let ts = srvProject.src().pipe(sourcemaps.init()).pipe(srvProject());
    return merge(
        ts.js.pipe(sourcemaps.write()).pipe(gulp.dest("bin/")),
        ts.dts.pipe(gulp.dest("ref/"))
    );
});

gulp.task('build-hud', gulp.series('build-backend', () => hudProject.src().pipe(sourcemaps.init()).pipe(hudProject()).js.pipe(sourcemaps.write()).pipe(gulp.dest("bin/"))));

gulp.task('build-dexnav', gulp.series('build-backend', () => dexNavProject.src().pipe(sourcemaps.init()).pipe(dexNavProject()).js.pipe(sourcemaps.write()).pipe(gulp.dest("bin/"))));

gulp.task('build-frontend', gulp.series('build-backend', 'build-hud', 'build-dexnav', 'copy-html', 'copy-data', 'compile-less', 'copy-img'));

gulp.task('build-app', gulp.series('build-frontend', 'copy-config', 'copy-deps', 'copy-package', () => appProject.src().pipe(appProject()).js.pipe(gulp.dest("bin/"))));

gulp.task('package-app', gulp.series('clean-old-release', 'build-app', () => {
    var packageJson = require('./bin/package.json');
    return gulp.src("./")
        .pipe(electron({
            src: './bin',
            packageJson: packageJson,
            release: './release',
            cache: './cache',
            version: 'v5.0.2',
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
        .pipe(gulp.dest("./"));
}));


gulp.task('build', gulp.series('package-app'));
