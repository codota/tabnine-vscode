export class CancellationToken {
    private cancelled = false;
    private callbacks = [];
    constructor() {}

    throwIfCancelled() {
        if (this.isCancelled()) {
            throw Error("Cancelled!");
        }
    }

    isCancelled() {
        return this.cancelled;
    }

    cancel() {
        if (!this.isCancelled()) {
            this.cancelled = true;
            this.callbacks.forEach(callbackArgsPair => callbackArgsPair[0](...callbackArgsPair[1]));
        }
    }

    reset() {
        this.cancelled = false;
        this.callbacks = [];
    }

    registerCallback(callback, ...args) {
        this.callbacks.push([callback, args]);
    }
}