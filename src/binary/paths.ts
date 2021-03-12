import { BINARY_ROOT_PATH, BINARY_UPDATE_PATH, BINARY_UPDATE_VERSION } from "../consts";

const ARCHITECTURE = getArch();
const SUFFIX = getSuffix();
const BUNDLE_SUFFIX = getBundleSuffix();

export function versionPath(version: string): string {
  return `${BINARY_ROOT_PATH}/${version}/${ARCHITECTURE}-${SUFFIX}`;
}
export function geBundlePath(version: string): string {
  return `${BINARY_ROOT_PATH}/${version}/${ARCHITECTURE}-${BUNDLE_SUFFIX}`;
}
export function downloadVersionPath(version: string): string {
  return `${BINARY_UPDATE_PATH}/${version}/${ARCHITECTURE}-${BUNDLE_SUFFIX}`;
}

export function getRootPath(): string {
  return BINARY_ROOT_PATH;
}
export function getUpdateVersion(): string {
  return BINARY_UPDATE_VERSION;
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
