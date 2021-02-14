import * as fs from "fs";
import * as path from "path";
import { tabnineContext } from "./extensionContext";

export default function handleUninstall(
  onUninstall: () => Promise<unknown>
): void {
  try {
    const extensionsPath = path.dirname(tabnineContext.extensionPath ?? "");
    const uninstalledPath = path.join(extensionsPath, ".obsolete");
    const isFileExists = (curr: fs.Stats) => curr.size !== 0;
    const isModified = (curr: fs.Stats, prev: fs.Stats) =>
      new Date(curr.mtimeMs) >= new Date(prev.atimeMs);
    const isUpdating = (files: string[]) =>
      files.filter((f) =>
        tabnineContext.id
          ? f.toLowerCase().includes(tabnineContext.id.toLowerCase())
          : false
      ).length !== 1;
    const watchFileHandler = (curr: fs.Stats, prev: fs.Stats) => {
      if (isFileExists(curr) && isModified(curr, prev)) {
        fs.readFile(uninstalledPath, (err, uninstalled) => {
          if (err) {
            console.error("failed to read .obsolete file:", err);
            throw err;
          }
          fs.readdir(extensionsPath, (error, files: string[]) => {
            if (error) {
              console.error(
                `failed to read ${extensionsPath} directory:`,
                error
              );

              throw error;
            }

            if (
              !isUpdating(files) &&
              uninstalled.includes(tabnineContext.name)
            ) {
              onUninstall()
                .then(() => {
                  fs.unwatchFile(uninstalledPath, watchFileHandler);
                })
                .catch((e) => {
                  console.error("failed to report uninstall:", e);
                });
            }
          });
        });
      }
    };
    fs.watchFile(uninstalledPath, watchFileHandler);
  } catch (error) {
    console.error("failed to invoke uninstall:", error);
  }
}
