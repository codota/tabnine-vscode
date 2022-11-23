import { Disposable } from "vscode";
import { onPluginInstalledEmitter } from "./events/onPluginInstalledEmitter";
import { openGettingStartedWebview } from "./webview/openGettingStartedWebview";
import { isAlreadyOpenedGettingStarted } from "./state/gettingStartedOpenedState";
import { ExtensionContext } from "./preRelease/types";

export default function handlePluginInstalled(
  context: ExtensionContext
): Disposable {
  return onPluginInstalledEmitter.event(() => {
    if (!isAlreadyOpenedGettingStarted(context)) {
      openGettingStartedWebview(context);
    }
  });
}
