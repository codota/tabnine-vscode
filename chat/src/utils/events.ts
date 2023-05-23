import { sendRequestToExtension } from "../hooks/ExtensionCommunicationProvider";

type EventPayload = {
    eventName: string;
    properties?: { [key: string]: string | number | boolean };
}

function sendUserSubmittedEvent(length: number) {
    sendRequestToExtension<EventPayload, void>({
        command: 'send_event',
        data: {
            eventName: 'chat-user-submit-message',
            properties: {
                length
            }
        }
    });
}

function sendBotSubmittedEvent(length: number) {
    sendRequestToExtension<EventPayload, void>({
        command: 'send_event',
        data: {
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