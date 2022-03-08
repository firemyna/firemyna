export function remixRenderer() {
  return `
import express from "express";
import remix from "@remix-run/express";
import * as functions from "firebase-functions";

const app = express();
app.all("*", remix.createRequestHandler({ build: require("./_renderer") }));

export default functions.https.onRequest(app);
`;
}

export function nextRenderer() {
  return `
import * as admin from "firebase-admin";
import * as functions from "firebase-functions";
import next from "next";
import path from "path";

admin.initializeApp();

const app = next({
  dev: false,
  conf: {
    distDir: path.relative(process.cwd(), path.resolve(__dirname, ".next")),
  },
});

const handler = app.getRequestHandler();

export default functions.https.onRequest((request, response) =>
  app.prepare().then(() => handler(request, response))
);
`;
}
