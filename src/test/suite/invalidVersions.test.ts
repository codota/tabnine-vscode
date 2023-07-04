import { expect } from "chai";
import { suite, it } from "mocha";
import { isBadVersion } from "../../binary/binaryFetcher/binaryValidator";

suite("isValidBinaryVersion", () => {
  it("returns true for a bad version", () => {
    expect(isBadVersion("4.0.47")).to.be.equal(true);
  });
  it("returns true for a version in a non-valid range", () => {
    expect(isBadVersion("4.5.12")).to.be.equal(true);
  });
  it("returns false for a valid version", () => {
    expect(isBadVersion("4.5.13")).to.be.equal(false);
  });
  it("returns false for a version above invalid range", () => {
    expect(isBadVersion("4.5.14")).to.be.equal(false);
  });
  it("returns false for a version below the invalid range", () => {
    expect(isBadVersion("4.4.9")).to.be.equal(false);
  });
  it("should filter the non valid versions from an array of versions", () => {
    const versions = ["4.5.12", "4.0.47", "4.5.13", "4.5.14", "4.4.9", "4.1.1"];

    const filtered = versions.filter((version) => !isBadVersion(version));

    expect(filtered).to.have.members(["4.5.13", "4.5.14", "4.4.9", "4.1.1"]);
  });
});
