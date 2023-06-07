import { snakeCase } from "lodash";
import { sendRequestToExtension } from "../hooks/ExtensionCommunicationProvider";
import { getMessageSegments } from "./messageFormatter";

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

function sendUserClearedAllConversationsEvent(
  numOfCurrentConversations: number
) {
  sendEvent("chat-user-clear-all-conversations", {
    numOfCurrentConversations,
  });
}

function calcMessageProperties(message: string): MessageProperties {
  const messageSegments = getMessageSegments(message);
  return {
    totalMessageLength: message.length,
    codeParts: messageSegments.filter((msg) => msg.type === "code").length,
    codePartsLength: messageSegments
      .filter((msg) => msg.type === "code")
      .reduce((acc, curr) => acc + curr.content.length, 0),
    textParts: messageSegments.filter((msg) => msg.type === "text").length,
    textPartsLength: messageSegments
      .filter((msg) => msg.type === "text")
      .reduce((acc, curr) => acc + curr.content.length, 0),
    // TODO: add num of current messages, and do the same (codeParts/textParts) for them.
    // need to think if we have to include the current message.
  };
}

function sendEvent(eventName: string, properties: Properties) {
  const snakeCaseProperties: { [key: string]: any } = {};
  for (const key in properties) {
    snakeCaseProperties[snakeCase(key)] = properties[key];
  }

  sendRequestToExtension<EventPayload, void>({
    command: "send_event",
    data: {
      eventName,
      properties: snakeCaseProperties,
    },
  });
}

const events = {
  sendUserSubmittedEvent,
  sendBotSubmittedEvent,
  sendUserCancelledResponseEvent,
  sendUserClickThumbsEvent,
  sendUserClickedOnCopyEvent,
  sendBotResponseErrorEvent,
  sendUserClearedAllConversationsEvent,
};

export default events;
