import { promises as fsPromises, watch } from "fs";
import { ExtensionContext } from "vscode";
import * as consts from "./consts";
import { ensureExists } from "../utils/file.utils";

export async function loadStateFromGitpod(
  context: ExtensionContext
): Promise<void> {
  context.globalState.setKeysForSync([
    consts.TABNINE_TOKEN_CONTEXT_KEY,
    consts.TABNINE_CONFIG_CONTEXT_KEY,
  ]);

  const tabnineToken = context.globalState.get<string>(
    consts.TABNINE_TOKEN_CONTEXT_KEY
  );
  const tabnineConfig = context.globalState.get<string>(
    consts.TABNINE_CONFIG_CONTEXT_KEY
  );

  if (tabnineToken) {
    await fsPromises
      .writeFile(consts.TABNINE_TOKEN_FILE_PATH, tabnineToken)
      .catch((e) => {
        console.error("Error occurred while trying to load Tabnine token", e);
      });
  }

  if (tabnineConfig)
    await fsPromises
      .writeFile(consts.TABNINE_CONFIG_CONTEXT_KEY, tabnineConfig)
      .catch((e) => {
        console.error("Error occurred while trying to load Tabnine config", e);
      });
}

export async function persistStateToGitpod(
  context: ExtensionContext
): Promise<void> {
  await ensureExists(consts.TABNINE_CONFIG_DIR);
  watch(consts.TABNINE_CONFIG_DIR, (event, filename) => {
    switch (filename) {
      case consts.TABNINE_TOKEN_FILE_NAME:
        void fsPromises
          .readFile(consts.TABNINE_TOKEN_FILE_PATH, "utf8")
          .then((tabnineToken) =>
            context.globalState.update(
              consts.TABNINE_TOKEN_CONTEXT_KEY,
              tabnineToken
            )
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
            context.globalState.update(
              consts.TABNINE_CONFIG_CONTEXT_KEY,
              tabnineConfig
            )
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
