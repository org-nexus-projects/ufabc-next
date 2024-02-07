import gulp from "gulp";
import webpack from "webpack";
import gulpWebpack from "webpack-stream";
import { log, colors } from "gulp-util";
import named from "vinyl-named";
import rename from "gulp-rename";

import args from "./lib/args";

gulp.task("xdLib", () => {
  const tmp = {};
  return gulp
    .src("src/lib/**/*.js")
    .pipe(named())
    .pipe(
      rename(function (path) {
        tmp[path.basename] = path;
      })
    )
    .pipe(
      gulpWebpack(
        {
          output: {
            filename: "[name].js",
          },
          plugins: [new webpack.optimize.UglifyJsPlugin()],
          module: {
            rules: [
              {
                test: /\.js$/,
                loader: "babel-loader",
                exclude: /node_modules/,
              },
            ],
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
    .pipe(gulp.dest(`dist/${args.vendor}/lib`));
});
