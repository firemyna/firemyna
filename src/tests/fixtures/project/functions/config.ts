import * as functions from "firebase-functions";

const config = functions.config();

export default functions.https.onRequest((_request, response) => {
  response.send("<pre>" + JSON.stringify(config, null, 2) + "</pre>");
});
