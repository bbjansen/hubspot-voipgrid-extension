const path = require("path");
const CleanWebpackPlugin = require("clean-webpack-plugin");
module.exports = {
  entry: "./app/index.js",
  mode: "development",
  plugins: [new CleanWebpackPlugin("build")],
  output: {
    filename: "index_combined.js",
    libraryTarget: "umd",
    path: path.resolve(__dirname, "bin")
  },
  devServer: {
    contentBase: "./app",
    publicPath: "/bin",
    https: true,
    port: 9025,
    disableHostCheck: false
  }
};
