import { tabNineProcess } from "../binary/requests/requests";
import { openLogin } from "../cloudEnvs/authentication.api";
import isCloudEnv from "../cloudEnvs/isCloudEnv";

export function callForLogin(): Promise<unknown> {
  if (isCloudEnv) {
    return openLogin();
  }
  return tabNineProcess.request({ Login: {} });
}

export async function callForLogout(): Promise<unknown> {
  if (isCloudEnv) {
    return openLogin();
  }
  return tabNineProcess.request({ Logout: {} });
}
