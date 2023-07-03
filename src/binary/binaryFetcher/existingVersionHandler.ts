import { promises as fs } from "fs";
import sortBySemver from "../../utils/semver.utils";
import { asyncFind } from "../../utils/utils";
import isValidBinary, { isValidBinaryVersion } from "./binaryValidator";
import { getRootPath, versionPath } from "../paths";

export default async function handleExistingVersion(): Promise<string | null> {
  try {
    const versionPaths = await fs.readdir(getRootPath());
    const validVersions = versionPaths.filter(
      (version) => !isValidBinaryVersion(version)
    );
    const versions = sortBySemver(validVersions).map(versionPath);
    return await asyncFind(versions, isValidBinary);
  } catch (e) {
    console.error(
      "Error handling existing version. Falling back to downloading",
      e
    );
  }
  return null;
}
