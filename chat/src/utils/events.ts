import { vscode } from "./vscodeApi";

function sendUserSubmittedEvent(length: number) {
    vscode.postMessage({
        command: 'send_event',
        payload: {
            eventName: 'chat-user-submit-message',
            properties: {
                length
            }
        }
    });
}

function sendBotSubmittedEvent(length: number) {
    vscode.postMessage({
        command: 'send_event',
        payload: {
            eventName: 'chat-bot-submit-message',
            properties: {
                length
            }
        }
    });
}

export default {
    sendUserSubmittedEvent,
    sendBotSubmittedEvent
}