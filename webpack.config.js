/* eslint-disable import/no-extraneous-dependencies, @typescript-eslint/no-var-requires,  @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access */
// @ts-check

const path = require("path");
const webpack = require("webpack");
const TerserPlugin = require("terser-webpack-plugin");
const { BundleAnalyzerPlugin } = require("webpack-bundle-analyzer");

/* *@type {import('webpack').Configuration} */
const config = {
  target: "node", // vscode extensions run in a Node.js-context 📖 -> https://webpack.js.org/configuration/node/

  entry: {
    extension: "./src/extension.ts",
  }, // the entry point of this extension, 📖 -> https://webpack.js.org/configuration/entry-context/
  output: {
    // the bundle is stored in the 'dist' folder (check package.json), 📖 -> https://webpack.js.org/configuration/output/
    path: path.resolve(__dirname, "out"),
    filename: `[name].js`,
    libraryTarget: "commonjs2",
    devtoolModuleFilenameTemplate: "../[resource-path]",
    clean: true,
  },
  node: {
    __dirname: false, // leave the __dirname behavior intact
  },
  devtool: "source-map",
  externals: {
    vscode: "commonjs vscode", // the vscode-module is created on-the-fly and must be excluded. Add other modules that cannot be webpack'ed, 📖 -> https://webpack.js.org/configuration/externals/
  },
  resolve: {
    // support reading TypeScript and JavaScript files, 📖 -> https://github.com/TypeStrong/ts-loader
    extensions: [".ts", ".js"],
    alias: {
      semver: path.resolve(__dirname, "node_modules/semver"),
    },
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        exclude: [/node_modules/, /chat/],
        use: [
          {
            loader: "ts-loader",
          },
        ],
      },
    ],
  },
  plugins: [
    new webpack.IgnorePlugin({
      checkResource: (resource) =>
        [
          "osx-temperature-sensor",
          "@opentelemetry/tracing",
          "applicationinsights-native-metrics",
        ].includes(resource),
    }),
  ],
  infrastructureLogging: {
    level: "log",
  },
  stats: {
    preset: "errors-warnings",
    assets: true,
    colors: true,
    env: true,
    errorsCount: true,
    warningsCount: true,
    timings: true,
  },
  optimization: {
    minimizer: [new TerserPlugin({ extractComments: false })],
  },
};

module.exports = (env) => {
  if (env.analyzeBundle) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    config.plugins.push(new BundleAnalyzerPlugin());
  }
  if (env.enterprise) {
    config.entry.extension = "./src/enterprise/extension.ts";
  }

  return [config];
};
