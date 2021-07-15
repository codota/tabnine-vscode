import * as path from "path";
import * as os from "os";
import { promises as fsPromises, watch } from "fs";
import { setEnvVar } from "./cli";
import { fromBase64, toBase64 } from "../utils/utils";

const TABNINE_CONFIG_DIR = path.join(os.homedir(), ".config", "TabNine");

const TABNINE_TOKEN_FILE = "tabnine.token";

const TABNINE_CONFIG_FILE = "tabnine_config.json";

const TABNINE_TOKEN_ENV_VAR = "TABNINE_TOKEN";

const TABNINE_CONFIG_ENV_VAR = "TABNINE_CONFIG";

export async function loadStateFromGitpodEnvVar(): Promise<void> {
  const tabnineToken = process.env[TABNINE_TOKEN_ENV_VAR];
  const tabnineConfig = process.env[TABNINE_CONFIG_ENV_VAR];

  if (tabnineToken) {
    await fsPromises
      .writeFile(
        path.join(TABNINE_TOKEN_FILE, TABNINE_TOKEN_FILE),
        fromBase64(tabnineToken)
      )
      .catch((e) => {
        console.error("Error occurred while trying to load Tabnine token", e);
      });
  }

  if (tabnineConfig)
    await fsPromises
      .writeFile(
        path.join(TABNINE_CONFIG_FILE, TABNINE_CONFIG_FILE),
        fromBase64(tabnineConfig)
      )
      .catch((e) => {
        console.error("Error occurred while trying to load Tabnine config", e);
      });
}

export function persistStateToGitpodEnvVar(): void {
  watch(TABNINE_CONFIG_DIR, (event, filename) => {
    if (filename === TABNINE_TOKEN_FILE)
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
    if (filename === TABNINE_CONFIG_FILE)
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
