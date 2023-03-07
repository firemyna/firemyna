import * as functions from "firebase-functions";

const element = <div>OK</div>; // Make sure JSX is compiled

export default functions.https.onRequest((_request, response) => {
  response.send("OK");
});
