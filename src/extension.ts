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
import { BRAND_NAME, INSTRUMENTATION_KEY } from "./globals/consts";
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
  getSelectionHandler,
} from "./selectionHandler";
import pollStatuses, { disposeStatus } from "./statusBar/pollStatusBar";
import { registerStatusBar, setDefaultStatus } from "./statusBar/statusBar";
import executeStartupActions from "./binary/startupActionsHandler";
import {
  disposeReporter,
  EventName,
  initReporter,
  report,
} from "./reports/reporter";
import { setBinaryRootPath } from "./binary/paths";
import { setTabnineExtensionContext } from "./globals/tabnineExtensionContext";
import { updatePersistedAlphaVersion } from "./preRelease/versions";
import isCloudEnv from "./cloudEnvs/isCloudEnv";
import setupCloudState from "./cloudEnvs/setupCloudState";
import registerTreeView from "./treeView/registerTreeView";
import { closeAssistant } from "./assistant/requests/request";
import initAssistant from "./assistant/AssistantClient";
import TabnineAuthenticationProvider from "./authentication/TabnineAuthenticationProvider";
import isAuthenticationApiSupported from "./globals/versions";
import registerNotificationsWebview from "./notificationsWidget/notificationsWidgetWebview";
import notifyWorkspaceChanged from "./binary/requests/notifyWorkspaceChanged";
import registerTabnineTodayWidgetWebview from "./tabnineTodayWidget/tabnineTodayWidgetWebview";
import registerCodeReview from "./codeReview/codeReview";
import installAutocomplete from "./autocompleteInstaller";
import touchIsJustInstalledFlag from "./installationFlag";
import openHubWelcomePage from "./welcomePage";
import isInTheLastHour from "./utils/time.utils";
import getBinaryState from "./utils/getBinaryState";

export async function activate(
  context: vscode.ExtensionContext
): Promise<void> {
  if (isCloudEnv) await setupCloudState(context);

  void initStartup(context);
  handleSelection(context);
  handleUninstall(() => uponUninstall(context));

  registerCodeReview();

  registerStatusBar(context);

  // Do not await on this function as we do not want VSCode to wait for it to finish
  // before considering TabNine ready to operate.
  void backgroundInit(context);

  return Promise.resolve();
}

function initStartup(context: vscode.ExtensionContext): void {
  setTabnineExtensionContext(context);
  initReporter(
    context,
    tabnineExtensionProperties.id || "",
    tabnineExtensionProperties.version || "",
    INSTRUMENTATION_KEY
  );
  report(EventName.EXTENSION_ACTIVATED);

  if (tabnineExtensionProperties.isInstalled) {
    report(EventName.EXTENSION_INSTALLED);
  }
}

async function backgroundInit(context: vscode.ExtensionContext) {
  await setBinaryRootPath(context);
  await initBinary();
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

  registerTreeView(context);
  pollNotifications(context);
  pollStatuses(context);
  setDefaultStatus();
  void registerCommands(context);
  pollDownloadProgress();
  void executeStartupActions();
  registerNotificationsWebview(context);
  registerTabnineTodayWidgetWebview(context);

  if (await shouldOpenWelcomePage(context)) {
    await openHubWelcomePage();
  }

  await installAutocomplete(context);

  vscode.languages.registerHoverProvider(
    { pattern: "**" },
    {
      provideHover,
    }
  );
}

async function shouldOpenWelcomePage(context: vscode.ExtensionContext) {
  if (!(await touchIsJustInstalledFlag(context))) {
    return false;
  }

  const binaryState = await getBinaryState();

  return (
    binaryState?.installationTime &&
    binaryState.flags?.shouldUseNewHubDesign &&
    isInTheLastHour(new Date(binaryState?.installationTime))
  );
}

export async function deactivate(): Promise<unknown> {
  disposeReporter();
  void closeAssistant();
  cancelNotificationsPolling();
  disposeStatus();

  return requestDeactivate();
}

function uponUninstall(context: vscode.ExtensionContext): Promise<unknown> {
  void updatePersistedAlphaVersion(context, undefined);
  report(EventName.EXTENSION_UNINSTALLED);
  return uninstalling();
}

function handleSelection(context: vscode.ExtensionContext) {
  if (tabnineExtensionProperties.isTabNineAutoImportEnabled) {
    context.subscriptions.push(
      vscode.commands.registerTextEditorCommand(
        COMPLETION_IMPORTS,
        getSelectionHandler(context)
      ),
      vscode.commands.registerTextEditorCommand(HANDLE_IMPORTS, handleImports)
    );
  }
}

function notifyBinaryAboutWorkspaceChange() {
  const workspaceFolders = vscode.workspace.workspaceFolders
    ? vscode.workspace.workspaceFolders.map((folder) => folder.uri.path)
    : [];

  void notifyWorkspaceChanged(workspaceFolders);
}
