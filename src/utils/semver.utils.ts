import * as semver from "semver";

const FIRST = -1;
const EQUAL = 0;
const SECOND = 1;

export default function sortBySemver(versions: string[]): string[] {
  return versions
    .filter((version: string) => semver.valid(version))
    .sort(cmpSemver);
}

function cmpSemver(a: string, b: string): number {
  const aValid = semver.valid(a);
  const bValid = semver.valid(b);

  if (aValid && bValid) {
    return semver.rcompare(a, b);
  }
  if (aValid) {
    return FIRST;
  }
  if (bValid) {
    return SECOND;
  }
  if (a < b) {
    return FIRST;
  }
  if (a > b) {
    return SECOND;
  }
  return EQUAL;
}
