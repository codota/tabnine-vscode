import runBinary from "./binary/runBinary";

main().catch(console.error);

async function main() {
  const code = await reportUninstall("--uninstalled");

  process.exit(code);
}

function reportUninstall(uninstallType: string): Promise<number | undefined> {
  return new Promise<number | undefined>((resolve, reject) => {
    const process = runBinary([uninstallType], true);

    process.on("exit", (code, signal) => {
      if (signal) {
        reject(new Error(`TabNine aborted with ${signal} signal`));
      }

      resolve(code ?? undefined);
    });

    process.on("error", (err) => {
      reject(err);
    });
  });
}
