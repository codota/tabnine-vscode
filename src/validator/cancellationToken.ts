export class CancellationToken {
    private cancelled = false;
    private callbacks = [];
    constructor() {}

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
        if (this.isCancelled()) {
            callback(...args)
        } else {
            this.callbacks.push([callback, args]);
        }
    }
}