import { Uri } from "vscode";
import { StateType } from "./globals/consts";
import openHub from "./hub/openHub";
import { getHubBaseUrl } from "./utils/binary.utils";

export default async function openHubWelcomePage(): Promise<void> {
  const hubBaseUrl = await getHubBaseUrl(StateType.STARTUP);

  if (hubBaseUrl) {
    await openHub(Uri.parse(`${hubBaseUrl}/welcome`));
  }
}
