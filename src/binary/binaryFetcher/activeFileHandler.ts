import * as fs from "fs";
import * as path from "path";
import { versionPath } from "../paths";

export default function handleActiveFile(rootPath: string): string | null {
  try {
    const activePath = path.join(rootPath, ".active");
    if (fs.existsSync(activePath)) {
      const activeVersion = fs.readFileSync(activePath, "utf-8").trim();
      const activeVersionPath = versionPath(activeVersion);
      if (fs.existsSync(activeVersionPath)) {
        return activeVersionPath;
      }
    }
  } catch (e) {
    console.error(
      "Error handling .active file. Falling back to semver sorting",
      e
    );
  }
  return null;
}
