# Firemyna 💖 Remix

## Getting started

### Init Remix project

First, let's init Remix project following the [official instructions](https://remix.run/docs/en/v1/tutorials/blog) using **Remix App Server** as the target:

```bash
npx create-remix@latest # Choose Remix App Server!
cd APP_NAME
```

### Setup Firebase configuration

You'll need to add `.firebaserc` with your Firebase project id:

```json
{
  "projects": {
    "default": "FIREBASE_PROJECT_ID"
  }
}
```

> _It defines the Firebase project id to use when starting the emulator and deploying the app._

### Adjust Remix configuration

Now, we need to adjust the Remix configuration and set [`assetsBuildDirectory`](https://remix.run/docs/en/v1/api/conventions#assetsbuilddirectory) and [`serverBuildPath`](https://remix.run/docs/en/v1/api/conventions#serverbuildpath):

```diff
--- a/remix.config.js
+++ b/remix.config.js
@@ -4,8 +4,11 @@
 module.exports = {
   ignoredRouteFiles: [".*"],
   // appDirectory: "app",
-  // assetsBuildDirectory: "public/build",
-  // serverBuildPath: "build/index.js",
+  assetsBuildDirectory:
+    process.env.NODE_ENV === "development"
+      ? "public/build"
+      : "build/production/hosting/build",
+  serverBuildPath: "build/production/functions/_renderer.js",
   // publicPath: "/build/",
   // devServerPort: 8002
 };
```

> _This change sets the production build paths. The Node.js runtime will deploy as a renderer function, and the assets will deploy to Firebase Hosting._

### Install Firemyna & Firebase dependencies

Install Firebase, Firemyna, Express and `@remix-run/express` packages:

```bash
npm install firebase-functions firebase-admin @remix-run/express express --save
npm install firebase-tools firemyna --save-dev
```

### Adjust the scripts

Replace the Remix commands with Firemyna:

```diff
--- a/package.json
+++ b/package.json
@@ -29,8 +29,7 @@
   "sideEffects": false,
   "scripts": {
     "postinstall": "remix setup node",
-    "build": "cross-env NODE_ENV=production remix build",
-    "dev": "cross-env NODE_ENV=development remix dev",
-    "start": "cross-env NODE_ENV=production remix-serve build"
+    "build": "firemyna build",
+    "dev": "firemyna dev"
   }
 }
```

### Init Firemyna

Now, initialize the Firemyna. It will generate the Firemyna config file and
functions directory with a demo function:

```bash
npx firemyna init --preset remix
```

## Developing

To start working on the project, run the `dev` script:

```bash
npm run dev
```

It will start the Remix project on [localhost:3000](http://localhost:3000/) and Firebase Functions on `localhost:5000` with the demo function running at `http://localhost:5000/FIREBASE_PROJECT_ID/us-central1/hello`.

See the logs for more details.

## Building

To build the project before deploying to production, run the `build` script:

```bash
npm run build
```

It will build the Remix project to `dist/production/hosting` and the functions to `dist/production/functions`.

## Previewing the build

To preview the built project, cd to `dist/production` and run `firebase serve`

```bash
cd dist/production
npx firebase serve
```

It will start both web and functions on [localhost:5000](http://localhost:5000/).

## Deploying

To deploy the project, cd to `dist/production` and run `firebase deploy`:

```bash
cd dist/production
npx firebase deploy
```

## Further reading

Refer to the [Firemyna README](https://github.com/kossnocorp/firemyna#readme) for more details.
