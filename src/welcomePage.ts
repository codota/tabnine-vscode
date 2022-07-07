import { Uri } from "vscode";
import { StateType } from "./globals/consts";
import openHub from "./hub/openHub";
import { setAlreadyOpenedWelcomeFlag } from "./openWelcomeInHubFlag";
import { ExtensionContext } from "./preRelease/types";
import { getHubBaseUrl } from "./utils/binary.utils";

export default async function openHubWelcomePage(
  context: ExtensionContext
): Promise<void> {
  const hubBaseUrl = await getHubBaseUrl(StateType.STARTUP);

  if (hubBaseUrl) {
    await openHub(Uri.parse(`${hubBaseUrl}/welcome`));

    await setAlreadyOpenedWelcomeFlag(context);
  }
}
