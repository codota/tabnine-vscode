import { Logger } from "../../utils/logger";
import AssistantProcess from "../AssistantProcess";
import CancellationToken from "../CancellationToken";
import { ASSISTANT_API_VERSION } from "../globals";
import { getNanoSecTime } from "../utils";

let validationProcess: AssistantProcess | null = null;
let ASSISTANT_BINARY_VERSION: string | undefined;

export async function getAssistantVersion(): Promise<string> {
  if (!ASSISTANT_BINARY_VERSION) {
    ASSISTANT_BINARY_VERSION = await request({
      method: "get_version",
      params: {},
    });
  }
  return ASSISTANT_BINARY_VERSION as string;
}

export async function request<T, R>(
  body: Record<string, T>,
  cancellationToken?: CancellationToken
): Promise<R | undefined> {
  if (validationProcess === null) {
    validationProcess = new AssistantProcess();
  }

  if (validationProcess.shutdowned) {
    return undefined;
  }

  return new Promise((resolve, reject) => {
    const id = getNanoSecTime();
    cancellationToken?.registerCallback(resolve, undefined);

    validationProcess
      ?.post<{ id: number; version: string }, R>(
        { ...body, id, version: ASSISTANT_API_VERSION },
        id
      )
      .then(resolve, reject);
  });
}

export function closeAssistant(): Promise<unknown> {
  Logger.warn("assistant is closing");
  if (validationProcess) {
    const method = "shutdown";
    const body = {
      method,
      params: {},
    };
    validationProcess.shutdowned = true;
    return request(body);
  }
  return Promise.resolve();
}
