import { getState } from "../binary/requests/requests";

export default async function getToken(): Promise<string | undefined> {
  const state = await getState();
  return state?.access_token;
}
