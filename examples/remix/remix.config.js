/**
 * @type {import('@remix-run/dev').AppConfig}
 */
module.exports = {
  ignoredRouteFiles: [".*"],
  // appDirectory: "app",
  assetsBuildDirectory:
    process.env.NODE_ENV === "development"
      ? "public/build"
      : "build/production/hosting/build",
  serverBuildPath: "build/production/functions/_renderer.js",
  // publicPath: "/build/",
  // devServerPort: 8002
};
