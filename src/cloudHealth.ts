import * as https from "https";

export default function cloudHealth(cloudHost: string): Promise<boolean> {
  return new Promise((resolve) => {
    https
      .get(`${cloudHost}/health`, (res) => {
        if (res.statusCode !== 200) {
          resolve(true);
        } else {
          resolve(true);
        }
      })
      .on("error", () => {
        resolve(false);
      });
  });
}
