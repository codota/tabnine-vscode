import { ExtensionContext } from "./preRelease/types";

const ALREADY_INSTALLED_FLAG = "already-installed";

export default async function touchAlreadyInstalledFlag(
  context: ExtensionContext
): Promise<boolean> {
  const aleadyInsalled = context.globalState.get<boolean>(
    ALREADY_INSTALLED_FLAG,
    false
  );

  if (!aleadyInsalled) {
    await context.globalState.update(ALREADY_INSTALLED_FLAG, true);
  }

  return aleadyInsalled;
}
