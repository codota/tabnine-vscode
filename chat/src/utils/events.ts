import { sendRequestToExtension } from "../hooks/ExtensionCommunicationProvider";

type Properties = { [key: string]: string | number | boolean };

type EventPayload = {
    eventName: string;
    properties?: Properties;
}

function sendUserSubmittedEvent(length: number) {
    sendEvent('chat-user-submit-message', {
        length
    });
}

function sendBotSubmittedEvent(length: number) {
    sendEvent('chat-bot-submit-message', {
        length
    });
}

function sendEvent(eventName: string, properties: Properties) {
    sendRequestToExtension<EventPayload, void>({
        command: 'send_event',
        data: {
            eventName,
            properties
        }
    });
}

export default {
    sendUserSubmittedEvent,
    sendBotSubmittedEvent
}