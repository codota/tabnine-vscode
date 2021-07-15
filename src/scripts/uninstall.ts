import { persistStateToGitpodEnvVar } from "../gitpod/state";

void (async () => {
  await persistStateToGitpodEnvVar();
})();
