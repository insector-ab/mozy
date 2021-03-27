module.exports = function(api) {
  api.cache(false);

  const presets = [
    ['@babel/env']
  ];

  return {
    presets,
    plugins: process.env.NYC_PROCESS_ID ? ['istanbul'] : [],
    comments: false
  };
};
