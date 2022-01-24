import { expect } from "chai";
import * as sinon from "sinon";
import { beforeEach, describe, it } from "mocha";
import retry from "../../utils/retry";

describe("should retry", () => {
  beforeEach(() => {
    sinon.restore();
  });
  it("should retry", async () => {
    let count = 0;
    const spy = sinon.spy(retry);
    const res = await spy(
      () => {
        count += 1;
        return Promise.resolve(count);
      },
      () => false,
      2
    );
    expect(res).to.be.equal(2);
    expect(count).to.be.equal(2);
  });
  it("should not retry if isFulfilled", async () => {
    let count = 0;
    const spy = sinon.spy(retry);
    const res = await spy(
      () => {
        count += 1;
        return Promise.resolve(count);
      },
      () => count === 3,
      100
    );
    expect(res).to.be.equal(3);
    expect(count).to.be.equal(3);
  });
  it("should return immediately if no attempts arg", async () => {
    let count = 0;
    const spy = sinon.spy(retry);
    const res = await spy(
      () => {
        count += 1;
        return Promise.resolve(count);
      },
      () => false
    );
    expect(res).to.be.equal(1);
    expect(count).to.be.equal(1);
  });
});
