import gulp from "gulp";
import gulpif from "gulp-if";
import gutil from "gulp-util";
import sourcemaps from "gulp-sourcemaps";
import less from "gulp-less";

import dartSass from "sass";
import gulpSass from "gulp-sass";
const sass = gulpSass(dartSass);

import cleanCSS from "gulp-clean-css";
import livereload from "gulp-livereload";
import cssimport from "gulp-cssimport";
import args from "./lib/args";
import gulpWebpack from "webpack-stream";

gulp.task("styles:css", function () {
  return gulp
    .src("src/styles/*.css")
    .pipe(cssimport())
    .pipe(gulpif(args.sourcemaps, sourcemaps.init()))
    .pipe(gulpif(args.production, cleanCSS()))
    .pipe(gulpif(args.sourcemaps, sourcemaps.write()))
    .pipe(gulp.dest(`dist/${args.vendor}/styles`))
    .pipe(gulpif(args.watch, livereload()));
});

gulp.task("styles:sass", function () {
  return gulp
    .src("src/styles/*.scss")
    .pipe(gulpif(args.sourcemaps, sourcemaps.init()))
    .pipe(
      sass({ includePaths: ["./app"] }).on("error", function (error) {
        gutil.log(
          gutil.colors.red("Error (" + error.plugin + "): " + error.message)
        );
        this.emit("end");
      })
    )
    .pipe(gulpif(args.production, cleanCSS()))
    .pipe(gulpif(args.sourcemaps, sourcemaps.write()))
    .pipe(gulp.dest(`dist/${args.vendor}/styles`))
    .pipe(gulpif(args.watch, livereload()));
});

gulp.task("styles", gulp.series("styles:css", "styles:sass"));
