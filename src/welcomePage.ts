import { StateType } from "./globals/consts";
import createHubWebView from "./hub/createHubWebView";
import { setAlreadyOpenedWelcomeFlag } from "./openWelcomeInHubFlag";
import { ExtensionContext } from "./preRelease/types";
import hubUri from "./hub/hubUri";

export default async function openHubWelcomePage(
  context: ExtensionContext
): Promise<void> {
  const welcomeUri = await hubUri(StateType.STARTUP, "welcome");

  if (welcomeUri) {
    const panel = await createHubWebView(welcomeUri);
    panel.reveal();

    await setAlreadyOpenedWelcomeFlag(context);
  }
}
