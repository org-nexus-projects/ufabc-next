import gulp from 'gulp'

gulp.task('default', gulp.series('build', (cb) => {
  console.log('DONE');
  cb()
}))
