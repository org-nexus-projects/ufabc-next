import gulp from 'gulp'
import './clean'
import './manifest'
import './scripts'
import './styles'
import './pages'
import './images'
import './chromereload'

gulp.task('build', gulp.series(
  'clean',
  'manifest',
  'scripts',
  'styles',
  'pages',
  'images',
  'chromereload',
))
