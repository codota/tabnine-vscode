import { Uri } from "vscode";
import { StateType } from "./globals/consts";
import createHubWebView from "./hub/createHubWebView";
import { setAlreadyOpenedWelcomeFlag } from "./openWelcomeInHubFlag";
import { ExtensionContext } from "./preRelease/types";
import { getHubBaseUrl } from "./utils/binary.utils";

export default async function openHubWelcomePage(
  context: ExtensionContext
): Promise<void> {
  const hubBaseUrl = await getHubBaseUrl(StateType.STARTUP);

  if (hubBaseUrl) {
    const panel = await createHubWebView(Uri.parse(`${hubBaseUrl}/welcome`));
    panel.reveal();

    await setAlreadyOpenedWelcomeFlag(context);
  }
}
