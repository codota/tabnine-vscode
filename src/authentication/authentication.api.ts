import { tabNineProcess } from "../binary/requests/requests";

export function callForLogin(): Promise<unknown> {
  return tabNineProcess.request({ Login: {} });
}

export async function callForLogout(): Promise<unknown> {
  return tabNineProcess.request({ Logout: {} });
}
