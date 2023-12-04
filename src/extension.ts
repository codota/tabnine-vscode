import * as vscode from "vscode";
import handlePreReleaseChannels from "./preRelease/installer";
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
} from "./capabilities/capabilities";
import { registerCommands } from "./commandsHandler";
import { BRAND_NAME } from "./globals/consts";
import tabnineExtensionProperties from "./globals/tabnineExtensionProperties";
import handleUninstall from "./handleUninstall";
import { provideHover } from "./hovers/hoverHandler";
import pollNotifications, {
  cancelNotificationsPolling,
} from "./notifications/pollNotifications";
import {
  COMPLETION_IMPORTS,
  handleImports,
  HANDLE_IMPORTS,
  SELECTION_COMPLETED,
  selectionHandler,
} from "./selectionHandler";
import pollStatuses from "./statusBar/pollStatusBar";
import { registerStatusBar, setDefaultStatus } from "./statusBar/statusBar";
import { initReporter, report } from "./reports/reporter";
import { setBinaryRootPath } from "./binary/paths";
import { setTabnineExtensionContext } from "./globals/tabnineExtensionContext";
import { updatePersistedAlphaVersion } from "./preRelease/versions";
import isCloudEnv from "./cloudEnvs/isCloudEnv";
import setupCloudState from "./cloudEnvs/setupCloudState";
import { closeAssistant } from "./assistant/requests/request";
import initAssistant from "./assistant/AssistantClient";
import TabnineAuthenticationProvider from "./authentication/TabnineAuthenticationProvider";
import isAuthenticationApiSupported from "./globals/versions";
import registerNotificationsWebview from "./notificationsWidget/notificationsWidgetWebview";
import notifyWorkspaceChanged from "./binary/requests/notifyWorkspaceChanged";
import registerTabnineTodayWidgetWebview from "./tabnineTodayWidget/tabnineTodayWidgetWebview";
import registerCodeReview from "./codeReview/codeReview";
import installAutocomplete from "./autocompleteInstaller";
import handlePluginInstalled from "./handlePluginInstalled";
import { pollUserUpdates } from "./pollUserUpdates";
import EventName from "./reports/EventName";
import registerTabnineChatWidgetWebview from "./tabnineChatWidget/tabnineChatWidgetWebview";
import { forceRegistrationIfNeeded } from "./registration/forceRegistration";
import { installationState } from "./events/installationStateChangedEmitter";
import { Logger } from "./utils/logger";
import { callForLogin } from "./authentication/authentication.api";
import { emptyStateWelcomeView } from "./tabnineChatWidget/webviews/emptyStateChatWelcomeView";
import { emptyStateAuthenticateView } from "./tabnineChatWidget/webviews/emptyStateAuthenticateView";
import { activeTextEditorState } from "./activeTextEditorState";
import { WorkspaceUpdater } from "./WorkspaceUpdater";
import SaasChatEnabledState from "./tabnineChatWidget/SaasChatEnabledState";
import BINARY_STATE from "./binary/binaryStateSingleton";
import EvalSaasChatEnabledState from "./tabnineChatWidget/EvalSaasChatEnabledState";

export async function activate(
  context: vscode.ExtensionContext
): Promise<void> {
  Logger.init(context);
  if (isCloudEnv) await setupCloudState(context);

  void initStartup(context);
  context.subscriptions.push(handleSelection(context));
  context.subscriptions.push(handleUninstall(() => uponUninstall(context)));
  context.subscriptions.push(installationState);
  context.subscriptions.push(BINARY_STATE);
  context.subscriptions.push(activeTextEditorState);
  context.subscriptions.push(new WorkspaceUpdater());
  registerCodeReview();

  context.subscriptions.push(registerStatusBar(context));

  // Do not await on this function as we do not want VSCode to wait for it to finish
  // before considering TabNine ready to operate.
  void backgroundInit(context);

  if (context.extensionMode !== vscode.ExtensionMode.Test) {
    handlePluginInstalled(context);
  }
  forceRegistrationIfNeeded();

  return Promise.resolve();
}

function initStartup(context: vscode.ExtensionContext): void {
  setTabnineExtensionContext(context);
  initReporter();
  report(EventName.EXTENSION_ACTIVATED);

  if (tabnineExtensionProperties.isInstalled) {
    report(EventName.EXTENSION_INSTALLED);
  }
}

async function backgroundInit(context: vscode.ExtensionContext) {
  await setBinaryRootPath(context);
  await initBinary(["--client=vscode"]);
  // Goes to the binary to fetch what capabilities enabled:
  await fetchCapabilitiesOnFocus();

  notifyBinaryAboutWorkspaceChange();
  vscode.workspace.onDidChangeWorkspaceFolders(
    notifyBinaryAboutWorkspaceChange
  );

  if (
    isCapabilityEnabled(Capability.AUTHENTICATION) &&
    isAuthenticationApiSupported()
  ) {
    context.subscriptions.push(
      vscode.authentication.registerAuthenticationProvider(
        BRAND_NAME,
        BRAND_NAME,
        new TabnineAuthenticationProvider()
      )
    );
  }
  vscode.commands.registerCommand("tabnine.authenticate", () => {
    void callForLogin();
  });
  context.subscriptions.push(
    emptyStateWelcomeView(context),
    emptyStateAuthenticateView(context)
  );

  if (context.extensionMode !== vscode.ExtensionMode.Test) {
    void handlePreReleaseChannels(context);
  }
  if (
    isCapabilityEnabled(Capability.ALPHA_CAPABILITY) ||
    isCapabilityEnabled(Capability.ASSISTANT_CAPABILITY)
  ) {
    void initAssistant(context, {
      dispose: () => {},
    });
  }

  const chatEnabledState =
    process.env.IS_EVAL_MODE &&
    context.extensionMode === vscode.ExtensionMode.Test
      ? new EvalSaasChatEnabledState(context)
      : new SaasChatEnabledState(context);

  context.subscriptions.push(chatEnabledState);

  registerTabnineChatWidgetWebview(
    context,
    chatEnabledState,
    context.extensionMode === vscode.ExtensionMode.Test
      ? process.env.CHAT_SERVER_URL
      : undefined
  );
  pollNotifications(context);
  pollStatuses(context);
  setDefaultStatus();
  void registerCommands(context);
  pollDownloadProgress();
  registerNotificationsWebview(context);
  registerTabnineTodayWidgetWebview(context);

  await installAutocomplete(context);

  vscode.languages.registerHoverProvider(
    { pattern: "**" },
    {
      provideHover,
    }
  );
}

export async function deactivate(): Promise<unknown> {
  void closeAssistant();
  cancelNotificationsPolling();
  return requestDeactivate();
}

function uponUninstall(context: vscode.ExtensionContext): Promise<unknown> {
  void updatePersistedAlphaVersion(context, undefined);
  report(EventName.EXTENSION_UNINSTALLED);
  return uninstalling();
}

export function handleSelection(
  context: vscode.ExtensionContext
): vscode.Disposable {
  return vscode.Disposable.from(
    vscode.commands.registerTextEditorCommand(
      COMPLETION_IMPORTS,
      selectionHandler
    ),
    vscode.commands.registerTextEditorCommand(
      SELECTION_COMPLETED,
      (editor: vscode.TextEditor) => pollUserUpdates(context, editor)
    ),
    vscode.commands.registerTextEditorCommand(HANDLE_IMPORTS, handleImports)
  );
}

function notifyBinaryAboutWorkspaceChange() {
  const workspaceFolders = vscode.workspace.workspaceFolders
    ? vscode.workspace.workspaceFolders.map((folder) => folder.uri.path)
    : [];

  void notifyWorkspaceChanged(workspaceFolders);
}
