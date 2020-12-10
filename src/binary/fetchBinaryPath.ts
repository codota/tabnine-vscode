import * as fs from "fs";
import * as path from 'path';
import { getRootPath, versionPath } from "./paths";
import sortBySemver from "../semverUtils";

export default function fetchBinaryPath(): string {
  const rootPath = getRootPath();

  try {
    const activePath = path.join(rootPath, '.active');
    if (fs.existsSync(activePath)) {
      const activeVersion = fs.readFileSync(activePath, 'utf-8').trim();
      const activeVersionPath = versionPath(activeVersion);
      if (fs.existsSync(activeVersionPath)) {
          return activeVersionPath;
      }
    }
  } catch(e) {
    console.error("Error handling .active file. Falling back to semver sorting", e);
  }

  const versions = sortBySemver(fs.readdirSync(rootPath)).map(versionPath);
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
