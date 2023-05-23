import * as vscode from "vscode";
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
import { TABNINE_HOST_CONFIGURATION } from "./consts";
import TabnineAuthenticationProvider from "../authentication/TabnineAuthenticationProvider";
import { BRAND_NAME, ENTERPRISE_BRAND_NAME } from "../globals/consts";
import { StatusBar } from "./statusBar";
import { isHealthyServer } from "./update/isHealthyServer";

export async function activate(
  context: vscode.ExtensionContext
): Promise<void> {
  setTabnineExtensionContext(context);
  context.subscriptions.push(await setEnterpriseContext());
  initReporter(new LogReporter());
  context.subscriptions.push(new StatusBar());

  if (!tryToUpdate()) {
    void confirmServerUrl();
    context.subscriptions.push(
      vscode.workspace.onDidChangeConfiguration((event) => {
        if (event.affectsConfiguration(TABNINE_HOST_CONFIGURATION)) {
          isHealthyServer().then((isHealthy) => {
            if (isHealthy) {
              tryToUpdate();
            }
          });
        }
      })
    );
    return;
  }

  const server = serverUrl() as string;

  await setBinaryRootPath(context);

  if (!tabnineExtensionProperties.useProxySupport) {
    process.env.no_proxy = host(server);
    process.env.NO_PROXY = host(server);
  }

  setBinaryDownloadUrl(server);

  await initBinary([
    "--no_bootstrap",
    `--cloud2_url=${server}`,
    `--client=vscode-enterprise`,
  ]);
  void registerAuthenticationProviders(context);
  context.subscriptions.push(initSelectionHandling());
  context.subscriptions.push(await registerInlineProvider());
}

async function setEnterpriseContext(): Promise<vscode.Disposable> {
  await vscode.commands.executeCommand(
    "setContext",
    "tabnine.enterprise",
    true
  );
  return new vscode.Disposable(() => {
    void vscode.commands.executeCommand(
      "setContext",
      "tabnine.enterprise",
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

async function registerAuthenticationProviders(
  context: vscode.ExtensionContext
) {
  const provider = new TabnineAuthenticationProvider();
  context.subscriptions.push(
    vscode.authentication.registerAuthenticationProvider(
      BRAND_NAME,
      ENTERPRISE_BRAND_NAME,
      provider
    ),
    provider
  );
}
