import * as semver from "semver";
import { asyncExists } from "../../utils/file.utils";
import { runProcess } from "../runProcess";

// A patch to skip this specific version, because of a critical issue in the version
export const BAD_VERSION = "4.0.47";
const TWO_SECONDS_TIMEOUT = 2000;

export default async function isValidBinary(version: string): Promise<boolean> {
  if (version === BAD_VERSION || !(await asyncExists(version))) {
    return false;
  }
  const { proc, readLine } = runProcess(version, ["--print-version"]);

  return new Promise((resolve) => {
    setTimeout(() => {
      console.error(`validating ${version} timeout`);
      resolve(false);
    }, TWO_SECONDS_TIMEOUT);

    proc.on("exit", (code, signal) => {
      if (signal) {
        resolve(false);
      }
    });

    proc.on("error", () => {
      resolve(false);
    });

    readLine.once("line", (line: string) => {
      if (semver.valid(line)) {
        resolve(true);
      } else {
        resolve(false);
      }
    });
  });
}
