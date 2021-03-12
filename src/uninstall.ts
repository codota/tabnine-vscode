import runBinary from "./binary/runBinary";

main().catch(console.error);

async function main() {
  const code = await reportUninstall("--uninstalled");

  process.exit(code);
}

function reportUninstall(uninstallType: string): Promise<number | undefined> {
  return new Promise<number | undefined>( (resolve, reject) => {
    void runBinary([uninstallType], true).then(({ proc }) => {
      proc.on("exit", (code, signal) => {
        if (signal) {
          reject(new Error(`TabNine aborted with ${signal} signal`));
        }
  
        resolve(code ?? undefined);
      });
  
      proc.on("error", (err) => {
        reject(err);
      });
    }, err => {
      reject(err);
    })
  });
}
