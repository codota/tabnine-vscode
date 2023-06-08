import { snakeCase } from "lodash";
import { sendRequestToExtension } from "../hooks/ExtensionCommunicationProvider";
import { getMessageSegments } from "./messageFormatter";
import { ChatMessages, ChatState } from "../types/ChatTypes";

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
  numOfUserQuestions: number;
};

type ChatStateProperties = {
  numerOfConversations: number;
};

function sendUserSubmittedEvent(
  message: string,
  conversationMessages: ChatMessages
) {
  sendEvent(
    "chat-user-submit-message",
    processMessageProperties(message, conversationMessages)
  );
}

function sendBotSubmittedEvent(
  message: string,
  conversationMessages: ChatMessages
) {
  sendEvent(
    "chat-bot-submit-message",
    processMessageProperties(message, conversationMessages)
  );
}

function sendUserCancelledResponseEvent(
  message: string,
  conversationMessages: ChatMessages
) {
  sendEvent(
    "chat-user-cancelled-response",
    processMessageProperties(message, conversationMessages)
  );
}

function sendUserClickThumbsEvent(
  message: string,
  conversationMessages: ChatMessages,
  isThumbsUp: boolean
) {
  sendEvent("chat-user-click-thumbs", {
    ...processMessageProperties(message, conversationMessages),
    thumbsKind: isThumbsUp ? "up" : "down",
  });
}

function sendUserClickedOnCopyEvent(
  message: string,
  conversationMessages: ChatMessages,
  code: string
) {
  sendEvent("chat-user-click-copy", {
    ...processMessageProperties(message, conversationMessages),
    copiedCodeLength: code.length,
  });
}

function sendUserCopiedTextEvent(
  message: string,
  conversationMessages: ChatMessages,
  text: string = ""
) {
  sendEvent("chat-user-copied-text", {
    ...processMessageProperties(message, conversationMessages),
    copiedTextLength: text.length,
  });
}

function sendBotResponseErrorEvent(
  message: string,
  conversationMessages: ChatMessages
) {
  sendEvent("chat-bot-response-error", {
    ...processMessageProperties(message, conversationMessages),
    errorText: message,
  });
}

function sendUserClearedAllConversationsEvent(chatState: ChatState) {
  sendEvent(
    "chat-user-clear-all-conversations",
    processChatStateProperties(chatState)
  );
}

function sendUserActivatedChat(chatState: ChatState) {
  sendEvent("chat-user-activated-chat", processChatStateProperties(chatState));
}

function sendUserClickedHeaderButtonEvent(
  chatState: ChatState,
  buttonName: string
) {
  sendEvent("chat-user-clicked-header-button", {
    ...processChatStateProperties(chatState),
    buttonName,
  });
}

function sendUserSelectedConversationEvent(chatState: ChatState) {
  sendEvent(
    "chat-user-selected-conversation",
    processChatStateProperties(chatState)
  );
}

function processChatStateProperties(
  chatState?: ChatState
): ChatStateProperties {
  return {
    numerOfConversations: chatState
      ? Object.keys(chatState.conversations).length
      : 0,
  };
}

function processMessageProperties(
  message: string,
  conversationMessages: ChatMessages
): MessageProperties {
  const messageSegments = getMessageSegments(message);
  return {
    totalMessageLength: message.length,
    codeParts: messageSegments.filter((msg) => msg.type === "code").length,
    codePartsLength: messageSegments
      .filter((msg) => msg.type === "code")
      .reduce((acc, curr) => acc + curr.content.length, 0),
    textParts: messageSegments.filter((msg) => msg.type !== "code").length,
    textPartsLength: messageSegments
      .filter((msg) => msg.type !== "code")
      .reduce((acc, curr) => acc + curr.content.length, 0),
    numOfUserQuestions: conversationMessages.filter(
      (chatMessage) => !chatMessage.isBot
    ).length,
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
  sendUserCopiedTextEvent,
  sendBotResponseErrorEvent,
  sendUserClearedAllConversationsEvent,
  sendUserActivatedChat,
  sendUserClickedHeaderButtonEvent,
  sendUserSelectedConversationEvent,
};

export default events;
