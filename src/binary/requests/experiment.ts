import { tabNineProcess } from "./requests";

export function getExperimentData(): Promise<any | null | undefined> {
  return tabNineProcess.request<any>({ ExperimentData: {} });
}
