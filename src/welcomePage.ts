import { setAlreadyOpenedWelcomeFlag } from "./openWelcomeInHubFlag";
import { ExtensionContext } from "./preRelease/types";

export default async function openHubWelcomePage(
  context: ExtensionContext
): Promise<void> {
  // todo: show welcome page
  await setAlreadyOpenedWelcomeFlag(context);
}
