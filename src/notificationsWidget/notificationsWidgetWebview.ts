import { ExtensionContext } from "vscode";
import { Capability } from "../capabilities/capabilities";
import { fireEvent } from "../binary/requests/requests";
import { StateType } from "../globals/consts";
import registerWidgetWebviewProvider from "../widgetWebview";

function registerNotificaitonsWebviewProvider(context: ExtensionContext): void {
  registerWidgetWebviewProvider(context, {
    capability: Capability.NOTIFICATIONS_WIDGET,
    getHubBaseUrlSource: StateType.NOTIFICATIONS_WIDGET_WEBVIEW,
    hubPath: "/notifications-widget",
    viewId: "tabnine-notifications",
    readyCommand: "tabnine.notifications-ready",
    onWebviewLoaded: () => {
      void fireEvent({
        name: "loaded-notificaitons-widget-as-webview",
      }).catch(console.error);
    },
  });
}

export default registerNotificaitonsWebviewProvider;
