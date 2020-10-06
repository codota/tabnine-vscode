export class CancellationToken {
    private cancelled: boolean;
    private promise: Promise<any>;
    private resolve;
    constructor() {
        this.reset();
    }

    throwIfCancelled() {
        if (this.isCancelled()) {
            throw "Cancelled!";
        }
    }

    isCancelled() {
        return this.cancelled === true;
    }

    getPromise() {
        return this.promise;
    }

    cancel() {
        this.cancelled = true;
        this.resolve(null);
    }

    reset() {
        this.cancelled = false;
        this.promise = new Promise(resolve => {
            this.resolve = resolve;
        });
    }
}