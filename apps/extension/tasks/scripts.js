import gulp from 'gulp'
import gulpif from 'gulp-if'
import { log, colors } from 'gulp-util'
import named from 'vinyl-named'
import webpack from 'webpack'
import gulpWebpack from 'webpack-stream'
import plumber from 'gulp-plumber'
import livereload from 'gulp-livereload'
import args from './lib/args'
import rename from 'gulp-rename'

const { VueLoaderPlugin } = require('vue-loader')
const { VueTemplateCompiler } = require('vue-template-compiler')

const ENV = args.production ? 'production' : (args.staging ? 'staging': 'development')

gulp.task('scripts', (cb) => {
  var tmp = {}
  return gulp.src(['app/scripts/**/**/*.js'])
    .pipe(plumber({
      // Webpack will log the errors
      errorHandler () {}
    }))
    .pipe(named())
    .pipe(rename(function (path) {
      tmp[path.basename] = path;
    }))
    .pipe(gulpWebpack({
      devtool: args.sourcemaps ? 'inline-source-map' : false,
      watch: args.watch,
      output: {
        filename: '[name].js',
      },
      plugins: [
        new webpack.DefinePlugin({
          'process.env': {
            'NODE_ENV': JSON.stringify(ENV)
          },
          'process.env.VENDOR': JSON.stringify(args.vendor)
        }),
        new VueLoaderPlugin()
      ].concat(args.production ? [
        new webpack.optimize.UglifyJsPlugin()
      ]: []),
      module: {
        loaders: [{
          test: /\.vue$/,
          loader: 'vue-loader'
        }],
        rules: [{
          test: /\.js$/,
          loader: 'babel-loader'
        }, {
          test: /\.vue$/,
          loader: 'vue-loader'
        }]
      },
      resolve: {
        alias: {
          'vue$': 'vue/dist/vue.common.js'
        }
      }
    },
    webpack,
    (err, stats) => {
      if (err) return
      log(`Finished '${colors.cyan('scripts')}'`, stats.toString({
        chunks: false,
        colors: true,
        cached: false,
        children: false
      }))
    }))
    .pipe(rename(function (path) {
      path.dirname = tmp[path.basename].dirname;
    }))
    .pipe(gulp.dest(`dist/${args.vendor}/scripts/`))
    .pipe(gulpif(args.watch, livereload()))
})
