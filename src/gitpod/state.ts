import * as path from "path";
import * as os from "os";
import { promises as fs } from "fs";
import { setEnvVar } from "./cli";
import { fromBase64, toBase64 } from "../utils/utils";
import { asyncExists } from "../utils/file.utils";

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
    try {
      await fs.writeFile(TABNINE_TOKEN_FILE, fromBase64(tabnineToken));
    } catch (e) {
      console.error("Error occurred while trying to load Tabnine token", e);
    }
  }

  if (tabnineConfig)
    try {
      await fs.writeFile(TABNINE_CONFIG_FILE, fromBase64(tabnineConfig));
    } catch (e) {
      console.error("Error occurred while trying to load Tabnine config", e);
    }
}

export async function persistStateToGitpodEnvVar(): Promise<void> {
  if (await asyncExists(TABNINE_TOKEN_FILE)) {
    try {
      const tabnineToken = await fs.readFile(TABNINE_TOKEN_FILE, "utf8");
      await setEnvVar(TABNINE_TOKEN_ENV_VAR, toBase64(tabnineToken));
    } catch (e) {
      console.error("Error occurred while trying to persist Tabnine token", e);
    }
  }

  if (await asyncExists(TABNINE_CONFIG_FILE)) {
    try {
      const tabnineConfig = await fs.readFile(TABNINE_CONFIG_FILE, "utf8");
      await setEnvVar(TABNINE_TOKEN_ENV_VAR, toBase64(tabnineConfig));
    } catch (e) {
      console.error("Error occurred while trying to persist Tabnine config", e);
    }
  }
}
