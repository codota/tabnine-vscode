import { EventEmitter } from "vscode";

const onPluginInstalledEmitter = new EventEmitter<void>();

// eslint-disable-next-line import/prefer-default-export
export { onPluginInstalledEmitter };
