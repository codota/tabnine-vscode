import * as fs from "fs";
import * as https from "https";
import * as path from "path";
import * as vscode from "vscode";
import * as semver from "semver";
import { tabNineProcess } from "../TabNine";

const fsp = fs.promises;
const validatorBinariesPath = path.join(
  __dirname,
  "..",
  "..",
  "validator-binaries"
);
export const validatorCachePath = path.join(
  __dirname,
  "..",
  "..",
  "validator-cache"
);
const validatorEndpoint = "https://update.tabnine.com/validator";
const validatorBinaryBaseName = "tabnine-validator";
const statusBarItem = vscode.window.createStatusBarItem(
  vscode.StatusBarAlignment.Right
);

export function setState(state) {
  tabNineProcess.setState(state);
}

let state = null;

export async function getAPIKey() {
  if (state === null) {
    state = await tabNineProcess.getState(null);
  }
  return state.api_key || "";
}

export async function downloadValidatorBinary(): Promise<boolean> {
  if (state === null) {
    state = await tabNineProcess.getState(null);
  }
  if (!state.cloud_enabled) {
    return false;
  }

  let tabNineVersionFromWeb: string;
  try {
    tabNineVersionFromWeb = await getTabNineValidatorVersionFromWeb();
  } catch (e) {
    // network problem, check if there is already some version on the machine
    try {
      getFullPathToValidatorBinary();
      return true;
    } catch (e) {
      // binary doesn't exist
      return false;
    }
  }

  if (await isFileExists(getFullPathToValidatorBinary(tabNineVersionFromWeb))) {
    return true;
  }

  return vscode.window.withProgress(
    {
      location: vscode.ProgressLocation.Notification,
      cancellable: true,
      title: `Downloading TabNine Validator...`,
    },
    (progress, token) => {
      return new Promise(async (resolve, reject) => {
        try {
          const fullPath = getFullPathToValidatorBinary(tabNineVersionFromWeb);
          const binaryDirPath = fullPath.slice(0, fullPath.lastIndexOf("/"));
          await fsp.mkdir(binaryDirPath, { recursive: true });

          let totalBinaryLength: string | undefined;
          const requestUrl = `${validatorEndpoint}/${fullPath.slice(
            fullPath.indexOf(tabNineVersionFromWeb)
          )}`;
          const requestDownload = https.get(
            requestUrl,
            { timeout: 10_000 },
            (res) => {
              const binaryFile = fs.createWriteStream(fullPath, {
                mode: 0o755,
              });
              binaryFile.on("error", (err) => reject(err));

              let receivedBinaryLength = 0;
              let binaryPercentage = 0;
              res
                .on("data", (chunk) => {
                  if (!totalBinaryLength) {
                    return;
                  }

                  receivedBinaryLength += chunk.length;
                  const newBinaryPercentage = Number(
                    (
                      (receivedBinaryLength * 100) /
                      Number.parseInt(totalBinaryLength)
                    ).toFixed()
                  );

                  if (binaryPercentage === 0) {
                    progress.report({ increment: 0 });
                  } else if (newBinaryPercentage > binaryPercentage) {
                    progress.report({ increment: 1 });
                  }

                  binaryPercentage = newBinaryPercentage;
                })
                .on("error", (err) => reject(err))
                .on("end", () => {
                  if (token.isCancellationRequested) {
                    return;
                  }

                  progress.report({ increment: 100 });
                  vscode.window.showInformationMessage(
                    `TabNine Validator ${tabNineVersionFromWeb} binary is successfully downloaded`
                  );
                  resolve(true);
                })
                .pipe(binaryFile)
                .on("error", (err) => reject(err));

              token.onCancellationRequested(() => {
                res.destroy();
                binaryFile.destroy();
              });
            }
          );

          requestDownload.on("response", (res) => {
            statusBarItem.text = "TabNine Validator: $(sync~spin)";
            statusBarItem.tooltip = `Downloading TabNine Validator ${tabNineVersionFromWeb} binary`;
            totalBinaryLength = res.headers["content-length"];
          });
          requestDownload.on("timeout", () =>
            reject(`Request to ${requestUrl} timed out`)
          );
          requestDownload.on("error", (err) => reject(err));

          token.onCancellationRequested(() => {
            fsp.unlink(fullPath).catch((err) => reject(err));
            requestDownload.destroy();
            reject("Download of TabNine Validator binary has been cancelled");
          });
        } catch (err) {
          reject(err);
        }
      });
    }
  );
}

async function getTabNineValidatorVersionFromWeb(): Promise<string> {
  return new Promise((resolve, reject) => {
    const requestUrl = `${validatorEndpoint}/version`;
    const requestVersion = https.get(requestUrl, { timeout: 10_000 }, (res) => {
      let output = "";
      res.on("data", (chunk) => (output += chunk));
      res.on("end", () => resolve(output.trim()));
      res.on("error", (err) => reject(err));
    });
    requestVersion.on("timeout", () =>
      reject(`Request to ${requestUrl} timed out`)
    );
    requestVersion.on("error", (err) => reject(err));
  });
}

export function getFullPathToValidatorBinary(version?: string): string {
  const architecture = getArchitecture();
  const { target, filename } = getTargetAndFileNameByPlatform();
  if (typeof version === "undefined") {
    const versions = fs.readdirSync(validatorBinariesPath);
    sortBySemver(versions);
    const tried = [];
    for (let version of versions) {
      const full_path = `${validatorBinariesPath}/${version}/${architecture}-${target}/${filename}`;
      tried.push(full_path);
      if (fs.existsSync(full_path)) {
        return full_path;
      }
    }
    throw new Error(
      `Couldn't find a TabNineValidator binary (tried the following paths: versions=${versions} ${tried})`
    );
  } else {
    return `${validatorBinariesPath}/${version}/${architecture}-${target}/${filename}`;
  }
}

function getArchitecture(): string {
  if (process.arch === "x64") {
    return "x86_64";
  }
  throw new Error(
    `Architecture "${process.arch}" is not supported by TabNineValidator`
  );
}

function getTargetAndFileNameByPlatform(): {
  target: string;
  filename: string;
} {
  if (process.platform === "win32") {
    return {
      target: "pc-windows-gnu",
      filename: `${validatorBinaryBaseName}.exe`,
    };
  }
  if (process.platform === "darwin") {
    return { target: "apple-darwin", filename: validatorBinaryBaseName };
  }
  if (process.platform === "linux") {
    return { target: "unknown-linux-musl", filename: validatorBinaryBaseName };
  }
  throw new Error(
    `Platform "${process.platform}" is not supported by TabNineValidator`
  );
}

function sortBySemver(versions: string[]) {
  versions.sort(cmpSemver);
}

function cmpSemver(a, b): number {
  const a_valid = semver.valid(a);
  const b_valid = semver.valid(b);
  if (a_valid && b_valid) {
    return semver.rcompare(a, b);
  } else if (a_valid) {
    return -1;
  } else if (b_valid) {
    return 1;
  } else if (a < b) {
    return -1;
  } else if (a > b) {
    return 1;
  } else {
    return 0;
  }
}

async function isFileExists(root: string): Promise<boolean> {
  try {
    await fsp.stat(root);
    return true;
  } catch (err) {
    if (err.code === "ENOENT") {
      return false;
    }
    throw err;
  }
}

export function getNanoSecTime() {
  var hrTime = process.hrtime();
  return hrTime[0] * 1000000000 + hrTime[1];
}
