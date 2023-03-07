import * as functions from "firebase-functions";

type Works = true; // Make sure TypeScript is compiled
const element = <div>OK</div>; // Make sure JSX is compiled

export default functions.https.onRequest((_request, response) => {
  response.send("OK");
});
