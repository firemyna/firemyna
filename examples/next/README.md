# Firemyna 💖 Next.js

## Getting started

### Init Next.js project

First, let's init Next.js project following the [official instructions](https://nextjs.org/docs/getting-started) :

```bash
npx create-next-app@latest
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

### Install Firemyna & Firebase dependencies

Install Firebase and Firemyna packages:

```bash
npm install firebase-functions firebase-admin --save
npm install firebase-tools firemyna --save-dev
```

### Adjust the scripts

Replace the Next.js commands with Firemyna:

```diff
--- a/package.json
+++ b/package.json
@@ -3,9 +3,8 @@
   "version": "0.1.0",
   "private": true,
   "scripts": {
-    "dev": "next dev",
-    "build": "next build",
-    "start": "next start",
+    "dev": "firemyna dev",
+    "build": "firemyna build",
     "lint": "next lint"
   },
   "dependencies": {
```

### Init Firemyna

Now, initialize the Firemyna. It will generate the Firemyna config file and
functions directory with a demo function:

```bash
npx firemyna init --preset next
```

## Developing

To start working on the project, run the `dev` script:

```bash
npm run dev
```

It will start the Next.js project on [localhost:3000](http://localhost:3000/) and Firebase Functions on `localhost:5000` with the demo function running at `http://localhost:5000/FIREBASE_PROJECT_ID/us-central1/hello`.

See the logs for more details.

## Building

To build the project before deploying to production, run the `build` script:

```bash
npm run build
```

It will build the Next.js project to `dist/production/hosting` and the functions to `dist/production/functions`.

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
