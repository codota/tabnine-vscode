import { MessageAction } from "../../globals/consts";
import { tabNineProcess } from "./requests";

export type StartupActionsResult = {
  actions: MessageAction[];
};

export function getStartupActions(): Promise<
  StartupActionsResult | null | undefined
> {
  return tabNineProcess.request<StartupActionsResult>({ StartupActions: {} });
}
