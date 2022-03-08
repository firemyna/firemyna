import { Link } from "remix";

export default function Test() {
  return (
    <div>
      <Link to="/">← Back home</Link>
      <h1>It works</h1>
    </div>
  );
}
