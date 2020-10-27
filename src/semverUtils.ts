import * as semver from "semver";

const FIRST = -1;
const EQUAL = 0;
const SECOND = 1;

export function sortBySemver(versions: string[]) {
  versions.sort(cmpSemver);

  return versions;
}

function cmpSemver(a: string, b: string): number {
  const a_valid = semver.valid(a);
  const b_valid = semver.valid(b);

  if (a_valid && b_valid) {
    return semver.rcompare(a, b);
  } if (a_valid) {
    return FIRST;
  } if (b_valid) {
    return SECOND;
  } if (a < b) {
    return FIRST;
  } if (a > b) {
    return SECOND;
  } 
    return EQUAL;
  
}
