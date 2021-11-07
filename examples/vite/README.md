# Firemyna 💖 Vite

## Getting started

### Init Vite project

First, let's init Vite project following the [official instructions](https://vitejs.dev/guide/#scaffolding-your-first-vite-project):

```bash
npm init vite PROJECT_NAME
cd PROJECT_NAME
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

### Adjust Vite configuration

Now, we need to adjust the Vite configuration and set `./dist/production/hosting` as the [`build.outDir`](https://vitejs.dev/config/#build-outdir) property:

```diff
--- a/vite.config.ts
+++ b/vite.config.ts
@@ -3,5 +3,9 @@ import preact from '@preact/preset-vite'

 // https://vitejs.dev/config/
 export default defineConfig({
-  plugins: [preact()]
+  plugins: [preact()],
+
+  build: {
+    outDir: 'dist/production/hosting'
+  }
 })
```

> _This change separates the development and production environments and distinguishes Vite's static assets that we'll deploy to Firebase Hosting._

### Install Firemyna & Firebase dependencies

Install Firemyna package:

```bash
npm install firemyna firebase-functions firebase-admin --save
npm install firebase-tools --save-dev
```

### Adjust the scripts

Replace the Vite commands with Firemyna:

```diff
--- a/package.json
+++ b/package.json
@@ -2,9 +2,8 @@
   "name": "firemyna-vite",
   "version": "0.0.0",
   "scripts": {
-    "dev": "vite",
-    "build": "tsc && vite build",
-    "serve": "vite preview"
+    "dev": "firemyna start --preset vite",
+    "build": "firemyna build --preset vite"
   },
   "dependencies": {
     "firebase-admin": "^10.0.0",
```

### Init Firemyna

Now, initialize the Firemyna. It will only generate functions directory with a demo function:

```bash
npx firemyna init --preset vite
```

> _You can also create a directory `src/functions` and add files exposing Firebase functions as the default exports. The name of the file will be the name of the function._

## Developing

To start working on the project, run the `start` script:

```bash
npm start
```

It will start the Vite project on [localhost:3000](http://localhost:3000/) and Firebase Functions on `localhost:5000` with the demo function running at `http://localhost:5000/FIREBASE_PROJECT_ID/us-central1/hello`.

See the logs for more details.

## Building

To build the project before deploying to production, run the `build` script:

```bash
npm run build
```

It will build the Vite project to `dist/production/hosting` and the functions to `dist/production/functions`.

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
