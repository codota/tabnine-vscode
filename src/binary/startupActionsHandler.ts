import {
  BINARY_STARTUP_GRACE,
  MessageActions,
  StateType,
} from "../globals/consts";
import { openConfigWithSource } from "../commandsHandler";
import { getStartupActions } from "./requests/startupActions";
import { sleep } from "../utils/utils";

export default async function executeStartupActions(): Promise<void> {
  await sleep(BINARY_STARTUP_GRACE);
  const actionsResult = await getStartupActions();

  if (actionsResult?.actions.includes(MessageActions.OPEN_HUB)) {
    return openConfigWithSource(StateType.STARTUP)();
  }

  return Promise.resolve();
}
