import serverUrl from "./update/serverUrl";
import updateAndReload from "./update/updateAndReload";

// eslint-disable-next-line import/prefer-default-export
export function tryToUpdate(): boolean {
  const url = serverUrl();
  if (url) {
    void updateAndReload(url);
  }
  return !!url;
}
