import * as semver from "semver";
import tabnineExtensionProperties from "./tabnineExtensionProperties";
const AUTHENTICATION_API_VERSION = "1.54.0";

export default function isAuthenticationApiSupported(): boolean {
  return semver.gte(
    tabnineExtensionProperties.vscodeVersion,
    AUTHENTICATION_API_VERSION
  );
}
