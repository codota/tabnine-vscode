import { ExtensionContext } from "vscode";
import { registerChatView } from "../tabnineChatWidget/tabnineChatWidgetWebview";
import { useCurrentUserInfo } from "./userInfoState";

export default function registerTabnineChatWidgetWebview(
  context: ExtensionContext,
  serverUrl: string
): void {
  const disposable = useCurrentUserInfo((userInfo) => {
    if (userInfo?.scopes?.includes("chat")) {
      disposable.dispose();

      registerChatView(serverUrl, context);
    }
  });
}
