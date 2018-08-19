import vueify from 'gulp-vueify'
import gulp from 'gulp'
import gulpif from 'gulp-if'
import livereload from 'gulp-livereload'
import args from './lib/args'

gulp.task('vue', function () {
  return gulp.src('app/component/**/*.vue')
    .pipe(vueify())
    .pipe(gulp.dest('app/component/'))
    .pipe(gulpif(args.watch, livereload()));
});