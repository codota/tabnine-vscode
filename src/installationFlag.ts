import { ExtensionContext } from "./preRelease/types";

const IS_JUST_INSTALLED_FLAG = "is-just-installed-tabnine";

export default async function touchIsJustInstalledFlag(
  context: ExtensionContext
): Promise<boolean> {
  const isJustInstalled = !context.globalState.get<boolean>(
    IS_JUST_INSTALLED_FLAG
  );

  if (isJustInstalled) {
    await context.globalState.update(IS_JUST_INSTALLED_FLAG, true);
  }

  return isJustInstalled;
}
