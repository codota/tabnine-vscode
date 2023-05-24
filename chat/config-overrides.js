module.exports = function override(config, env) {
  // Define our own filename
  config.output.filename = "vscode.js";

  // This way we only need to load one file for the webview
  config.optimization.splitChunks = {
    cacheGroups: {
      default: false,
    },
  };
  config.optimization.runtimeChunk = false;

  // Makes sure the public path is set in JS so that files are correctly loaded
  config.output.publicPath = "http://localhost:3000/";

  // Specifies the CSS file to output
  config.plugins = config.plugins.map((plugin) => {
    if (plugin.constructor.name === "MiniCssExtractPlugin") {
      plugin.options.filename = `vscode.css`;
    }
    return plugin;
  });

  return config;
};
