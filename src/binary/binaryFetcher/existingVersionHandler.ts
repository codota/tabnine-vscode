import { existsSync, promises as fs } from "fs";
import sortBySemver from "../../utils/semver.utils";
import { asyncFind } from "../../utils/utils";
import isValidBinary from "./binaryValidator";
import { getRootPath, versionPath } from "../paths";
import * as path from "path";
import { setDirectoryFilesAsExecutable } from "../utils";

export default async function handleExistingVersion(): Promise<string | null> {
  try {
    const versionPaths = await fs.readdir(getRootPath());
    await Promise.all(
      versionPaths
        .map((version) => path.dirname(versionPath(version)))
        .filter((path) => existsSync(path))
        .map(async (path) => setDirectoryFilesAsExecutable(path))
    );
    const versions = sortBySemver(versionPaths).map(versionPath);
    return await asyncFind(versions, isValidBinary);
  } catch (e) {
    console.error(
      "Error handling existing version. Falling back to downloading",
      e
    );
  }
  return null;
}
