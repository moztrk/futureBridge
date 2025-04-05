// metro.config.js
const { getDefaultConfig } = require('@expo/metro-config'); // expo kullanıyorsan
// const { getDefaultConfig } = require('metro-config'); // vanilla react-native

const config = getDefaultConfig(__dirname);

config.resolver.extraNodeModules = {
  ...config.resolver.extraNodeModules,
  process: require.resolve('process/browser'),
};

module.exports = config;
