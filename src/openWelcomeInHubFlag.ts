import { ExtensionContext } from "./preRelease/types";

const ALREADY_OPENED_WELCOME_FLAG = "already-opened-welcome";

export async function setAlreadyOpenedWelcomeFlag(
  context: ExtensionContext
): Promise<void> {
  await context.globalState.update(ALREADY_OPENED_WELCOME_FLAG, true);
}

export function isAlreadyOpenedWelcome(context: ExtensionContext): boolean {
  return context.globalState.get<boolean>(ALREADY_OPENED_WELCOME_FLAG, false);
}
