const HtmlWebpackPlugin = require('html-webpack-plugin');
const { ModuleFederationPlugin } = require('webpack').container;
const { dependencies } = require('./package.json');

module.exports = {
  node: false,
  entry: './src/index',
  resolve: {
    extensions: ['.js', '.jsx', '.json', '.ts', '.tsx'],
  },
  module: {
    rules: [
      {
        test: /\.jsx?$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            cacheDirectory: true,
            cacheCompression: false,
            envName: 'development',
          },
        },
      },
      {
        test: /\.css$/i,
        use: ['style-loader', 'css-loader'],
      },
      {
        test: /\.tsx?$/,
        exclude: /node_modules/,
        loader: 'ts-loader',
      },
      {
        test: /\.(png|jpg|gif|svg)$/,
        loader: 'url-loader',
      },
    ],
  },
  plugins: [
    new HtmlWebpackPlugin({ template: './public/index.html' }),
    new ModuleFederationPlugin({
      name: 'react',
      filename: 'remoteEntry.js',
      exposes: {
        './Calengrade': './src/components/Calengrade',
      },
      shared: {
        react: {
          singleton: true,
          eager: true,
          requiredVersion: dependencies.react,
        },
        'react-dom': {
          singleton: true,
          eager: true,
          requiredVersion: dependencies['react-dom'],
        },
        '@tanstack/react-query': {
          singleton: true,
          requiredVersion: dependencies['@tanstack/react-query'],
        },
        '@tanstack/query-core': {
          singleton: true,
          requiredVersion: dependencies['@tanstack/query-core'],
        },
      },
    }),
  ],
  devServer: {
    port: 3001,
    headers: {
      'access-control-allow-origin': '*',
    },
    hot: true,
  },
};
