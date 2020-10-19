import { binaryRunInstance } from "./BinaryRun";

main().catch(console.error);

async function main() {
  let code = await reportUninstall("--uninstalled");

  process.exit(code);
}

function reportUninstall(uninstallType: string): Promise<number> {
  return new Promise<number>((resolve, reject) => {
    let process = binaryRunInstance().runTabNine([uninstallType], true);
    process.on("exit", (code, signal) => {
      if (signal) {
        return reject(`TabNine aborted with ${signal} signal`);
      }
      resolve(code);
    });
    process.on("error", (err) => {
      reject(err);
    });
  });
}
