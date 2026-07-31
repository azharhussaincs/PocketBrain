module.exports = function (api) {
  api.cache(true);
  // Resolve via expo's bundled preset so Metro works even when the package
  // is nested (hoisting can omit a top-level babel-preset-expo install).
  let preset;
  try {
    preset = require.resolve('babel-preset-expo');
  } catch {
    preset = require.resolve('expo/node_modules/babel-preset-expo');
  }
  return {
    presets: [preset],
    plugins: ['react-native-reanimated/plugin'],
  };
};
