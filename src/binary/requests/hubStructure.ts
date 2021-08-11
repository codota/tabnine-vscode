import { tabNineProcess } from "./requests";

type HubNavigation = {
  title: string;
  view: string;
};

export type HubStructureResponse = {
  navigation: HubNavigation[];
};

export function getHubStructure(): Promise<
  HubStructureResponse | null | undefined
> {
  return tabNineProcess.request<HubStructureResponse>({ HubStructure: {} });
}
