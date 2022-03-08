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
