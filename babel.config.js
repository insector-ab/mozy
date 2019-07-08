module.exports = function(api) {
  api.cache(false);

  const presets = [
    ['@babel/env']
  ];

  const plugins = [
    'istanbul'
  ];

  return {
    presets,
    plugins,
    comments: false
  };
};
