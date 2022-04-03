import { tabNineProcess } from "../binary/requests/requests";
import openLogin from "../cloudEnvs/openLogin";
import isCloudEnv from "../cloudEnvs/isCloudEnv";

export function callForLogin(): Promise<unknown> {
  if (isCloudEnv) {
    return openLogin();
  }
  return tabNineProcess.request({ Login: {} });
}

export async function callForLogout(): Promise<unknown> {
  return tabNineProcess.request({ Logout: {} });
}
