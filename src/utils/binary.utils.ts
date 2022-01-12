import { configuration, getState } from "../binary/requests/requests";
import { StateType } from "../globals/consts";

export async function isNewerThanVersion(version: Number[]): Promise<boolean> {
  const state = await getState();

  if (state) {
    const binaryVersion = state.version.split(".").map(Number);

    return binaryVersion > version;
  }

  return false;
}

export async function getHubBaseUrl(): Promise<string | undefined> {
  const response = await configuration({
    quiet: true,
    source: StateType.MANAGE_TEAM_WEB_VIEW,
  });

  return response?.message;
}
