import { ExtensionContext } from "./preRelease/types";

const ALREADY_OPENED_WELCOME_FLAG = "already-opened-welcome";

export async function setAlreadyInstalledFlag(
  context: ExtensionContext
): Promise<void> {
  const alreadyOpenedWelcome = isAlreadyOpenedWelcome(context);

  if (!alreadyOpenedWelcome) {
    await context.globalState.update(ALREADY_OPENED_WELCOME_FLAG, true);
  }
}

export function isAlreadyOpenedWelcome(context: ExtensionContext): boolean {
  return context.globalState.get<boolean>(ALREADY_OPENED_WELCOME_FLAG, false);
}
