import { ExtensionContext } from "../preRelease/types";

export const ALREADY_OPENED_GETTING_STARTED_KEY =
  "already-opened-getting-started";

export async function setAlreadyOpenedGettingStarted(
  context: ExtensionContext
): Promise<void> {
  await context.globalState.update(ALREADY_OPENED_GETTING_STARTED_KEY, true);
}

export function isAlreadyOpenedGettingStarted(
  context: ExtensionContext
): boolean {
  return context.globalState.get<boolean>(
    ALREADY_OPENED_GETTING_STARTED_KEY,
    false
  );
}
