import * as tmp from "tmp";
import { promises as fs} from "fs";

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
export async function asyncExists(path: string) : Promise<boolean> {
  try {
    await fs.access(path);
    return true;
  }
  catch {
    return false;
  }
}