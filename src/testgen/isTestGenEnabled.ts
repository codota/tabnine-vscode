import {
  Capability,
  isAnyCapabilityEnabled,
} from "../capabilities/capabilities";

export default function isTestGenEnabled() {
  return isAnyCapabilityEnabled(
    Capability.TEST_GEN,
    Capability.ALPHA_CAPABILITY
  );
}
