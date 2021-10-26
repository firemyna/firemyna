import * as functions from "firebase-functions";

export default functions.https.onRequest((_request, response) => {
  response.send("Привет, жестокий мир!");
});
