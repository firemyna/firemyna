# Firemyna 💖 Astro

## Getting started

### Init Astro project

First, let's init Astro project following the [official instructions](https://docs.astro.build/getting-started/):

```bash
mkdir PROJECT_NAME
cd PROJECT_NAME
npm init astro
npm install
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

### Adjust Astro configuration

Now, we need to adjust the Astro configuration and set `./dist/production/hosting` as the `dist` property:

```diff
--- a/astro.config.mjs
+++ b/astro.config.mjs
@@ -1,7 +1,7 @@
 export default {
   // projectRoot: '.',     // Where to resolve all URLs relative to. Useful if you have a monorepo project.
   // pages: './src/pages', // Path to Astro components, pages, and data
-  // dist: './dist',       // When running `astro build`, path to final static output
+  dist: './dist/production/hosting',
   // public: './public',   // A folder of static files Astro will copy to the root. Useful for favicons, images, and other files that don’t need processing.
   buildOptions: {
     // site: 'http://example.com',           // Your public domain, e.g.: https://my-site.dev/. Used to generate sitemaps and canonical URLs.
```

> _This change separates the development and production environments and distinguishes Astro's static assets that we'll deploy to Firebase Hosting._

### Adjust Snowpack configuration

We need to initialize Snowpack, so it would generate the configuration file:

```bash
npx snowpack init
```

Then, adjust the config to exclude the functions directory:

```diff
--- a/snowpack.config.js
+++ b/snowpack.config.js
@@ -18,4 +18,5 @@ module.exports = {
   buildOptions: {
     /* ... */
   },
+  exclude: ["**/node_modules/**/*", "**/src/functions/**/*"],
 };
```

> _It tells Snowpack to ignore the functions directory, so it would not trip over server-side code._

### Install Firemyna & Firebase dependencies

Install Firemyna package:

```bash
npm install firemyna firebase-functions firebase-admin --save
npm install firebase-tools --save-dev
```

### Adjust the scripts

Replace the Astro commands with Firemyna:

```diff
--- a/package.json
+++ b/package.json
@@ -3,10 +3,10 @@
   "version": "0.0.1",
   "private": true,
   "scripts": {
-    "dev": "astro dev",
-    "start": "astro dev",
-    "build": "astro build",
-    "preview": "astro preview"
+    "dev": "firemyna watch --preset astro",
+    "start": "firemyna watch --preset astro",
+    "build": "firemyna build --preset astro",
   },
   "devDependencies": {
     "astro": "^0.20.12"
```

### Init Firemyna

Now, initialize the Firemyna. It will only generate functions directory with a demo function:

```bash
npx firemyna init --preset astro
```

> _You can also create a directory `src/functions` and add files exposing Firebase functions as the default exports. The name of the file will be the name of the function._

## Developing

To start working on the project, run the `start` script:

```bash
npm start
```

It will start the Astro project on [localhost:3000](http://localhost:3000/) and Firebase Functions on `localhost:5000` with the demo function running at `http://localhost:5000/FIREBASE_PROJECT_ID/us-central1/hello`.

See the logs for more details.

## Building

To build the project before deploying to production, run the `build` script:

```bash
npm run build
```

It will build the Astro project to `dist/production/hosting` and the functions to `dist/production`.

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
