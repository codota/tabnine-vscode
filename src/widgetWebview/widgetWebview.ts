import { commands, ExtensionContext, window } from "vscode";
import { Capability, isCapabilityEnabled } from "../capabilities/capabilities";
import { StateType } from "../globals/consts";
import WidgetWebviewProvider from "./WidgetWebviewProvider";

interface WidgetWebviewParams {
  viewId: string;
  capability: Capability;
  readyCommand: string;
  getHubBaseUrlSource: StateType;
  hubPath: string;
  onWebviewLoaded: () => void;
}

export default function registerWidgetWebviewProvider(
  context: ExtensionContext,
  widgetWebviewParams: WidgetWebviewParams
): void {
  const provider = new WidgetWebviewProvider(
    widgetWebviewParams.getHubBaseUrlSource,
    widgetWebviewParams.hubPath,
    widgetWebviewParams.onWebviewLoaded
  );

  context.subscriptions.push(
    window.registerWebviewViewProvider(widgetWebviewParams.viewId, provider)
  );

  setWidgetWebviewReady(
    widgetWebviewParams.capability,
    widgetWebviewParams.readyCommand
  );
}

function setWidgetWebviewReady(
  capability: Capability,
  readyCommand: string
): void {
  if (isCapabilityEnabled(capability)) {
    void commands.executeCommand("setContext", readyCommand, true);
  }
}
