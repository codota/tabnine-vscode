import * as fs from "fs";
import { getRootPath, versionPath } from "./paths";
import sortBySemver from "../semverUtils";

export default function fetchBinaryPath(): string {
  const versions = sortBySemver(fs.readdirSync(getRootPath())).map(versionPath);
  const selectedVersion = versions.find(fs.existsSync);

  if (!selectedVersion) {
    throw new Error(
      `Couldn't find a TabNine binary (tried the following paths: ${versions.join(
        ", "
      )})`
    );
  }

  return selectedVersion;
}
