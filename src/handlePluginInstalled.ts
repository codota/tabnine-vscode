import { Disposable } from "vscode";
import { onPluginInstalledEmitter } from "./events/onPluginInstalledEmitter";
import { isAlreadyOpenedGettingStarted } from "./state/gettingStartedOpenedState";
import { ExtensionContext } from "./preRelease/types";

export default function handlePluginInstalled(
  context: ExtensionContext
): Disposable {
  return onPluginInstalledEmitter.event(() => {
    if (isAlreadyOpenedGettingStarted(context)) return;
    // todo: open webview
    console.log("todo open webview");
  })
}
