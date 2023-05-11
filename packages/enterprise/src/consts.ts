export const SELF_HOSTED_SERVER_CONFIGURATION = `tabnineSelfHostedUpdater.serverUrl`;
export const TABNINE_HOST_CONFIGURATION = `tabnine.cloudHost`;

export const INSTALL_COMMAND = "workbench.extensions.installExtension";

export const OPEN_SETTINGS_COMMAND = "workbench.action.openSettings";

export const RELOAD_BUTTON_LABEL = "Reload";

export const RELOAD_COMMAND = "workbench.action.reloadWindow";

export const CONFIGURATION_SET_LABEL = "Set server URL";

export const UPDATE_PREFIX = "/update/vscode";

export const EXTENSION_SUBSTRING = "tabnine-vscode";

export const STATUS_NAME = "Tabnine";

export const ATTRIBUTION_BRAND = "⌬ ";

export const BRAND_NAME = "tabnine";

export const FULL_BRAND_REPRESENTATION = ATTRIBUTION_BRAND + BRAND_NAME;

export const BINARY_NOTIFICATION_POLLING_INTERVAL = +(
  process.env.BINARY_NOTIFICATION_POLLING_INTERVAL || 10_000
); // 10 seconds
