import * as semver from "semver";
import * as fs from "fs";
import BinaryPaths from "./BinaryPaths";

const FIRST = -1;
const EQUAL = 0;
const SECOND = 1;

export default class BinaryVersionFetcher {
  constructor(private binaryPaths: BinaryPaths) {}

  public fetchBinary(): string {
    const versions = sortBySemver(
      fs.readdirSync(this.binaryPaths.getRootPath())
    );

    for (let version of versions) {
      const full_path = this.binaryPaths.versionPath(version);

      if (fs.existsSync(full_path)) {
        return full_path;
      }
    }

    throw new Error(
      `Couldn't find a TabNine binary (tried the following paths: ${versions})`
    );
  }
}

function sortBySemver(versions: string[]) {
  versions.sort(cmpSemver);

  return versions;
}

function cmpSemver(a, b): number {
  const a_valid = semver.valid(a);
  const b_valid = semver.valid(b);

  if (a_valid && b_valid) {
    return semver.rcompare(a, b);
  } else if (a_valid) {
    return FIRST;
  } else if (b_valid) {
    return SECOND;
  } else if (a < b) {
    return FIRST;
  } else if (a > b) {
    return SECOND;
  } else {
    return EQUAL;
  }
}
