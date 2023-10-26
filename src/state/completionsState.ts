import { EventEmitter } from "events";
import { workspace } from "vscode";

class CompletionState extends EventEmitter {
  private state: boolean = true;

  private enableTimeout: NodeJS.Timeout | null = null;

  get value(): boolean {
    return this.state;
  }

  set value(enabled: boolean) {
    this.state = enabled;
    this.emit("changed", enabled);

    if (this.enableTimeout) {
      clearTimeout(this.enableTimeout);
      this.enableTimeout = null;
    }

    if (!enabled) {
      const snoozeDuration = workspace
        .getConfiguration("tabnine")
        .get<number>("snoozeDuration", 1);

      this.enableTimeout = setTimeout(() => {
        this.state = true;
      }, snoozeDuration * 60 * 1000);
    }
  }
}

export const completionsState = new CompletionState();
