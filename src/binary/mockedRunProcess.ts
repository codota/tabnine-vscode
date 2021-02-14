import * as child_process from "child_process";
import { ReadLine } from "readline";
import * as stream from "stream";
import { anyFunction, anyString, instance, mock, when } from "ts-mockito";
import { BinaryProcessRun } from "./runProcess";
import { isFunction } from "../utils";
import { Capability } from "../capabilities";
import { BinaryGenericRequest } from "../test/suite/utils/helper";

export const spawnedProcessMock: child_process.ChildProcess = mock<child_process.ChildProcess>();
export const readLineMock: ReadLine = mock<ReadLine>();
export const stdinMock: stream.Writable = mock<stream.Writable>();
export const stdoutMock: stream.Readable = mock<stream.Readable>();

type ResultFunction = { (request: string): unknown };
type Result = ResultFunction | unknown;
export type Item = {
  isQualified: (request: string) => boolean;
  result: Result;
};

export const requestResponseItems: Item[] = [];

type CapabilitiesRequest = BinaryGenericRequest<{
  Features: Record<string, string>;
}>;

export default function mockedRunProcess(): BinaryProcessRun {
  when(spawnedProcessMock.killed).thenReturn(false);
  when(spawnedProcessMock.stdin).thenReturn(instance(stdinMock));
  when(spawnedProcessMock.stdout).thenReturn(instance(stdoutMock));
  mockBinaryRequest();
  mockCapabilitiesRequest();

  return {
    proc: instance(spawnedProcessMock),
    readLine: instance(readLineMock),
  };
}

function mockCapabilitiesRequest() {
  requestResponseItems.push({
    isQualified: (request) => {
      const completionRequest = JSON.parse(request) as CapabilitiesRequest;

      return !!completionRequest?.request?.Features;
    },
    result: {
      enabled_features: [Capability.ALPHA_CAPABILITY],
    },
  });
}

function mockBinaryRequest(): void {
  let lineCallback: { (line: string): void } | null = null;

  when(readLineMock.on("line", anyFunction())).thenCall(
    (_: string, callback: (line: string) => void) => {
      lineCallback = callback;
    }
  );
  when(stdinMock.write(anyString(), "utf8")).thenCall((request: string) => {
    const matchingItem = requestResponseItems.find(({ isQualified }) =>
      isQualified(request)
    );

    lineCallback?.(
      matchingItem ? response(request, matchingItem.result) : "null"
    );

    return true;
  });
}

function response(request: string, result: Result) {
  return JSON.stringify(
    isFunction(result) ? (result as ResultFunction)(request) : result
  );
}
