import { ExtensionContext } from "vscode";
import { Capability } from "../capabilities/capabilities";
import { fireEvent } from "../binary/requests/requests";
import { StateType } from "../globals/consts";
import registerWidgetWebviewProvider from "../widgetWebview/widgetWebview";

const LOADED_NOTIFICATIONS_WIDGET = "loaded-notificaitons-widget-as-webview";

export default function registerNotificationsWebviewProvider(
  context: ExtensionContext
): void {
  registerWidgetWebviewProvider(context, {
    capability: Capability.NOTIFICATIONS_WIDGET,
    getHubBaseUrlSource: StateType.NOTIFICATIONS_WIDGET_WEBVIEW,
    hubPath: "/notifications-widget",
    viewId: "tabnine-notifications",
    readyCommand: "tabnine.notifications-ready",
    onWebviewLoaded: () => {
      void fireEvent({
        name: LOADED_NOTIFICATIONS_WIDGET,
      }).catch(console.error);
    },
  });
}
