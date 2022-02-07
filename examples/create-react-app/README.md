# Firemyna 💖 Create React App

## Getting started

### Init Create React App project

First, let's init Create React App project following the [official instructions](https://reactjs.org/docs/create-a-new-react-app.html#create-react-app):

```bash
npx create-react-app PROJECT_NAME
cd PROJECT_NAME
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

Install Firemyna package:

```bash
npm install firemyna firebase-functions firebase-admin --save
npm install firebase-tools --save-dev
```

### Adjust the scripts

Replace the Create React App commands with Firemyna:

```diff
--- a/package.json
+++ b/package.json
@@ -12,8 +12,8 @@
     "web-vitals": "^1.1.2"
   },
   "scripts": {
-    "start": "react-scripts start",
-    "build": "react-scripts build",
+    "start": "firemyna dev",
+    "build": "firemyna build",
     "test": "react-scripts test",
     "eject": "react-scripts eject"
   },
```

### Init Firemyna

Now, initialize the Firemyna. It will generate the Firemyna config file and
functions directory with a demo function:

```bash
npx firemyna init --preset cra
```

## Building

To build the project before deploying to production, run the `build` script:

```bash
npm run build
```

It will build the Create React App project to `dist/production/hosting` and the functions to `dist/production/functions`.

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
