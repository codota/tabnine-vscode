import * as path from "path";
import * as os from "os";

export const TABNINE_CONFIG_DIR = path.join(os.homedir(), ".config", "TabNine");

export const TABNINE_TOKEN_FILE_NAME = "tabnine.token";

export const TABNINE_TOKEN_FILE_PATH = path.join(
  TABNINE_CONFIG_DIR,
  TABNINE_TOKEN_FILE_NAME
);

export const TABNINE_CONFIG_FILE_NAME = "tabnine_config.json";

export const TABNINE_CONFIG_FILE_PATH = path.join(
  TABNINE_CONFIG_DIR,
  TABNINE_CONFIG_FILE_NAME
);

export const TABNINE_TOKEN_CONTEXT_KEY = "TABNINE_TOKEN";

export const TABNINE_CONFIG_CONTEXT_KEY = "TABNINE_CONFIG";
