import { tabNineProcess } from "tabnine-vscode-common";
import openLogin from "../../../public/src/cloudEnvs/openLogin";
import isCloudEnv from "../../../public/src/cloudEnvs/isCloudEnv";

export function callForLogin(): Promise<unknown> {
  if (isCloudEnv) {
    return openLogin();
  }
  return tabNineProcess.request({ Login: {} });
}

export async function callForLogout(): Promise<unknown> {
  return tabNineProcess.request({ Logout: {} });
}
