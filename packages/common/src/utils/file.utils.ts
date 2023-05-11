import * as tmp from "tmp";
import {
  watch as fsWatch,
  promises as fs,
  MakeDirectoryOptions,
  PathLike,
  FSWatcher,
} from "fs";

import { join } from "path";

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

export async function ensureExists(
  path: string,
  options: MakeDirectoryOptions = { recursive: true }
): Promise<void> {
  if (!(await asyncExists(path))) await fs.mkdir(path, options);
}

export function watch(
  path: PathLike,
  listener: (event: string, filename: string) => void
): FSWatcher {
  return fsWatch(path, (event, filename) => {
    if (event === "rename") {
      void asyncExists(join(path.toString(), filename)).then((exists) =>
        listener(exists ? "created" : "rename", filename)
      );
    } else {
      listener(event, filename);
    }
  });
}
