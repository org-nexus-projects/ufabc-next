import gulp from "gulp";
import gulpif from "gulp-if";
import { log, colors } from "gulp-util";
import named from "vinyl-named";
import webpack from "webpack";
import gulpWebpack from "webpack-stream";
import plumber from "gulp-plumber";
import livereload from "gulp-livereload";
import args from "./lib/args";
import rename from "gulp-rename";

const { VueLoaderPlugin } = require("vue-loader");
const { VueTemplateCompiler } = require("vue-template-compiler");
const ExtractTextPlugin = require("extract-text-webpack-plugin");

const ENV = args.production
  ? "production"
  : args.staging
  ? "staging"
  : "development";

gulp.task("scripts", (cb) => {
  var tmp = {};
  return gulp
    .src([
      "src/scripts/**/**/*.js",
      "src/main.js",
      "src/utils/**/*.js",
      // "src/lib/**/*.js",
    ])
    .pipe(
      plumber({
        // Webpack will log the errors
        errorHandler() {},
      })
    )
    .pipe(named())
    .pipe(
      rename(function (path) {
        tmp[path.basename] = path;
      })
    )
    .pipe(
      gulpWebpack(
        {
          devtool: args.sourcemaps ? "inline-source-map" : false,
          watch: args.watch,
          output: {
            filename: "[name].js",
          },
          plugins: [
            new webpack.DefinePlugin({
              "process.env": {
                NODE_ENV: JSON.stringify(ENV),
              },
              "process.env.VENDOR": JSON.stringify(args.vendor),
            }),
            new VueLoaderPlugin(),
            new ExtractTextPlugin("style.css"),
          ].concat(
            args.production ? [new webpack.optimize.UglifyJsPlugin()] : []
          ),
          module: {
            rules: [
              {
                test: /\.css$/,
                use: ["vue-style-loader", "css-loader", "postcss-loader"],
              },
              {
                test: /\.scss$/,
                use: ["vue-style-loader", "css-loader", "sass-loader"],
              },
              {
                test: /\.(woff|woff2|eot|ttf|svg)$/,
                loader: "url-loader?limit=100000",
              },
              {
                test: /\.sass$/,
                use: [
                  "vue-style-loader",
                  "css-loader",
                  "sass-loader?indentedSyntax",
                ],
              },
              {
                test: /\.vue$/,
                loader: "vue-loader",
                options: {
                  loaders: {
                    // Since sass-loader (weirdly) has SCSS as its default parse mode, we map
                    // the "scss" and "sass" values for the lang attribute to the right configs here.
                    // other preprocessors should work out of the box, no loader config like this necessary.
                    scss: ["vue-style-loader", "css-loader", "sass-loader"],
                    sass: [
                      "vue-style-loader",
                      "css-loader",
                      "sass-loader?indentedSyntax",
                    ],
                  },
                },
              },
              {
                test: /\.js$/,
                loader: "babel-loader",
                exclude: /node_modules/,
              },
              {
                test: /\.(png|jpe?g|gif)(\?.*)?$/,
                loader: "url-loader",
                options: {
                  name: "[name].[ext]?[hash]",
                },
              },
            ],
          },
          resolve: {
            alias: {
              vue$: "vue/dist/vue.common.js",
            },
          },
        },
        webpack,
        (err, stats) => {
          if (err) return;
          log(
            `Finished '${colors.cyan("scripts")}'`,
            stats.toString({
              chunks: false,
              colors: true,
              cached: false,
              children: false,
            })
          );
        }
      )
    )
    .pipe(
      rename(function (path) {
        path.dirname = tmp[path.basename].dirname;
      })
    )
    .pipe(gulp.dest(`dist/${args.vendor}/scripts/`))
    .pipe(gulpif(args.watch, livereload()));
});
