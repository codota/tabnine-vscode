import * as vscode from "vscode";

import {
  LogReporter,
  TabnineAuthenticationProvider,
  initBinary,
  initReporter,
  registerInlineProvider,
  setBinaryDownloadUrl,
  setBinaryRootPath,
  setTabnineExtensionContext,
  tabnineExtensionProperties,
} from "tabnine-vscode-common";
import confirmServerUrl from "./update/confirmServerUrl";
import { registerStatusBar } from "./registerStatusBar";
import { tryToUpdate } from "./tryToUpdate";
import serverUrl from "./update/serverUrl";
import { host } from "./utils";
import {
  BRAND_NAME,
  ENTERPRISE_BRAND_NAME,
  TABNINE_HOST_CONFIGURATION,
} from "./consts";

export async function activate(
  context: vscode.ExtensionContext
): Promise<void> {
  setTabnineExtensionContext(context);
  initReporter(new LogReporter());
  await registerAuthenticationProviders(context);

  if (!tryToUpdate()) {
    void confirmServerUrl();
    context.subscriptions.push(
      vscode.workspace.onDidChangeConfiguration((event) => {
        if (event.affectsConfiguration(TABNINE_HOST_CONFIGURATION)) {
          tryToUpdate();
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

  context.subscriptions.push(
    await initBinary([
      "--no_bootstrap",
      `--cloud2_url=${server}`,
      `--client=vscode-enterprise`,
    ])
  );
  context.subscriptions.push(registerStatusBar());
  context.subscriptions.push(await registerInlineProvider());
}

async function registerAuthenticationProviders(
  context: vscode.ExtensionContext
) {
  context.subscriptions.push(
    vscode.authentication.registerAuthenticationProvider(
      BRAND_NAME,
      ENTERPRISE_BRAND_NAME,
      new TabnineAuthenticationProvider()
    )
  );
  await vscode.authentication.getSession(BRAND_NAME, [], {
    clearSessionPreference: true,
  });
}
