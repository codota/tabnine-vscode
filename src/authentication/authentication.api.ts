import { tabNineProcess } from "../binary/requests/requests";
import { openExternalLogin } from "../cloudEnvs/openLogin";
import isCloudEnv from "../cloudEnvs/isCloudEnv";
import tabnineExtensionProperties from "../globals/tabnineExtensionProperties";
import { notifyOnError } from "../utils/notifyOnError";

export async function callForLogin(): Promise<void> {
  return notifyOnError(async () => {
    if (isCloudEnv || tabnineExtensionProperties.isRemote) {
      await openExternalLogin();
    }
    await tabNineProcess.request({ Login: {} });
  }, "Failed to call for login");
}

export async function callForLogout(): Promise<unknown> {
  return notifyOnError(
    () => tabNineProcess.request({ Logout: {} }),
    "Failed to call for logout"
  );
}

export async function signInUsingCustomToken(
  customToken: string
): Promise<unknown> {
  return notifyOnError(
    () => tabNineProcess.request({ LoginWithCustomToken: { customToken } }),
    "Failed to sign in using custom token"
  );
}

export async function signInUsingCustomTokenUrl(): Promise<
  string | null | undefined
> {
  return notifyOnError(
    () =>
      tabNineProcess.request({
        LoginWithCustomTokenUrl: { customTokenUrl: true },
      }),
    "Failed to sign in using custom token url"
  );
}
