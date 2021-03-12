import * as vscode from "vscode";
import handleAlpha, { updatePersistedAlphaVersion } from "./alphaInstaller";
import pollDownloadProgress from "./binary/pollDownloadProgress";
import {
  deactivate as requestDeactivate,
  initBinary,
  uninstalling,
} from "./binary/requests/requests";
import {
  Capability,
  fetchCapabilitiesOnFocus,
  isCapabilityEnabled,
} from "./capabilities";
import { registerCommands } from "./commandsHandler";
import { COMPLETION_TRIGGERS } from "./consts";
import { tabnineContext } from "./extensionContext";
import handleUninstall from "./handleUninstall";
import { provideHover } from "./hovers/hoverHandler";
import pollNotifications, {
  cancelNotificationsPolling,
} from "./notifications/pollNotifications";
import provideCompletionItems from "./provideCompletionItems";
import {
  COMPLETION_IMPORTS,
  handleImports,
  HANDLE_IMPORTS,
  getSelectionHandler,
} from "./selectionHandler";
import pollStatuses, { disposeStatus } from "./statusBar/pollStatusBar";
import { registerStatusBar, setDefaultStatus } from "./statusBar/statusBar";
import { closeValidator } from "./validator/ValidatorClient";
import executeStartupActions from "./binary/startupActionsHandler";

export async function activate(context: vscode.ExtensionContext): Promise<void> {
  await initBinary();
  handleSelection(context);
  handleUninstall(() => uponUninstall(context));

  registerStatusBar(context);

  // Do not await on this function as we do not want VSCode to wait for it to finish
  // before considering TabNine ready to operate.
  void backgroundInit(context);

  return Promise.resolve();
}

async function backgroundInit(context: vscode.ExtensionContext) {
  // Goes to the binary to fetch what capabilities enabled:
  await fetchCapabilitiesOnFocus();

  if (
    isCapabilityEnabled(Capability.ALPHA_CAPABILITY) &&
    process.env.NODE_ENV !== "test"
  ) {
    void handleAlpha(context);
  }
  pollNotifications(context);
  pollStatuses(context);
  setDefaultStatus();
  registerCommands(context);
  pollDownloadProgress();
  void executeStartupActions();
  vscode.languages.registerCompletionItemProvider(
    { pattern: "**" },
    {
      provideCompletionItems,
    },
    ...COMPLETION_TRIGGERS
  );
  vscode.languages.registerHoverProvider(
    { pattern: "**" },
    {
      provideHover,
    }
  );
}

export async function deactivate(): Promise<unknown> {
  void closeValidator();
  cancelNotificationsPolling();
  disposeStatus();

  return requestDeactivate();
}
function uponUninstall(context: vscode.ExtensionContext): Promise<unknown> {
  void updatePersistedAlphaVersion(context, undefined);
  return uninstalling();
}

function handleSelection(context: vscode.ExtensionContext) {
  if (tabnineContext.isTabNineAutoImportEnabled) {
    context.subscriptions.push(
      vscode.commands.registerTextEditorCommand(
        COMPLETION_IMPORTS,
        getSelectionHandler(context)
      ),
      vscode.commands.registerTextEditorCommand(HANDLE_IMPORTS, handleImports)
    );
  }
}
