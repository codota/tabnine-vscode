import { expect } from "chai";
import { suite, it } from "mocha";
import { isValidBinaryVersion } from "../../binary/binaryFetcher/binaryValidator";

suite.only("isValidBinaryVersion", () => {
  it("returns false for a bad version", () => {
    expect(isValidBinaryVersion("4.0.47")).to.be.equal(false);
  });
  it("returns false for a version in a non-valid range", () => {
    expect(isValidBinaryVersion("4.5.12")).to.be.equal(false);
  });
  it("returns true for a valid version", () => {
    expect(isValidBinaryVersion("4.5.13")).to.be.equal(true);
  });
  it("returns true for a version above invalid range", () => {
    expect(isValidBinaryVersion("4.5.14")).to.be.equal(true);
  });
  it("returns true for a version below the invalid range", () => {
    expect(isValidBinaryVersion("4.4.9")).to.be.equal(true);
  });
});
