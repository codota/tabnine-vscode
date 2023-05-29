import createClient, { healthy } from "./client";
import serverUrl, { validateUrl } from "./serverUrl";

export async function isHealthyServer(): Promise<boolean> {
  const url = serverUrl();
  if (!validateUrl(url)) {
    return false;
  }
  const client = await createClient(url as string);
  return healthy(client);
}
