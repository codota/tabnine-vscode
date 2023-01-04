import {
  BINARY_STARTUP_GRACE,
  MessageActionsEnum,
  StateType,
} from "../globals/consts";
import openHub from "../hub/openHub";
import { getStartupActions } from "./requests/startupActions";
import { sleep } from "../utils/utils";

export default async function executeStartupActions(): Promise<void> {
  await sleep(BINARY_STARTUP_GRACE);
  const actionsResult = await getStartupActions();

  if (actionsResult?.actions.includes(MessageActionsEnum.OPEN_HUB)) {
    return openHub(StateType.STARTUP)();
  }

  return Promise.resolve();
}
