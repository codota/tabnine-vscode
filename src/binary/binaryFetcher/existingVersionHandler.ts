import { promises as fs } from "fs";
import * as path from "path";
import sortBySemver from "../../utils/semver.utils";
import { asyncFind } from "../../utils/utils";
import isValidBinary from "./binaryValidator";
import { getRootPath, versionPath } from "../paths";
import { setDirectoryFilesAsExecutable } from "../utils";
import { asyncExists } from "../../utils/file.utils";

export default async function handleExistingVersion(): Promise<string | null> {
  try {
    const versionPaths = await fs.readdir(getRootPath(), { withFileTypes: true });
    await Promise.all(
      versionPaths.filter(d => d.isDirectory())
        .map((version) => path.dirname(versionPath(version.name)))
        .filter(async (p) => asyncExists(p))
        .map(async (p2) => setDirectoryFilesAsExecutable(p2))
    );
    const versions = sortBySemver(versionPaths.map(d => d.name)).map(versionPath);
    return await asyncFind(versions, isValidBinary);
  } catch (e) {
    console.error(
      "Error handling existing version. Falling back to downloading",
      e
    );
  }
  return null;
}
