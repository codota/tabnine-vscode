import * as child_process from "child_process";

export default class VersionChecker {
  isWorking = (versionFullPath: string): boolean => {
    try {
      child_process.execSync(`${versionFullPath} --print-version`);
      return true;
    } catch (error) {
      return false;
    }
  };
}
