import * as fs from "fs";
import sortBySemver from "../../semverUtils";
import { asyncFind } from "../../utils";
import isValidBinary from "./binaryValidator";
import { versionPath } from "../paths";

export default async function handleExistingVersion(
  rootPath: string
): Promise<string | null> {
  try {
    if (fs.existsSync(rootPath)) {
      const versions = sortBySemver(fs.readdirSync(rootPath)).map(versionPath);
      const selectedVersion = await asyncFind(versions, isValidBinary);
      if (selectedVersion) {
        return selectedVersion;
      }
    }
  } catch (e) {
    console.error(
      "Error handling existing version. Falling back to downloading",
      e
    );
  }
  return null;
}
