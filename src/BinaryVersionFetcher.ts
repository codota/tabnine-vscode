import * as fs from "fs";
import BinaryPaths from "./BinaryPaths";
import { sortBySemver } from "./semverUtils";

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
