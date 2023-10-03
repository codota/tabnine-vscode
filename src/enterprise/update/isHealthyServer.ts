import { createClient } from "../../utils/http.utils";
import serverUrl, { validateUrl } from "./serverUrl";

export async function isHealthyServer(): Promise<boolean> {
  const url = serverUrl();
  if (!validateUrl(url)) {
    return false;
  }
  const client = createClient({ baseURL: url as string });
  return (await client.get("/health")).status === 200;
}
