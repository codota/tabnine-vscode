import * as semver from "semver";
import { asyncExists } from "../../utils/file.utils";
import { runProcess } from "../runProcess";
import { Logger } from "../../utils/logger";

// A patch to skip this specific version, because of a critical issue in the version
const BAD_VERSION = "4.0.47";
const BAD_VERSIONS_RANGE = { start: "4.5.0", end: "4.5.13" };
const TWO_SECONDS_TIMEOUT = 2000;

export function isBadVersion(version: string): boolean {
  const parsedVersion = semver.parse(version);
  if (!parsedVersion) {
    return false;
  }
  const { start, end } = BAD_VERSIONS_RANGE;
  const isInNonValidRange =
    !start ||
    (semver.gte(parsedVersion, start) &&
      (!end || semver.lt(parsedVersion, end)));
  return isInNonValidRange || parsedVersion.compare(BAD_VERSION) === 0;
}

export default async function isValidBinary(version: string): Promise<boolean> {
  if (!(await asyncExists(version))) {
    return false;
  }
  const { proc, readLine } = runProcess(version, ["--print-version"]);

  return new Promise((resolve) => {
    setTimeout(() => {
      Logger.error(`validating ${version} timeout`);
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
