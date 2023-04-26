import { Disposable } from "vscode";
import { onPluginInstalledEmitter } from "./events/onPluginInstalledEmitter";
import { ExtensionContext } from "./preRelease/types";

export default function handlePluginInstalled(
  context: ExtensionContext
): Disposable {
  return onPluginInstalledEmitter.event(() => {
    console.log("todo open webview");
  })
}
