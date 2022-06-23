import axios from "axios";
import { StateType } from "../globals/consts";
import { getHubBaseUrl } from "./binary.utils";

interface PartialStateResponse {
  installationTime?: string;
  flags?: {
    shouldUseNewHubDesign?: boolean;
  };
}

export default async function getBinaryState(): Promise<
  PartialStateResponse | undefined
> {
  const binaryHttpServerUrl = await getHubBaseUrl(StateType.STARTUP);

  if (!binaryHttpServerUrl) {
    return undefined;
  }

  const response = await axios.get<PartialStateResponse>(
    `${binaryHttpServerUrl}/state`
  );

  return response.data;
}
