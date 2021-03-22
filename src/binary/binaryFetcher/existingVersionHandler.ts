import { promises as fs } from "fs";
import sortBySemver from "../../semverUtils";
import { asyncFind } from "../../utils";
import isValidBinary from "./binaryValidator";
import { getRootPath, versionPath } from "../paths";

export default async function handleExistingVersion(): Promise<string | null> {
  try {
    const versionPaths = await fs.readdir(getRootPath());
    console.log("existing versions");
    versionPaths.forEach((p) => console.log("path ", p));
    const versions = sortBySemver(versionPaths).map(versionPath);
    return asyncFind(versions, isValidBinary);
  } catch (e) {
    console.error(
      "Error handling existing version. Falling back to downloading",
      e
    );
  }
  return null;
}
