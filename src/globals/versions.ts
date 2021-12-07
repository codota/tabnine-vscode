import * as semver from "semver";
import tabnineExtensionProperties from "./tabnineExtensionProperties";


export default function isAuthenticationApiSupported(): boolean {
    const AUTHENTICATION_API_VERSION = "1.54.0";
    return semver.gte(
      tabnineExtensionProperties.vscodeVersion,
      AUTHENTICATION_API_VERSION
    );
  }