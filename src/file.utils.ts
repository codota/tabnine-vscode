import * as tmp from "tmp";

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
