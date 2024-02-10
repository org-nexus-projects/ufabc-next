import gulp from 'gulp'
import './clean'
import './manifest'
import './scripts'
import './styles'
import './pages'
import './images'
import './chromereload'
import './xdLib'

gulp.task('build', gulp.series(
  'clean',
  'manifest',
  'xdLib',
  'scripts',
  'styles',
  'pages',
  'images',
  'chromereload',
))
