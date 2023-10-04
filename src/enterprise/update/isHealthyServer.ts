import { getHttpStatusCode } from "../../utils/http.utils";
import serverUrl, { validateUrl } from "./serverUrl";
import { URL } from "url";

export async function isHealthyServer(): Promise<boolean> {
  const url = serverUrl();
  if (!validateUrl(url)) {
    return false;
  }

  return (await getHttpStatusCode(new URL("/health", url).toString())) === 200;
}
