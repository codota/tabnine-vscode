import { ProgressLocation, window } from "vscode";
import handleActiveFile from "./activeFileHandler";
import downloadAndExtractBundle from "./bundleDownloader";
import handleExistingVersion from "./existingVersionHandler";

export default async function fetchBinaryPath(): Promise<string> {
  const activeVersionPath = handleActiveFile();
  if (activeVersionPath) {
    return activeVersionPath;
  }
  const existingVersion = await handleExistingVersion();
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
