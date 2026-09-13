// Autonomously AI-generated test launcher at the user's request.
import { spawnSync } from "node:child_process";

const selectors = process.argv.slice(2);
const result = spawnSync(process.execPath, ["--test", ...(selectors.length ? selectors : ["test"])], {
  stdio: "inherit",
});
if (result.error) process.stderr.write(`${result.error.message}\n`);
process.exitCode = result.status ?? 1;
// End of autonomously AI-generated test launcher.
