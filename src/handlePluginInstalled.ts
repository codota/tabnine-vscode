import { Disposable } from "vscode";
import { installationStateEmitter } from "./events/installationStateChangedEmitter";
import { openGettingStartedWebview } from "./webview/openGettingStartedWebview";
import { isAlreadyOpenedGettingStarted } from "./state/gettingStartedOpenedState";
import { ExtensionContext } from "./preRelease/types";

export default function handlePluginInstalled(
  context: ExtensionContext
): Disposable {
  return installationStateEmitter.event(() => {
    if (isAlreadyOpenedGettingStarted(context)) return;
    openGettingStartedWebview(context);
  });
}
