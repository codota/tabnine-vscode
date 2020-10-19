import { BINARY_ROOT_PATH } from "./consts";

let ARCHITECTURE = getArch();
let SUFFIX = getSuffix();

export default class BinaryPaths {
  versionPath(version: string) {
    return `${BINARY_ROOT_PATH}/${version}/${ARCHITECTURE}-${SUFFIX}`;
  }

  getRootPath() {
    return BINARY_ROOT_PATH;
  }
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
  if (process.arch == "x32" || process.arch == "ia32") {
    return "i686";
  } else if (process.arch == "x64") {
    return "x86_64";
  }

  throw new Error(
    `Sorry, the architecture '${process.arch}' is not supported by TabNine.`
  );
}
