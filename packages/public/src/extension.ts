import * as vscode from "vscode";
import {
  EventName,
  SELECTION_COMPLETED,
  initBinary,
  initReporter,
  report,
  LogReporter,
  setBinaryRootPath,
  setTabnineExtensionContext,
  tabnineExtensionProperties,
  TabnineAuthenticationProvider,
} from "tabnine-vscode-common";
import handlePreReleaseChannels from "./preRelease/installer";
import pollDownloadProgress from "./binary/pollDownloadProgress";
import { uninstalling } from "./binary/requests/requests";
import {
  Capability,
  fetchCapabilitiesOnFocus,
  isCapabilityEnabled,
} from "./capabilities/capabilities";
import { registerCommands } from "./commandsHandler";
import { BRAND_NAME, INSTRUMENTATION_KEY } from "./globals/consts";
import handleUninstall from "./handleUninstall";
import { provideHover } from "./hovers/hoverHandler";
import pollNotifications, {
  cancelNotificationsPolling,
} from "./notifications/pollNotifications";
import pollStatuses from "./statusBar/pollStatusBar";
import { registerStatusBar, setDefaultStatus } from "./statusBar/statusBar";
import { updatePersistedAlphaVersion } from "./preRelease/versions";
import isCloudEnv from "./cloudEnvs/isCloudEnv";
import setupCloudState from "./cloudEnvs/setupCloudState";
import registerTreeView from "./treeView/registerTreeView";
import isAuthenticationApiSupported from "./globals/versions";
import registerNotificationsWebview from "./notificationsWidget/notificationsWidgetWebview";
import notifyWorkspaceChanged from "./binary/requests/notifyWorkspaceChanged";
import registerTabnineTodayWidgetWebview from "./tabnineTodayWidget/tabnineTodayWidgetWebview";
import registerCodeReview from "./codeReview/codeReview";
import installAutocomplete from "./autocompleteInstaller";
import handlePluginInstalled from "./handlePluginInstalled";
import registerTestGenCodeLens from "./testgen";
import { pollUserUpdates } from "./pollUserUpdates";
import TelemetryReporter from "./reports/TelemetryReporter";

export async function activate(
  context: vscode.ExtensionContext
): Promise<void> {
  console.log("__dirname", __dirname);
  if (isCloudEnv) await setupCloudState(context);

  void initStartup(context);
  // eslint-disable-next-line no-debugger
  // debugger;
  context.subscriptions.push(handleSelection(context));
  context.subscriptions.push(handleUninstall(() => uponUninstall(context)));
  registerCodeReview();

  context.subscriptions.push(registerStatusBar(context));

  // Do not await on this function as we do not want VSCode to wait for it to finish
  // before considering TabNine ready to operate.
  void backgroundInit(context);

  if (context.extensionMode !== vscode.ExtensionMode.Test) {
    handlePluginInstalled(context);
  }

  return Promise.resolve();
}

function initStartup(context: vscode.ExtensionContext): void {
  setTabnineExtensionContext(context);
  let reporter = new LogReporter();
  if (context.extensionMode !== vscode.ExtensionMode.Test) {
    reporter = new TelemetryReporter(
      tabnineExtensionProperties.id || "",
      tabnineExtensionProperties.version || "",
      INSTRUMENTATION_KEY
    );
    context.subscriptions.push(reporter);
  }
  initReporter(reporter);
  report(EventName.EXTENSION_ACTIVATED);

  if (tabnineExtensionProperties.isInstalled) {
    report(EventName.EXTENSION_INSTALLED);
  }
}

async function backgroundInit(context: vscode.ExtensionContext) {
  await setBinaryRootPath(context);
  context.subscriptions.push(await initBinary(["--client=vscode"]));
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
    await vscode.authentication.getSession(BRAND_NAME, [], {
      clearSessionPreference: true,
    });
  }
  registerTestGenCodeLens(context);

  if (context.extensionMode !== vscode.ExtensionMode.Test) {
    void handlePreReleaseChannels(context);
  }

  registerTreeView(context);
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

export function deactivate(): void {
  cancelNotificationsPolling();
}

function uponUninstall(context: vscode.ExtensionContext): Promise<unknown> {
  void updatePersistedAlphaVersion(context, undefined);
  report(EventName.EXTENSION_UNINSTALLED);
  return uninstalling();
}

export function handleSelection(
  context: vscode.ExtensionContext
): vscode.Disposable {
  return vscode.commands.registerTextEditorCommand(
    SELECTION_COMPLETED,
    (editor: vscode.TextEditor) => pollUserUpdates(context, editor)
  );
}

function notifyBinaryAboutWorkspaceChange() {
  const workspaceFolders = vscode.workspace.workspaceFolders
    ? vscode.workspace.workspaceFolders.map((folder) => folder.uri.path)
    : [];

  void notifyWorkspaceChanged(workspaceFolders);
}
