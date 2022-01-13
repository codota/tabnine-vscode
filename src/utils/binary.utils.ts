import { configuration } from "../binary/requests/requests";
import { StateType } from "../globals/consts";

export async function getHubBaseUrl(): Promise<string | undefined> {
  const response = await configuration({
    quiet: true,
    source: StateType.MANAGE_TEAM_WEB_VIEW,
  });

  return response?.message;
}
