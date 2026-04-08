const { expo } = require('./app.json');

const existingPlugins = Array.isArray(expo.plugins) ? expo.plugins : [];
const hasMapLibrePlugin = existingPlugins.some((plugin) => {
  if (Array.isArray(plugin)) {
    return plugin[0] === '@maplibre/maplibre-react-native';
  }
  return plugin === '@maplibre/maplibre-react-native';
});

module.exports = {
  ...expo,
  plugins: hasMapLibrePlugin
    ? existingPlugins
    : [...existingPlugins, '@maplibre/maplibre-react-native'],
};
