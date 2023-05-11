import * as child_process from "child_process";
import { ReadLine } from "readline";
import * as stream from "stream";
// eslint-disable-next-line import/no-extraneous-dependencies
import { anyFunction, anyString, instance, mock, when } from "ts-mockito";
import { isFunction } from "../utils/utils";
import { BinaryProcessRun } from "./runProcess";

export const spawnedProcessMock: child_process.ChildProcess = mock<child_process.ChildProcess>();
export const readLineMock: ReadLine = mock<ReadLine>();
export const stdinMock: stream.Writable = mock<stream.Writable>();
export const stdoutMock: stream.Readable = mock<stream.Readable>();

let onMockReady = () => {};
const isProcessReady: Promise<void> = new Promise((resolve) => {
  onMockReady = resolve;
});

type ResultFunction = { (request: string): unknown };
type Result = ResultFunction | unknown;
export type Item = {
  isQualified: (request: string) => boolean;
  result: Result;
};

export const requestResponseItems: Item[] = [];

let lastPid = 100;
export default function mockedRunProcess(): BinaryProcessRun {
  // eslint-disable-next-line no-plusplus
  const pid = lastPid++;
  when(spawnedProcessMock.killed).thenReturn(false);
  when(spawnedProcessMock.stdin).thenReturn(instance(stdinMock));
  when(spawnedProcessMock.stdout).thenReturn(instance(stdoutMock));
  when(spawnedProcessMock.pid).thenReturn(pid);
  // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
  when(readLineMock.once("line", anyFunction())).thenCall(
    (_event: string, callback: (line: string) => void) => {
      callback("1.2.3");
    }
  );
  mockBinaryRequest();
  mockCapabilitiesRequest();
  onMockReady();

  return {
    proc: instance(spawnedProcessMock),
    readLine: instance(readLineMock),
  };
}

export function isProcessReadyForTest(): Promise<void> {
  return isProcessReady;
}

function mockBinaryRequest(): void {
  let lineCallback: { (line: string): void } | null = null;

  // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
  when(readLineMock.on("line", anyFunction())).thenCall(
    (_: string, callback: (line: string) => void) => {
      lineCallback = callback;
    }
  );
  when(stdinMock.write(anyString(), "utf8")).thenCall((request: string) => {
    const matchingItem = requestResponseItems.find(({ isQualified }) =>
      isQualified(request)
    );

    if (matchingItem) {
      const index = requestResponseItems.indexOf(matchingItem);
      requestResponseItems.splice(index, 1);
    }

    lineCallback?.(
      matchingItem ? response(request, matchingItem.result) : "null"
    );

    return true;
  });
}
export function mockCapabilitiesRequest() {
  requestResponseItems.push({
    isQualified: (request) => {
      const capabilitiesRequest = JSON.parse(request) as {
        request: { Features: { enabled_features: string[] } };
      };

      return !!capabilitiesRequest?.request?.Features;
    },
    result: {
      enabled_features: ["inline_suggestions_mode"],
    },
  });
}

function response(request: string, result: Result) {
  return JSON.stringify(
    isFunction(result) ? (result as ResultFunction)(request) : result
  );
}
