import { promises as fsPromises, watch } from "fs";
import { setEnvVar } from "./cli";
import { fromBase64, toBase64 } from "../utils/utils";
import * as consts from "./consts";
import { ensureExists } from "../utils/file.utils";

export async function loadStateFromGitpodEnvVar(): Promise<void> {
  const tabnineToken = process.env[consts.TABNINE_TOKEN_ENV_VAR];
  const tabnineConfig = process.env[consts.TABNINE_CONFIG_ENV_VAR];

  await ensureExists(consts.TABNINE_CONFIG_DIR);

  if (tabnineToken) {
    await fsPromises
      .writeFile(consts.TABNINE_TOKEN_FILE_PATH, fromBase64(tabnineToken))
      .catch((e) => {
        console.error("Error occurred while trying to load Tabnine token", e);
      });
  }

  if (tabnineConfig)
    await fsPromises
      .writeFile(consts.TABNINE_TOKEN_FILE_PATH, fromBase64(tabnineConfig))
      .catch((e) => {
        console.error("Error occurred while trying to load Tabnine config", e);
      });
}

export async function persistStateToGitpodEnvVar(): Promise<void> {
  await ensureExists(consts.TABNINE_CONFIG_DIR);

  watch(consts.TABNINE_CONFIG_DIR, (event, filename) => {
    switch (filename) {
      case consts.TABNINE_TOKEN_FILE_NAME:
        void fsPromises
          .readFile(consts.TABNINE_TOKEN_FILE_PATH, "utf8")
          .then((tabnineToken) =>
            setEnvVar(consts.TABNINE_TOKEN_ENV_VAR, toBase64(tabnineToken))
          )
          .catch((e) => {
            console.error(
              "Error occurred while trying to persist Tabnine token",
              e
            );
          });
        break;
      case consts.TABNINE_CONFIG_FILE_NAME:
        void fsPromises
          .readFile(consts.TABNINE_CONFIG_FILE_PATH, "utf8")
          .then((tabnineConfig) =>
            setEnvVar(consts.TABNINE_CONFIG_ENV_VAR, toBase64(tabnineConfig))
          )
          .catch((e) => {
            console.error(
              "Error occurred while trying to persist Tabnine config",
              e
            );
          });
        break;
      default:
    }
  });
}
