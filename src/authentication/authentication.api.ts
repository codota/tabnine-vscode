import { tabNineProcess } from "../binary/requests/requests";
import { openExternalLogin } from "../cloudEnvs/openLogin";
import isCloudEnv from "../cloudEnvs/isCloudEnv";
import tabnineExtensionProperties from "../globals/tabnineExtensionProperties";

export function callForLogin(): Promise<unknown> {
  if (isCloudEnv || tabnineExtensionProperties.isRemote) {
    return openExternalLogin();
  }
  return tabNineProcess.request({ Login: {} });
}

export async function callForLogout(): Promise<unknown> {
  return tabNineProcess.request({ Logout: {} });
}

export async function loginWithCustomToken(
  customToken: string
): Promise<unknown> {
  return tabNineProcess.request({
    LoginWithCustomToken: { custom_token: customToken },
  });
}
