import * as vscode from "vscode";
import { commands, extensions } from "vscode";
import {
  deactivate as requestDeactivate,
  initBinary,
} from "../binary/requests/requests";
import { setBinaryDownloadUrl, setBinaryRootPath } from "../binary/paths";
import { setTabnineExtensionContext } from "../globals/tabnineExtensionContext";

import { initReporter } from "../reports/reporter";
import LogReporter from "../reports/LogReporter";
import {
  COMPLETION_IMPORTS,
  HANDLE_IMPORTS,
  handleImports,
  selectionHandler,
} from "../selectionHandler";
import { registerInlineProvider } from "../inlineSuggestions/registerInlineProvider";
import confirmServerUrl from "./update/confirmServerUrl";
import { tryToUpdate } from "./tryToUpdate";
import serverUrl from "./update/serverUrl";
import tabnineExtensionProperties from "../globals/tabnineExtensionProperties";
import { host } from "../utils/utils";
import {
  RELOAD_COMMAND,
  SELF_HOSTED_IGNORE_CERTIFICATE_ERRORS_CONFIGURATION,
  SELF_HOSTED_IGNORE_PROXY_CONFIGURATION,
  SELF_HOSTED_SERVER_CONFIGURATION,
  TABNINE_HOST_CONFIGURATION,
  EXTENSION_ID,
  OPEN_SETTINGS_COMMAND,
  TABNINE_ENTERPISE_CONTEXT_KEY,
} from "./consts";
import TabnineAuthenticationProvider from "../authentication/TabnineAuthenticationProvider";
import {
  BRAND_NAME,
  CONFIG_COMMAND,
  ENTERPRISE_BRAND_NAME,
  IGNORE_CERTIFICATE_ERRORS_CONFIGURATION,
  USE_PROXY_CONFIGURATION,
} from "../globals/consts";
import { StatusBar } from "./statusBar";
import { isHealthyServer } from "./update/isHealthyServer";
import confirm from "./update/confirm";
import registerTabnineChatWidgetWebview from "../tabnineChatWidget/tabnineChatWidgetWebview";
import { Logger } from "../utils/logger";
import confirmReload from "./update/confirmReload";
import SignInUsingCustomTokenCommand from "../authentication/loginWithCustomTokenCommand";
import { SIGN_IN_AUTH_TOKEN_COMMAND } from "../commandsHandler";
import { WorkspaceUpdater } from "../WorkspaceUpdater";
import SelfHostedChatEnabledState from "./tabnineChatWidget/SelfHostedChatEnabledState";
import { emptyStateAuthenticateView } from "../tabnineChatWidget/webviews/emptyStateAuthenticateView";
import { emptyStateNotPartOfATeamView } from "../tabnineChatWidget/webviews/emptyStateNotPartOfATeamView";
import BINARY_STATE from "../binary/binaryStateSingleton";
import { activeTextEditorState } from "../activeTextEditorState";
import { ChatAPI } from "../tabnineChatWidget/ChatApi";
import ChatViewProvider from "../tabnineChatWidget/ChatViewProvider";

export async function activate(
  context: vscode.ExtensionContext
): Promise<void> {
  Logger.init(context);
  setTabnineExtensionContext(context);
  context.subscriptions.push(await setEnterpriseContext());
  context.subscriptions.push(new WorkspaceUpdater());
  context.subscriptions.push(BINARY_STATE);
  context.subscriptions.push(activeTextEditorState);
  context.subscriptions.push(
    commands.registerCommand(CONFIG_COMMAND, () => {
      void commands.executeCommand(
        OPEN_SETTINGS_COMMAND,
        `@ext:tabnine.${EXTENSION_ID}`
      );
    })
  );

  initReporter(new LogReporter());
  const statusBar = new StatusBar(context);

  void uninstallAllOtherExtensionsIfPresent();
  context.subscriptions.push(
    vscode.extensions.onDidChange(() => {
      void uninstallAllOtherExtensionsIfPresent();
    })
  );

  await copyConfigFromUpdater();
  if (!tryToUpdate()) {
    void confirmServerUrl();
    context.subscriptions.push(
      vscode.workspace.onDidChangeConfiguration((event) => {
        if (event.affectsConfiguration(TABNINE_HOST_CONFIGURATION)) {
          Logger.info(
            "Server URL for self hosted has been changed, Checking if healthy."
          );
          void isHealthyServer().then((isHealthy) => {
            Logger.info(
              `New server url is ${isHealthy ? "healthy" : "not healthy"}`
            );
            if (isHealthy) {
              tryToUpdate();
              void confirmReload(
                "Tabnine Enterprise URL has been changed. Please reload for changes to take effect."
              );
            }
          });
        }
      })
    );
    return;
  }

  context.subscriptions.push(
    emptyStateAuthenticateView(context),
    emptyStateNotPartOfATeamView(context)
  );

  const server = serverUrl() as string;

  await setBinaryRootPath(context);

  if (!tabnineExtensionProperties.useProxySupport) {
    process.env.no_proxy = host(server);
    process.env.NO_PROXY = host(server);
  }

  setBinaryDownloadUrl(server);

  const chatEnabledState = new SelfHostedChatEnabledState(context);
  context.subscriptions.push(chatEnabledState);

  registerTabnineChatWidgetWebview(
    context,
    chatEnabledState,
    new ChatViewProvider(
      context,
      new ChatAPI(context, {
        serverUrl: server,
        isSelfHosted: true,
        isTelemetryEnabled: false,
      })
    )
  );

  await initBinary([
    "--no_bootstrap",
    `--cloud2_url=${server}`,
    `--client=vscode-enterprise`,
  ]);
  // Only wait for the process after it was downloaded/started
  statusBar.waitForProcess();
  void registerAuthenticationProviders(context);
  context.subscriptions.push(initSelectionHandling());
  context.subscriptions.push(await registerInlineProvider());
}

async function setEnterpriseContext(): Promise<vscode.Disposable> {
  await vscode.commands.executeCommand(
    "setContext",
    TABNINE_ENTERPISE_CONTEXT_KEY,
    true
  );

  return new vscode.Disposable(() => {
    void vscode.commands.executeCommand(
      "setContext",
      TABNINE_ENTERPISE_CONTEXT_KEY,
      undefined
    );
  });
}

function initSelectionHandling(): vscode.Disposable {
  return vscode.Disposable.from(
    vscode.commands.registerTextEditorCommand(
      COMPLETION_IMPORTS,
      selectionHandler
    ),
    vscode.commands.registerTextEditorCommand(HANDLE_IMPORTS, handleImports)
  );
}

export async function deactivate(): Promise<unknown> {
  return requestDeactivate();
}

function registerAuthenticationProviders(
  context: vscode.ExtensionContext
): void {
  const provider = new TabnineAuthenticationProvider();
  context.subscriptions.push(
    vscode.authentication.registerAuthenticationProvider(
      BRAND_NAME,
      ENTERPRISE_BRAND_NAME,
      provider
    ),
    provider
  );

  context.subscriptions.push(
    commands.registerCommand(
      SIGN_IN_AUTH_TOKEN_COMMAND,
      SignInUsingCustomTokenCommand
    )
  );
}

async function uninstallAllOtherExtensionsIfPresent() {
  return uninstallOtherTabnineIfPresent([
    "tabnine.tabnine-vscode",
    "tabnine.tabnine-vscode-enterprise",
  ]);
}

async function uninstallOtherTabnineIfPresent(extensionIds: string[]) {
  const oldExtensions = extensionIds
    .map((extensionId) => extensions.getExtension(extensionId))
    .filter(Boolean); // remove any undefined

  if (oldExtensions && oldExtensions.length) {
    const uninstall = await confirm(
      "⚠️ You have a conflicting version of Tabnine!",
      "Fix"
    );
    if (uninstall) {
      await Promise.all(
        oldExtensions.map(async (oldExtension) => {
          try {
            await commands.executeCommand(
              "workbench.extensions.uninstallExtension",
              oldExtension?.id
            );
            return true;
          } catch (e) {
            Logger.warn(
              `Error while removing extension ${
                (oldExtension as vscode.Extension<unknown>).id
              }: ${(e as Error).message}`
            );
            return false;
          }
        })
      );
      await commands.executeCommand(RELOAD_COMMAND);
    } else {
      // the user didn't give consent
      // should be some a warning bar or other indication of conflict - waiting for Dima to fix status bar before proceeding
    }
  }
}

async function copyConfigFromUpdater(): Promise<void> {
  const currentConfiguration = await vscode.workspace
    .getConfiguration()
    .get(TABNINE_HOST_CONFIGURATION);

  if (currentConfiguration) {
    return;
  }

  const updaterServerUrlConfig = await vscode.workspace
    .getConfiguration()
    .get(SELF_HOSTED_SERVER_CONFIGURATION);

  if (
    typeof updaterServerUrlConfig === "string" &&
    updaterServerUrlConfig.length > 0
  ) {
    await vscode.workspace
      .getConfiguration()
      .update(TABNINE_HOST_CONFIGURATION, updaterServerUrlConfig, true);
  }

  const disableProxyConfig = vscode.workspace
    .getConfiguration()
    .get(SELF_HOSTED_IGNORE_PROXY_CONFIGURATION);

  if (disableProxyConfig !== undefined) {
    await vscode.workspace
      .getConfiguration()
      .update(USE_PROXY_CONFIGURATION, disableProxyConfig, true);
  }

  const ignoreCertificateErrorsConfig = await vscode.workspace
    .getConfiguration()
    .get(SELF_HOSTED_IGNORE_CERTIFICATE_ERRORS_CONFIGURATION);
  if (ignoreCertificateErrorsConfig !== undefined) {
    await vscode.workspace
      .getConfiguration()
      .update(
        IGNORE_CERTIFICATE_ERRORS_CONFIGURATION,
        ignoreCertificateErrorsConfig,
        true
      );
  }
}
