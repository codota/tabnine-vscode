import * as vscode from "vscode";
import { getAssistantMode, AssistantMode } from "./AssistantMode";
import { StateType } from "./utils";
import setState from "../binary/requests/setState";
import { StatePayload } from "../globals/consts";
import {
  ASSISTANT_IGNORE_REFRESH_COMMAND,
  ASSISTANT_SET_THRESHOLD_COMMAND,
  THRESHOLD_STATE_KEY,
} from "./globals";

let backgroundThreshold = "Medium";

export function initAssistantThreshold(context: vscode.ExtensionContext): void {
  backgroundThreshold =
    context.workspaceState.get(THRESHOLD_STATE_KEY, backgroundThreshold) ||
    backgroundThreshold;

  registerSetThresholdCommand(context);
}

export function getBackgroundThreshold(): string {
  return backgroundThreshold;
}

function registerSetThresholdCommand(context: vscode.ExtensionContext) {
  if (getAssistantMode() === AssistantMode.Background) {
    context.subscriptions.push(
      vscode.commands.registerCommand(
        ASSISTANT_SET_THRESHOLD_COMMAND,
        async () => {
          const prevThreshold = backgroundThreshold;
          const options: vscode.QuickPickOptions = {
            canPickMany: false,
            placeHolder: `Pick threshold (Currently: ${backgroundThreshold})`,
          };
          const items = ["Low", "Medium", "High"];
          const value = await vscode.window.showQuickPick(items, options);
          if (value && items.includes(value)) {
            backgroundThreshold = value;
            await context.workspaceState.update(
              THRESHOLD_STATE_KEY,
              backgroundThreshold
            );
            void setState({
              [StatePayload.STATE]: {
                state_type: StateType.threshold,
                state: JSON.stringify({
                  from: prevThreshold,
                  to: backgroundThreshold,
                }),
              },
            });
            void vscode.commands.executeCommand(
              ASSISTANT_IGNORE_REFRESH_COMMAND
            );
          }
        }
      )
    );
  }
}
