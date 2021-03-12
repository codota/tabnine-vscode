import * as fs from "fs";
import { runProcess } from "../runProcess";
// import { runProcess } from "../runProcess";

export default async function isValidBinary(version: string): Promise<boolean> {
  const exists = fs.existsSync(version);
  if (!exists) {
    return false;
  }
  const { proc, readLine } = runProcess(version, ["--print-version"]);

  return new Promise((resolve) => {
    setTimeout(() => {
      console.error(`validating ${version} timeout out`);
      resolve(false);
    }, 1000);

    proc.on("exit", (code, signal) => {
      if (code || signal) {
        resolve(false);
      }
    });

    proc.on("error", () => {
      resolve(false);
    });

    readLine.once("line", (line: string) => {
      if (line) {
        resolve(true);
      } else {
        resolve(false);
      }
    });
  });
}
