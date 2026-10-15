module.exports = function(api) {
  api.cache(true);

  const presets = [
    ['@babel/env', {
      modules: false,
      // First browser versions with native ES module support. Consumers bundle
      // dist without transpiling it, so raising these changes the syntax they ship.
      targets: {
        android: '61',
        chrome: '61',
        edge: '16',
        firefox: '60',
        ios: '10.3',
        opera: '48',
        safari: '10.1',
        samsung: '8.2'
      }
    }]
  ];

  return {
    presets,
    comments: false
  };
};
