module.exports = function(api) {
  const isEsm = api.env('esm');
  api.cache(true);

  const presets = [
    ['@babel/env', {
      modules: isEsm ? false : 'auto',
      targets: isEsm ? { esmodules: true } : undefined
    }]
  ];

  return {
    presets,
    plugins: process.env.NYC_PROCESS_ID ? ['istanbul'] : [],
    comments: false
  };
};
