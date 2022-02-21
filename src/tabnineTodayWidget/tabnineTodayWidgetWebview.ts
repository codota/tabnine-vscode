import { ExtensionContext } from "vscode";
import { fireEvent } from "../binary/requests/requests";
import { Capability } from "../capabilities/capabilities";
import { StateType } from "../globals/consts";
import registerWidgetWebviewProvider from "../widgetWebview/widgetWebview";

const LOADED_TABNINE_TODAY_WIDGET = "loaded-tabnine-today-widget-as-webview";

export default function registerTabnineTodayWidgetWebview(
  context: ExtensionContext
): void {
  registerWidgetWebviewProvider(context, {
    capability: Capability.TABNINE_TODAY_WIDGET,
    getHubBaseUrlSource: StateType.TABNINE_TODAY_WIDGET_WEBVIEW,
    hubPath: "/tabnine-today-widget",
    readyCommand: "tabnine.tabnine-today-ready",
    viewId: "tabnine-today",
    onWebviewLoaded: () => {
      void fireEvent({
        name: LOADED_TABNINE_TODAY_WIDGET,
      }).catch(console.error);
    },
  });
}
