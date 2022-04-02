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
@@ -1,3 +1,5 @@
 // https://astro.build/config
-export default defineConfig({});
+export default defineConfig({
+  dist: './dist/production/hosting',
+});
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
npm install firebase-functions firebase-admin --save
npm install firebase-tools firemyna --save-dev
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
+    "start": "firemyna dev",
+    "build": "firemyna build",
   },
   "devDependencies": {
     "astro": "^0.20.12"
```

### Init Firemyna

Now, initialize the Firemyna. It will generate the Firemyna config file and
functions directory with a demo function:

```bash
npx firemyna init --preset astro
```

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

It will build the Astro project to `dist/production/hosting` and the functions to `dist/production/functions`.

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
