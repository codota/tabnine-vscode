import * as child_process from "child_process";
import { ReadLine } from "readline";
import * as stream from "stream";
// eslint-disable-next-line import/no-extraneous-dependencies
import * as TypeMoq from "typemoq";
import { Capability } from "../capabilities";
import { CapabilitiesResponse } from "./requests/requests";
import { BinaryProcessRun } from "./runProcess";

export const spawnedProcessMock: TypeMoq.IMock<child_process.ChildProcess> = TypeMoq.Mock.ofType<
  child_process.ChildProcess
>();
export const readLineMock: TypeMoq.IMock<ReadLine> = TypeMoq.Mock.ofType<
  ReadLine
>();
export const stdinMock: TypeMoq.IMock<stream.Writable> = TypeMoq.Mock.ofType<
  stream.Writable
>();
export const stdoutMock: TypeMoq.IMock<stream.Readable> = TypeMoq.Mock.ofType<
  stream.Readable
>();

export default function mockedRunProcess(): BinaryProcessRun {
  spawnedProcessMock.setup((x) => x.killed).returns(() => false);
  spawnedProcessMock.setup((x) => x.stdin).returns(() => stdinMock.object);
  spawnedProcessMock.setup((x) => x.stdout).returns(() => stdoutMock.object);
  setCapabilities({
    enabled_features: [Capability.ALPHA_CAPABILITY]
  })
  return {
    proc: spawnedProcessMock.object,
    readLine: readLineMock.object,
  };
}
function setCapabilities(
  capabilities: CapabilitiesResponse
): void {
  let requestHappened = false;
  let kaki: {(line: string): void} | null = null;
  stdinMock.setup((x) =>
    x.write(
      TypeMoq.It.is<string>((request) => {
        const capabilitiesRequest = JSON.parse(request) as { request: { Features: Record<string, unknown> } };
        if (capabilitiesRequest?.request?.Features) {
          if (!requestHappened) {
            console.log('pipi callback called with null');
            kaki!("null");
          } else {
            console.log('pipi callback called');
            kaki!(JSON.stringify(capabilities));
          }
          requestHappened = true;
          return true;
        }

        return false;
      }),
      "utf8"
    )
  );
  readLineMock
    .setup((x) => x.on("line", TypeMoq.It.isAny()))
    .callback((_x, callback: (line: string) => void) => {
      console.log('pipi callback received');
      kaki = callback;
    });
}

