import { Disposable } from "vscode";

export type ChatNotEnabledReason =
  | "preview_ended"
  | "capability_required"
  | "authnetication_required"
  | "part_of_a_team_required";

export interface ChatEnabledStateData {
  enabled: boolean;
  loading: boolean;
  chatNotEnabledReason: ChatNotEnabledReason | null;
}

export const ChatStates = {
  enabled: {
    enabled: true,
    loading: false,
    chatNotEnabledReason: null,
  },
  loading: {
    enabled: false,
    loading: true,
    chatNotEnabledReason: null,
  },
  disabled: (reason: ChatNotEnabledReason) => ({
    enabled: false,
    loading: false,
    chatNotEnabledReason: reason,
  }),
};

export default interface ChatEnabledState {
  onChange(subscription: (state: ChatEnabledStateData) => void): Disposable;
}
