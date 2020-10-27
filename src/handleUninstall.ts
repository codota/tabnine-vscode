import * as fs from "fs";
import * as path from "path";
import { tabnineContext } from "./extensionContext";
import { uninstalling } from "./binary/requests";

export default function handleUninstall() {
  try {
    const extensionsPath = path.dirname(tabnineContext.extensionPath!);
    const uninstalledPath = path.join(extensionsPath, ".obsolete");
    const isFileExists = (curr: fs.Stats, prev: fs.Stats) => curr.size != 0;
    const isModified = (curr: fs.Stats, prev: fs.Stats) =>
      new Date(curr.mtimeMs) >= new Date(prev.atimeMs);
    const isUpdating = (files: string[]) =>
      files.filter((f) =>
        f.toLowerCase().includes(tabnineContext.id!.toLowerCase())
      ).length != 1;
    const watchFileHandler = (curr: fs.Stats, prev: fs.Stats) => {
      if (isFileExists(curr, prev) && isModified(curr, prev)) {
        fs.readFile(uninstalledPath, (err, uninstalled) => {
          try {
            if (err) {
              console.error("failed to read .obsolete file:", err);
              throw err;
            }
            fs.readdir(extensionsPath, async (err, files: string[]) => {
              if (err) {
                console.error(
                  `failed to read ${extensionsPath} directory:`,
                  err
                );
                throw err;
              }
              if (
                !isUpdating(files) &&
                uninstalled.includes(tabnineContext.name)
              ) {
                await uninstalling();
                fs.unwatchFile(uninstalledPath, watchFileHandler);
              }
            });
          } catch (error) {
            console.error("failed to report uninstall:", error);
          }
        });
      }
    };
    fs.watchFile(uninstalledPath, watchFileHandler);
  } catch (error) {
    console.error("failed to invoke uninstall:", error);
  }
}
