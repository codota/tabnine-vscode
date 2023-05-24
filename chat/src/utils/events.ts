import { sendRequestToExtension } from "../hooks/ExtensionCommunicationProvider";
import { getMessageSegments } from "./message";

type Properties = { [key: string]: string | number | boolean };

type EventPayload = {
  eventName: string;
  properties?: Properties;
};

type MessageProperties = {
  totalMessageLength: number;
  codeParts: number;
  codePartsLength: number;
  textParts: number;
  textPartsLength: number;
};

function sendUserSubmittedEvent(message: string) {
  sendEvent("chat-user-submit-message", calcMessageProperties(message));
}

function sendBotSubmittedEvent(message: string) {
  sendEvent("chat-bot-submit-message", calcMessageProperties(message));
}

function sendUserCancelledResponseEvent(message: string) {
  sendEvent("chat-user-cancelled-response", calcMessageProperties(message));
}

function sendUserThumbsUpEvent(message: string) {
  sendEvent("chat-user-thumb-up", calcMessageProperties(message));
}

function sendUserThumbsDownEvent(message: string) {
  sendEvent("chat-user-thumb-down", calcMessageProperties(message));
}

function sendUserClickedOnCopyEvent(message: string) {
  sendEvent("chat-user-click-copy", calcMessageProperties(message));
}

function sendBotResponseErrorEvent(message: string) {
  sendEvent("chat-bot-response-error", {
    ...calcMessageProperties(message),
    errorText: message,
  });
}

function sendUserCleanedConversationEvent() {
  sendEvent("chat-user-clean-conversation", {});
}

function calcMessageProperties(message: string): MessageProperties {
  const messageSegments = getMessageSegments(message);
  return {
    totalMessageLength: messageSegments.reduce(
      (acc, curr) => acc + curr.text.length,
      0
    ),
    codeParts: messageSegments.filter((msg) => msg.kind === "code").length,
    codePartsLength: messageSegments
      .filter((msg) => msg.kind === "code")
      .reduce((acc, curr) => acc + curr.text.length, 0),
    textParts: messageSegments.filter((msg) => msg.kind === "text").length,
    textPartsLength: messageSegments
      .filter((msg) => msg.kind === "text")
      .reduce((acc, curr) => acc + curr.text.length, 0),
    // TODO: add num of current messages, and do the same (codeParts/textParts) for them.
    // need to think if we have to include the current message.
  };
}

function sendEvent(eventName: string, properties: Properties) {
  console.log("Send Event: " + eventName, properties);
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
  sendUserClickedOnCopyEvent,
  sendBotResponseErrorEvent,
  sendUserCleanedConversationEvent,
};
