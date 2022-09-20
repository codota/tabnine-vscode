const DEBOUNCE_INTERVAL_MS = 1000;
let lastCompletionRequestTime = new Date();

export function calcDebounceTime(){
    if (lastCompletionRequestTime){
        const elapsedTimeFromLastRequest = new Date().getTime() - lastCompletionRequestTime.getTime();
        if (elapsedTimeFromLastRequest < DEBOUNCE_INTERVAL_MS) {
            console.log(`interval ${DEBOUNCE_INTERVAL_MS - elapsedTimeFromLastRequest}`);
            return DEBOUNCE_INTERVAL_MS - elapsedTimeFromLastRequest;
        }
    }
    console.log(`interval 0`);
    return 0;    
}

export function updateLastCompletionRequestTime(){
    lastCompletionRequestTime = new Date();
}