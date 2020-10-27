import * as fs from "fs";
import * as https from "https";
import * as path from "path";
import * as vscode from "vscode";
import { getState } from "../binary/requests/requests";
import { State } from "../binary/state";
import { sortBySemver } from "../semverUtils";

const fsp = fs.promises;
const validatorBinariesPath = path.join(
  __dirname,
  "..",
  "..",
  "validator-binaries"
);
const validatorHost = "update.tabnine.com";
const validatorBinaryBaseName = "tabnine-validator";
const statusBarItem = vscode.window.createStatusBarItem(
  vscode.StatusBarAlignment.Right
);

export const StateType = {
  threshold: "validator-set-threshold-from-to",
  toggle: "validator-toggle",
  clearCache: "validtor-clear-cache",
};

let state: State | null | undefined = null;

export async function getAPIKey() {
  if (state === null) {
    state = await getState();
  }

  return state?.api_key || "";
}

export async function downloadValidatorBinary(): Promise<boolean> {
  if (state === null) {
    state = await getState();
  }
  if (!state?.cloud_enabled) {
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
          const requestDownload = https.get(
            {
              timeout: 10_000,
              hostname: validatorHost,
              path: `/validator/${fullPath.slice(
                fullPath.indexOf(tabNineVersionFromWeb)
              )}`,
            },
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
            reject(`Request to validator timed out`)
          );
          requestDownload.on("error", (err) => reject(err));

          token.onCancellationRequested(() => {
            fsp.unlink(fullPath).catch((err) => reject(err));
            requestDownload.destroy(new Error("Canceled"));
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
    const requestVersion = https.get(
      { timeout: 10_000, hostname: validatorHost, path: `/validator/version` },
      (res) => {
        let output = "";
        res.on("data", (chunk) => (output += chunk));
        res.on("end", () => resolve(output.trim()));
        res.on("error", (err) => reject(err));
      }
    );
    requestVersion.on("timeout", () =>
      reject(`Request to validator version timed out`)
    );
    requestVersion.on("error", (err) => reject(err));
  });
}

export function getFullPathToValidatorBinary(version?: string): string {
  const architecture = getArchitecture();
  const { target, filename } = getTargetAndFileNameByPlatform();
  if (typeof version === "undefined") {
    const versions = sortBySemver(fs.readdirSync(validatorBinariesPath));
    const tried = [];
    for (let version of versions) {
      const full_path = `${validatorBinariesPath}/${version}/${architecture}-${target}/${filename}`;
      tried.push(full_path);
      if (fs.existsSync(full_path)) {
        return full_path;
      }
    }
    throw new Error(
      `Couldn't find a TabNine Validator binary (tried the following paths: versions=${versions} ${tried})`
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
    `Architecture "${process.arch}" is not supported by TabNine Validator`
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
    `Platform "${process.platform}" is not supported by TabNine Validator`
  );
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
