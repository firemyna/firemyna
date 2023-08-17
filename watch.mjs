import chokidar from "chokidar";
import { exec } from "child_process";

const build = debounce(() => {
  exec("npx oclif manifest", (error) => {
    if (error) {
      console.error(`Failed to build oclif.manifest.json: ${error}`);
      return;
    }

    console.log("Built oclif.manifest.json");
  });
}, 500);

chokidar.watch("lib", { persistent: true }).on("all", (event) => {
  if (event === "change" || event === "add") build();
});

function debounce(fn, delay) {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => fn(...args), delay);
  };
}
