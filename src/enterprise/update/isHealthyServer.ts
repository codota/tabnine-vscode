import { URL } from "url";
import { getHttpStatusCode } from "../../utils/download.utils";
import serverUrl, { validateUrl } from "./serverUrl";

export async function isHealthyServer(): Promise<boolean> {
  const url = serverUrl();
  if (!validateUrl(url)) {
    return false;
  }

  return (await getHttpStatusCode(new URL("/health", url))) === 200;
}
