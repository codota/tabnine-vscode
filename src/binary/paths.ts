import { BINARY_ROOT_PATH } from "../consts";

const ARCHITECTURE = getArch();
const SUFFIX = getSuffix();

export function versionPath(version: string): string {
  return `${BINARY_ROOT_PATH}/${version}/${ARCHITECTURE}-${SUFFIX}`;
}

export function getRootPath(): string {
  return BINARY_ROOT_PATH;
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
