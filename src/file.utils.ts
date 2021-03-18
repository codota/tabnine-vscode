import * as tmp from "tmp";
import { promises as fs } from "fs";

const READ_FLAG = "r+";
const BUSY_CODE = "EBUSY";

export default function createTempFileWithPostfix(
  postfix: string
): Promise<tmp.FileResult> {
  return new Promise<tmp.FileResult>((resolve, reject) => {
    tmp.file({ postfix }, (err, path, fd, cleanupCallback) => {
      if (err) {
        return reject(err);
      }
      return resolve(<tmp.FileResult>{
        name: path,
        fd,
        removeCallback: cleanupCallback,
      });
    });
  });
}
export async function asyncExists(path: string): Promise<boolean> {
  try {
    await fs.access(path);
    return true;
  } catch {
    return false;
  }
}
export async function isFileBusy(filePath: string): Promise<boolean> {
  try {
    const res = await fs.open(filePath, READ_FLAG);
    await res.close();
    return false;
  } catch (error) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    if (error.code === BUSY_CODE) {
      return true;
    }
    return false;
  }
}
