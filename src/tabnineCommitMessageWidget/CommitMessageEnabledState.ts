import { Disposable } from "vscode";

export type CommitMessageNotEnabledReason =
  | "preview_ended"
  | "not_logged_in"
  | "capability_required"
  | "disabled_by_setting";

export interface CommitMessageEnabledStateData {
  enabled: boolean;
  loading: boolean;
  commitMessageNotEnabledReason: CommitMessageNotEnabledReason | null;
}

export const CommitMessageStates = {
  enabled: {
    enabled: true,
    loading: false,
    commitMessageNotEnabledReason: null,
  },
  loading: {
    enabled: false,
    loading: true,
    commitMessageNotEnabledReason: null,
  },
  disabled: (reason: CommitMessageNotEnabledReason) => ({
    enabled: false,
    loading: false,
    commitMessageNotEnabledReason: reason,
  }),
};

export default interface CommitMessageEnabledState {
  get(): CommitMessageEnabledStateData;

  onChange(
    subscription: (state: CommitMessageEnabledStateData) => void
  ): Disposable;
}
