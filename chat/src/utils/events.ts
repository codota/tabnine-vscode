import { sendRequestToExtension } from "../hooks/ExtensionCommunicationProvider";

type Properties = { [key: string]: string | number | boolean };

type EventPayload = {
  eventName: string;
  properties?: Properties;
};

function sendUserSubmittedEvent(length: number) {
  sendEvent("chat-user-submit-message", {
    length,
  });
}

function sendBotSubmittedEvent(length: number) {
  sendEvent("chat-bot-submit-message", {
    length,
  });
}

function sendUserCancelledResponseEvent(length: number) {
  sendEvent("chat-user-cancelled-response", {
    length,
  });
}

function sendUserThumbsUpEvent(length: number) {
  sendEvent("chat-user-thumb-up", {
    length,
  });
}

function sendUserThumbsDownEvent(length: number) {
  sendEvent("chat-user-thumb-down", {
    length,
  });
}

function sendUserClickedOnCopyEvent(length: number) {
  sendEvent("chat-user-click-copy", {
    length,
  });
}

function sendEvent(eventName: string, properties: Properties) {
  sendRequestToExtension<EventPayload, void>({
    command: "send_event",
    data: {
      eventName,
      properties,
    },
  });
}

export default {
  sendUserSubmittedEvent,
  sendBotSubmittedEvent,
  sendUserCancelledResponseEvent,
  sendUserThumbsUpEvent,
  sendUserThumbsDownEvent,
  sendUserClickedOnCopyEvent
};
