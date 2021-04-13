import { MessageActions } from "../../globals/consts";
import { tabNineProcess } from "./requests";

export type StartupActionsResult = {
  actions: MessageActions[];
};

export function getStartupActions(): Promise<
  StartupActionsResult | null | undefined
> {
  return tabNineProcess.request<StartupActionsResult>({ StartupActions: {} });
}
