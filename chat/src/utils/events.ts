import { snakeCase } from "lodash";
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

function sendUserClickThumbsEvent(message: string, isThumbsUp: boolean) {
  sendEvent("chat-user-click-thumbs", {
    ...calcMessageProperties(message),
    thumbsKind: isThumbsUp ? "up" : "down",
  });
}

function sendUserClickedOnCopyEvent(message: string, code: string) {
  sendEvent("chat-user-click-copy", {
    ...calcMessageProperties(message),
    codeLength: code.length,
  });
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
  const snakeCaseProperties: { [key: string]: any } = {};
  for (const key in properties) {
    snakeCaseProperties[snakeCase(key)] = properties[key];
  }

  console.log("Send Event: " + eventName, snakeCaseProperties);
  sendRequestToExtension<EventPayload, void>({
    command: "send_event",
    data: {
      eventName,
      properties: snakeCaseProperties,
    },
  });
}

export default {
  sendUserSubmittedEvent,
  sendBotSubmittedEvent,
  sendUserCancelledResponseEvent,
  sendUserClickThumbsEvent,
  sendUserClickedOnCopyEvent,
  sendBotResponseErrorEvent,
  sendUserCleanedConversationEvent,
};