import { ProgressLocation, window } from "vscode";
import { getRootPath } from "../paths";
import handleActiveFile from "./activeFileHandler";
import downloadAndExtractBundle from "./bundleDownloader";
import handleExistingVersion from "./existingVersionHandler";

export default async function fetchBinaryPath(): Promise<string> {
  const rootPath = getRootPath();

  const activeVersionPath = handleActiveFile(rootPath);
  if (activeVersionPath) {
    return activeVersionPath;
  }
  const existingVersion = await handleExistingVersion(rootPath);
  if (existingVersion) {
    return existingVersion;
  }
  return downloadVersion();
}

async function downloadVersion(): Promise<string> {
  return window.withProgress(
    {
      location: ProgressLocation.Notification,
      title: `Initializing Tabnine`,
    },
    downloadAndExtractBundle
  );
}
