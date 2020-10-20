import { State } from "./state";
import Binary from "./Binary";

export const tabNineProcess = new Binary();

export function autocomplete(requestData: {
  filename: string;
  before: string;
  after: string;
  region_includes_beginning: boolean;
  region_includes_end: boolean;
  max_num_results: number;
}) {
  return tabNineProcess.request({
    Autocomplete: requestData,
  });
}

export function configuration(
  body: { quiet?: boolean } = {}
): Promise<{ message: string }> {
  return tabNineProcess.request(
    {
      Configuration: body,
    },
    5000
  );
}

export function setState(state) {
  return tabNineProcess.request({ SetState: { state_type: state } });
}

export function getState(content: Record<any, any> = {}): Promise<State> {
  return tabNineProcess.request({ State: content });
}

export function deactivate() {
  if (tabNineProcess) {
    return tabNineProcess.request({ Deactivate: {} });
  }

  console.error("No TabNine process");
}

export function uninstalling() {
  return tabNineProcess.request({ Uninstalling: {} });
}

export async function getCapabilities(): Promise<{
  enabled_features: string[];
}> {
  try {
    let result = await tabNineProcess.request({ Features: {} }, 7000);

    if (!Array.isArray(result.enabled_features)) {
      throw new Error("Could not get enabled capabilities");
    }

    return result;
  } catch (error) {
    console.error(error);

    return { enabled_features: [] };
  }
}
