import { ExtensionContext } from "vscode";
import { fireEvent } from "../binary/requests/requests";
import { Capability } from "../capabilities/capabilities";
import { StateType } from "../globals/consts";
import registerWidgetWebviewProvider from "../widgetWebview";

function registerTabnineTodayWidgetWebview(context: ExtensionContext) {
  registerWidgetWebviewProvider(context, {
    capability: Capability.TABNINE_TODAY_WIDGET,
    getHubBaseUrlSource: StateType.TABNINE_TODAY_WIDGET_WEBVIEW,
    hubPath: "/tabnine-today-widget",
    readyCommand: "tabnine.tabnine-today-ready",
    viewId: "tabnine-today",
    onWebviewLoaded: () => {
      void fireEvent({
        name: "loaded-tabnine-today-widget-as-webview",
      }).catch(console.error);
    },
  });
}

export default registerTabnineTodayWidgetWebview;
