import { ExtensionContext } from "vscode";
import { isAlreadyOpenedWelcome } from "./openWelcomeInHubFlag";
import {
  MINUTE_IN_MS,
  SECOND_IN_MS,
} from "./utils/time.utils";
import { withPolling } from "./utils/utils";
import openHubWelcomePage from "./welcomePage";

const WAIT_FOR_OPEN_TIMING_INTERVAL = 2 * SECOND_IN_MS;
const WAIT_FOR_OPEN_TIMING_TIMEOUT = 3 * MINUTE_IN_MS;

export default async function handleOpenWelcomeInHub(
  context: ExtensionContext
): Promise<void> {
  try {
    await waitForTimingToOpenWelcomePage();

    if (shouldOpenWelcomePage(context)) {
      await openHubWelcomePage(context);
    }
  } catch (e) {
    console.warn(e);
  }
}

function shouldOpenWelcomePage(
  context: ExtensionContext
): boolean {
  if (isAlreadyOpenedWelcome(context)) {
    return false;
  }

  return Boolean(true);
}

function waitForTimingToOpenWelcomePage() {
  return new Promise<void>((resolve, reject) => {
    const onTimeout = () => {
      reject(
        new Error(
          `Didn't get the right timing to open welcome within ${
            WAIT_FOR_OPEN_TIMING_TIMEOUT / MINUTE_IN_MS
          } minutes`
        )
      );
    };
    const pollProcessState = async (stopPolling: () => void) => {
      console.log(stopPolling);
      resolve();
    };

    withPolling(
      pollProcessState,
      WAIT_FOR_OPEN_TIMING_INTERVAL,
      WAIT_FOR_OPEN_TIMING_TIMEOUT,
      true,
      onTimeout
    );
  });
}
