import { ExtensionContext } from "vscode";
import { getState } from "./binary/requests/requests";
import { ProcessState } from "./binary/state";
import { isAlreadyOpenedWelcome } from "./openWelcomeInHubFlag";
import getBinaryState from "./utils/getBinaryState";
import isInTheLastHour, {
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

    if (await shouldOpenWelcomePage(context)) {
      await openHubWelcomePage();
    }
  } catch (e) {
    console.warn(e);
  }
}

async function shouldOpenWelcomePage(
  context: ExtensionContext
): Promise<boolean> {
  if (!isAlreadyOpenedWelcome(context)) {
    return false;
  }

  const binaryState = await getBinaryState();

  return Boolean(
    binaryState?.installationTime &&
      binaryState.enabledFeatures.includes("should_open_welcome_in_hub") &&
      isInTheLastHour(new Date(binaryState.installationTime))
  );
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
      const state = await getState();

      if (
        state?.process_state &&
        isProcessStateAllowToOpenWelcomePage(state.process_state)
      ) {
        stopPolling();
        resolve();
      }
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

function isProcessStateAllowToOpenWelcomePage(
  processState: ProcessState
): boolean {
  return Boolean(
    processState.globalRestartStatus &&
      Object.values(processState.globalRestartStatus).every(
        ({ restartOn }) =>
          !restartOn || isEnoughTimeToOpenWelcomePage(new Date(restartOn))
      )
  );
}

function isEnoughTimeToOpenWelcomePage(restartTime: Date) {
  return restartTime.getTime() - Date.now() > 5 * MINUTE_IN_MS;
}
