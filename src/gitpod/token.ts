import path from "path";
import os from "os";
import {
  readFile as readFileCallback,
  writeFile as writeFileCallback,
  exists as existsCallback,
} from "fs";
import { promisify } from "util";
import { setEnvVar } from "./cli";

const readFile = promisify(readFileCallback);
const writeFile = promisify(writeFileCallback);
const exists = promisify(existsCallback);

const TABNINE_TOKEN_FILE = path.join(
  os.homedir(),
  ".config",
  "TabNine",
  "tabnine.token"
);

const TABNINE_TOKEN_ENV_VAR = "TABNINE_TOKEN_ENV_VAR";

export async function loadTokenFromGitpodEnvVar(): Promise<void> {
  const tabnineToken = process.env[TABNINE_TOKEN_ENV_VAR];
  if (tabnineToken) await writeFile(TABNINE_TOKEN_FILE, tabnineToken);
}

export async function persistTokenInGitpodEnvVar(): Promise<void> {
  if (await exists(TABNINE_TOKEN_FILE)) {
    try {
      const tabnineToken = await readFile(TABNINE_TOKEN_FILE, "utf8");
      await setEnvVar(TABNINE_TOKEN_ENV_VAR, tabnineToken);
    } catch (e) {
      console.error("Failed to persist token", e);
    }
  }
}
