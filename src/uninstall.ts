import { runTabNine } from "./binary/run";

main().catch(console.error);

async function main() {
  let code = await reportUninstall("--uninstalled");

  process.exit(code);
}

function reportUninstall(uninstallType: string): Promise<number | undefined> {
  return new Promise<number | undefined>((resolve, reject) => {
    let process = runTabNine([uninstallType], true);

    process.on("exit", (code, signal) => {
      if (signal) {
        return reject(`TabNine aborted with ${signal} signal`);
      }

      resolve(code ?? undefined);
    });

    process.on("error", (err) => {
      reject(err);
    });
  });
}
