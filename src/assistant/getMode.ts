import { Capability, isCapabilityEnabled } from "../capabilities/capabilities";

const MODE_A = "A";
const MODE_B = "B";
export default function getMode(): string {
  if (isCapabilityEnabled(Capability.ASSISTANT_MODE_A_CAPABILITY_KEY)) {
    return MODE_A;
  }
  if (isCapabilityEnabled(Capability.ASSISTANT_MODE_B_CAPABILITY_KEY)) {
    return MODE_B;
  }
  return MODE_A; // default
}
