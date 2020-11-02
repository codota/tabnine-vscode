import * as child_process from "child_process";
import { ReadLine } from "readline";
import * as stream from "stream";
// eslint-disable-next-line import/no-extraneous-dependencies
import * as TypeMoq from "typemoq";
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
  readLineMock
    .setup((x) => x.once("line", TypeMoq.It.isAny()))
    .callback((x, callback: (line: string) => void) => {
      callback("null");
    });
  spawnedProcessMock.setup((x) => x.stdin).returns(() => stdinMock.object);
  spawnedProcessMock.setup((x) => x.stdout).returns(() => stdoutMock.object);

  return {
    proc: spawnedProcessMock.object,
    readLine: readLineMock.object,
  };
}
