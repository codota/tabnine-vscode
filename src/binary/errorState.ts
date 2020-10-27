import { workspace } from "vscode";
import { getState } from "./requests/requests";
import { setErrorStatus } from "../statusBar";
import { State } from "./state";

const FIRST_EXECUTION_DELAY = 4000;

let currentFilename: string | null = null;

export function handleErrorState() {
  workspace.onDidOpenTextDocument(({ fileName }) => {
    let firstExecutionDelay = currentFilename ? 0 : FIRST_EXECUTION_DELAY;

    currentFilename = fileName.replace(/[.git]+$/, "");
    setTimeout(async () => {
      const state = await getState({ filename: currentFilename });

      if (isInErrorState(state)) {
        return; // Currently decided that errors will be supressed, until we can provide guidance in the config page.
        setErrorStatus("TODO: ERROR HERE");
      }
    }, firstExecutionDelay);
  });
}

function isInErrorState(state: State | null | undefined) {
  return (
    (state?.local_enabled && !state?.is_cpu_supported) ||
    (state?.cloud_enabled && !state?.is_authenticated)
  );
}
