import * as fs from "fs";
import { getRootPath, versionPath } from "./paths";
import { sortBySemver } from "../semverUtils";

export function fetchBinary(): string {
  const versions = sortBySemver(fs.readdirSync(getRootPath()));

  for (let version of versions) {
    const full_path = versionPath(version);

    if (fs.existsSync(full_path)) {
      return full_path;
    }
  }

  throw new Error(
    `Couldn't find a TabNine binary (tried the following paths: ${versions})`
  );
}
