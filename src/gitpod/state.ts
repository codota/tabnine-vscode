import * as path from "path";
import * as os from "os";
import fs, { promises as fsPromises } from "fs";
import { setEnvVar } from "./cli";
import { fromBase64, toBase64 } from "../utils/utils";

const TABNINE_TOKEN_FILE = path.join(
  os.homedir(),
  ".config",
  "TabNine",
  "tabnine.token"
);

const TABNINE_CONFIG_FILE = path.join(
  os.homedir(),
  ".config",
  "TabNine",
  "tabnine_config.json"
);

const TABNINE_TOKEN_ENV_VAR = "TABNINE_TOKEN";

const TABNINE_CONFIG_ENV_VAR = "TABNINE_CONFIG";

export async function loadStateFromGitpodEnvVar(): Promise<void> {
  const tabnineToken = process.env[TABNINE_TOKEN_ENV_VAR];
  const tabnineConfig = process.env[TABNINE_CONFIG_ENV_VAR];

  if (tabnineToken) {
    await fsPromises
      .writeFile(TABNINE_TOKEN_FILE, fromBase64(tabnineToken))
      .catch((e) => {
        console.error("Error occurred while trying to load Tabnine token", e);
      });
  }

  if (tabnineConfig)
    await fsPromises
      .writeFile(TABNINE_CONFIG_FILE, fromBase64(tabnineConfig))
      .catch((e) => {
        console.error("Error occurred while trying to load Tabnine config", e);
      });
}

export function persistStateToGitpodEnvVar(): void {
  fs.watch(TABNINE_TOKEN_FILE, (event, filename) => {
    if (event === "change")
      void fsPromises
        .readFile(filename, "utf8")
        .then((tabnineToken) =>
          setEnvVar(TABNINE_TOKEN_ENV_VAR, toBase64(tabnineToken))
        )
        .catch((e) => {
          console.error(
            "Error occurred while trying to persist Tabnine token",
            e
          );
        });
  });

  fs.watch(TABNINE_CONFIG_FILE, (event, filename) => {
    if (event === "change")
      void fsPromises
        .readFile(filename, "utf8")
        .then((tabnineConfig) =>
          setEnvVar(TABNINE_CONFIG_ENV_VAR, toBase64(tabnineConfig))
        )
        .catch((e) => {
          console.error(
            "Error occurred while trying to persist Tabnine config",
            e
          );
        });
  });
}
