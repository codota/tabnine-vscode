import { promises as fs } from "fs";
import * as path from "path";
import * as vscode from "vscode";

let BINARY_ROOT_PATH: string | undefined;
let BINARY_UPDATE_URL = "https://update.tabnine.com/bundles";
const ARCHITECTURE = getArch();
const SUFFIX = getSuffix();
const BUNDLE_SUFFIX = getBundleSuffix();

export async function setBinaryRootPath(
  extensionContext: vscode.ExtensionContext
): Promise<void> {
  BINARY_ROOT_PATH =
    extensionContext.extensionMode === vscode.ExtensionMode.Test
      ? path.join(extensionContext.extensionPath, "binaries")
      : path.join(extensionContext.globalStorageUri.fsPath, "binaries");

  try {
    await fs.mkdir(BINARY_ROOT_PATH, { recursive: true });
  } catch (err) {
    // Exception is thrown if the path already exists, so ignore error.
  }
}
export function setBinaryDownloadUrl(server: string): void {
  BINARY_UPDATE_URL = server;
}

export function versionPath(version: string): string {
  if (!BINARY_ROOT_PATH) {
    throw new Error("Binary root path not set");
  }

  return path.join(BINARY_ROOT_PATH, version, `${ARCHITECTURE}-${SUFFIX}`);
}

export function getBundlePath(version: string): string {
  if (!BINARY_ROOT_PATH) {
    throw new Error("Binary root path not set");
  }
  return path.join(
    BINARY_ROOT_PATH,
    version,
    `${ARCHITECTURE}-${BUNDLE_SUFFIX}`
  );
}

export function getDownloadVersionUrl(version: string): string {
  return `${BINARY_UPDATE_URL}/update/${version}/${ARCHITECTURE}-${BUNDLE_SUFFIX}`;
}
export function getUpdateVersionFileUrl(): string {
  return `${BINARY_UPDATE_URL}/update/version`;
}

export function getRootPath(): string {
  if (!BINARY_ROOT_PATH) {
    throw new Error("Binary root path not set");
  }

  return BINARY_ROOT_PATH;
}
export function getAssistantRootPath(): string {
  if (!BINARY_ROOT_PATH) {
    throw new Error("Binary root path not set");
  }

  return path.join(BINARY_ROOT_PATH, "..", "assistant-binaries");
}

export function getActivePath(): string {
  if (!BINARY_ROOT_PATH) {
    throw new Error("Binary root path not set");
  }

  return path.join(BINARY_ROOT_PATH, ".active");
}

function getSuffix(): string {
  switch (process.platform) {
    case "win32":
      return "pc-windows-gnu/TabNine.exe";
    case "darwin":
      return "apple-darwin/TabNine";
    case "linux":
      return "unknown-linux-musl/TabNine";
    default:
      throw new Error(
        `Sorry, the platform '${process.platform}' is not supported by TabNine.`
      );
  }
}

function getBundleSuffix(): string {
  return `${SUFFIX.replace(".exe", "")}.zip`;
}

function getArch(): string {
  if (process.platform === "darwin" && process.arch === "arm64") {
    return "aarch64";
  }

  if (process.arch === "x32" || process.arch === "ia32") {
    return "i686";
  }

  if (process.arch === "x64") {
    return "x86_64";
  }

  throw new Error(
    `Sorry, the architecture '${process.arch}' is not supported by TabNine.`
  );
}
