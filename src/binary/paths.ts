import { promises as fs } from "fs";
import * as path from "path";
import * as vscode from "vscode";
import {
  BINARY_UPDATE_URL,
  BINARY_UPDATE_VERSION_FILE_URL,
} from "../globals/consts";
import { ONPREM } from "../onPrem";

let BINARY_ROOT_PATH: string | undefined;
const ARCHITECTURE = getArch();
const SUFFIX = getSuffix();
const BUNDLE_SUFFIX = getBundleSuffix();

export async function setBinaryRootPath(
  extensionContext: vscode.ExtensionContext
): Promise<void> {
  if (ONPREM) {
    const base = `binaries/${getArch()}-${getPlatform()}`;
    BINARY_ROOT_PATH = path.join(extensionContext.extensionPath, base);
    await makeExecutable(BINARY_ROOT_PATH);
    return;
  }
  BINARY_ROOT_PATH =
    extensionContext.extensionMode === vscode.ExtensionMode.Test
      ? path.join(__dirname, "..", "..", "binaries")
      : path.join(extensionContext.globalStorageUri.fsPath, "binaries");

  try {
    await fs.mkdir(BINARY_ROOT_PATH, { recursive: true });
  } catch (err) {
    // Exception is thrown if the path already exists, so ignore error.
  }
}

export async function makeExecutable(binaryRootPath: string) {
  const bundleDirectory = binaryRootPath;
  if (process.platform === "win32") {
    return;
  }
  const files = await fs.readdir(bundleDirectory);
  console.log("making files executable", files);
  await Promise.all(
    files.map((file) => fs.chmod(path.join(bundleDirectory, file), 0o755))
  );
}

export function bundledTabnineBinaryPath(): string {
  return path.join(<string>BINARY_ROOT_PATH, binaryName());
}

function binaryName(): string {
  switch (process.platform) {
    case "win32":
      return "TabNine.exe";
    default:
      return "TabNine";
  }
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
  return `${BINARY_UPDATE_URL}/${version}/${ARCHITECTURE}-${BUNDLE_SUFFIX}`;
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

function getPlatform(): string {
  switch (process.platform) {
    case "win32":
      return "pc-windows-gnu";
    case "darwin":
      return "apple-darwin";
    case "linux":
      return "unknown-linux-musl";
    default:
      throw new Error(
        `Sorry, the platform '${process.platform}' is not supported by TabNine.`
      );
  }
}
