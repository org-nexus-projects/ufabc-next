const { defineConfig } = require('@vue/cli-service');
const { ModuleFederationPlugin } = require('webpack').container;
const mfConfig = require('./mf.config');

module.exports = defineConfig({
  devServer: { port: 3000 },
  publicPath: process.env.VUE_APP_BASE_URL,
  transpileDependencies: true,
  configureWebpack: {
    plugins: [new ModuleFederationPlugin(mfConfig)],
  },
});
