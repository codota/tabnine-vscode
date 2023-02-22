import * as vscode from "vscode";
import {
  deactivate as requestDeactivate,
  initBinary,
} from "./binary/requests/requests";
import { registerCommands } from "./commandsHandler";
import { registerStatusBar, setDefaultStatus } from "./statusBar/statusBar";
import { setBinaryRootPath } from "./binary/paths";
import { setTabnineExtensionContext } from "./globals/tabnineExtensionContext";

import { handleSelection } from "./extension";
import provideCompletionItems from "./provideCompletionItems";
import { COMPLETION_TRIGGERS } from "./globals/consts";

export async function activate(
  context: vscode.ExtensionContext
): Promise<void> {
  console.log("*****THIS IS AN ONPREM BUILD****");
  void initStartup(context);
  handleSelection(context);
  registerStatusBar(context);
  // Do not await on this function as we do not want VSCode to wait for it to finish
  // before considering TabNine ready to operate.
  void backgroundInit(context);
  return Promise.resolve();
}

function initStartup(context: vscode.ExtensionContext): void {
  setTabnineExtensionContext(context);
}

async function backgroundInit(context: vscode.ExtensionContext) {
  await setBinaryRootPath(context);
  await initBinary();

  setDefaultStatus();
  void registerCommands(context);
  context.subscriptions.push(
    languages.registerCompletionItemProvider(
      { pattern: "**" },
      {
        provideCompletionItems,
      },
      ...COMPLETION_TRIGGERS
    )
  );
}

export async function deactivate(): Promise<unknown> {
  return requestDeactivate();
}
