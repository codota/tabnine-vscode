import { promises as fs } from "fs";
import * as path from "path";
import * as vscode from "vscode";
import {
  BINARY_UPDATE_URL,
  BINARY_UPDATE_VERSION_FILE_URL,
} from "../globals/consts";

let binaryRootPath: string | undefined;
const ARCHITECTURE = getArch();
const SUFFIX = getSuffix();
const BUNDLE_SUFFIX = getBundleSuffix();

export async function setBinaryRootPath(
  extensionContext: vscode.ExtensionContext
): Promise<void> {
  binaryRootPath =
    extensionContext.extensionMode === vscode.ExtensionMode.Test
      ? path.join(__dirname, "..", "..", "binaries")
      : path.join(extensionContext.globalStorageUri.fsPath, "binaries");

  try {
    await fs.mkdir(binaryRootPath, { recursive: true });
  } catch (err) {
    // Exception is thrown if the path already exists, so ignore error.
  }
}

export function versionPath(version: string): string {
  if (!binaryRootPath) {
    throw new Error("Binary root path not set");
  }

  return path.join(binaryRootPath, version, `${ARCHITECTURE}-${SUFFIX}`);
}

export function getBundlePath(version: string): string {
  if (!binaryRootPath) {
    throw new Error("Binary root path not set");
  }

  return path.join(binaryRootPath, version, `${ARCHITECTURE}-${BUNDLE_SUFFIX}`);
}

export function getDownloadVersionUrl(version: string): string {
  return `${BINARY_UPDATE_URL}/${version}/${ARCHITECTURE}-${BUNDLE_SUFFIX}`;
}

export function getRootPath(): string {
  if (!binaryRootPath) {
    throw new Error("Binary root path not set");
  }

  return binaryRootPath;
}
export function getAssistantRootPath(): string {
  if (!binaryRootPath) {
    throw new Error("Binary root path not set");
  }

  return path.join(binaryRootPath, "..", "assistant-binaries");
}

export function getActivePath(): string {
  if (!binaryRootPath) {
    throw new Error("Binary root path not set");
  }

  return path.join(binaryRootPath, ".active");
}

export function getUpdateVersionFileUrl(): string {
  return BINARY_UPDATE_VERSION_FILE_URL;
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
export function isWindows(): boolean {
  return process.platform === "win32";
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
