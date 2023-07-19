import * as fs from "fs";
import * as path from "path";
import { Disposable } from "vscode";
import tabnineExtensionProperties from "./globals/tabnineExtensionProperties";
import { Logger } from "./utils/logger";

export default function handleUninstall(
  onUninstall: () => Promise<unknown>
): Disposable {
  try {
    const extensionsPath = path.dirname(
      tabnineExtensionProperties.extensionPath ?? ""
    );
    const uninstalledPath = path.join(extensionsPath, ".obsolete");
    const isFileExists = (curr: fs.Stats) => curr.size !== 0;
    const isModified = (curr: fs.Stats, prev: fs.Stats) =>
      new Date(curr.mtimeMs) >= new Date(prev.atimeMs);
    const isUpdating = (files: string[]) =>
      files.filter((f) =>
        tabnineExtensionProperties.id
          ? f
              .toLowerCase()
              .includes(tabnineExtensionProperties.id.toLowerCase())
          : false
      ).length !== 1;
    const watchFileHandler = (curr: fs.Stats, prev: fs.Stats) => {
      if (isFileExists(curr) && isModified(curr, prev)) {
        fs.readFile(uninstalledPath, (err, uninstalled) => {
          if (err) {
            Logger.error("failed to read .obsolete file:", err);
            throw err;
          }
          fs.readdir(extensionsPath, (error, files: string[]) => {
            if (error) {
              Logger.error(
                `failed to read ${extensionsPath} directory:`,
                error
              );

              throw error;
            }

            if (
              !isUpdating(files) &&
              uninstalled.includes(tabnineExtensionProperties.name)
            ) {
              onUninstall()
                .then(() => {
                  fs.unwatchFile(uninstalledPath, watchFileHandler);
                })
                .catch((e) => {
                  Logger.error("failed to report uninstall:", e);
                });
            }
          });
        });
      }
    };
    fs.watchFile(uninstalledPath, watchFileHandler);
    return new Disposable(() =>
      fs.watchFile(uninstalledPath, watchFileHandler)
    );
  } catch (error) {
    Logger.error("failed to invoke uninstall:", error);
  }
  return new Disposable(() => {});
}
