import { Memento } from "vscode";
import * as fs from "fs";
import { BINARY_ROOT_PATH } from "../../consts";
import { versionPath } from "../paths";
import VersionChecker from "./versionChecker";

export type ExtensionContext = { globalState: Memento };

export default function getMostRelevantVersion(
  versionChecker: VersionChecker
): string | undefined {
  return fs
    .readdirSync(BINARY_ROOT_PATH)
    .filter((versionFolder) =>
      versionChecker.isWorking(versionPath(versionFolder))
    )
    .sort()
    .reverse()[0];
}
