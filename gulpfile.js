const gulp = require('gulp')
const standard = require('gulp-standard')

const SOURCES = 'src/**/*.js'
const DIST = 'dist'

// Uses 'standard' javascript style enforcement
gulp.task('standard', () => {
  return gulp.src(SOURCES)
    .pipe(standard())
    .pipe(standard.reporter('default', {
      breakOnError: true
    }))
})

// Sets up nice development environment
gulp.task('watch', () => {
  gulp.watch(SOURCES, ['standard'])
})

gulp.task('default', ['watch', 'standard'])
