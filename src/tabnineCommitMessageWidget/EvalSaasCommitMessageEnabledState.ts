import { ExtensionContext } from "vscode";
import EventEmitterBasedNonNullState from "../state/EventEmitterBasedNonNullState";
import CommitMessageEnabledState, {
  CommitMessageEnabledStateData,
  CommitMessageStates,
} from "./CommitMessageEnabledState";

export default class EvalSaasCommitMessageEnabledState
  extends EventEmitterBasedNonNullState<CommitMessageEnabledStateData>
  implements CommitMessageEnabledState {
  constructor(_context: ExtensionContext) {
    super(CommitMessageStates.enabled);
  }
}
