/* eslint-disable @typescript-eslint/no-unused-expressions */
import { afterEach, describe, it } from "mocha";
import { reset, verify } from "ts-mockito";
import { expect } from "chai";
import {
  readLineMock,
  requestResponseItems,
  stdinMock,
  stdoutMock,
} from "../../binary/mockedRunProcess";
import { resetBinaryForTesting } from "../../binary/requests/requests";
import { sleep } from "../../utils/utils";
import { API_VERSION } from "../../globals/consts";
import {
  Capability,
  isCapabilityEnabled,
} from "../../capabilities/capabilities";

const CAPABILITIES_REQUEST = `${JSON.stringify({
  version: API_VERSION,
  request: { Features: {} },
})}\n`;
describe("Capabilities request", () => {
  afterEach(() => {
    reset(stdinMock);
    reset(stdoutMock);
    reset(readLineMock);
    requestResponseItems.length = 0;
    resetBinaryForTesting();
  });

  it("should query for capabilities immediately on startup", async () => {
    await sleep(500);

    verify(stdinMock.write(CAPABILITIES_REQUEST, "utf8")).once();

    expect(isCapabilityEnabled(Capability.FIRST_SUGGESTION_DECORATION)).to.be
      .true;
    expect(!!isCapabilityEnabled(Capability.ASSISTANT_CAPABILITY)).to.be.false;
  });

  it("should be called again if process restarted", async () => {
    await sleep(1500);

    resetBinaryForTesting();

    await sleep(2000);

    verify(stdinMock.write(CAPABILITIES_REQUEST, "utf8")).twice();
  });

  it("should be called again after interval expired", async () => {
    await sleep(1500);

    verify(stdinMock.write(CAPABILITIES_REQUEST, "utf8")).once();

    await sleep(6000);

    verify(stdinMock.write(CAPABILITIES_REQUEST, "utf8")).twice();
  });
});
