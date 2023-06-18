import snakecaseKeys from "snakecase-keys";
import { sendRequestToExtension } from "../components/communication/ExtensionCommunicationProvider";
import { getMessageSegments } from "./messageParser";
import { ChatMessageProps, ChatMessages, ChatState } from "../types/ChatTypes";
import { Intent } from "./slashCommands";

type Properties = { [key: string]: string | number | boolean };

type EventPayload = {
  eventName: string;
  properties?: Properties;
};

type MessageProperties = {
  chatMessageId: string;
  chatConversationId: string;
  totalMessageLength: number;
  codeParts: number;
  codePartsLength: number;
  textParts: number;
  textPartsLength: number;
  numOfUserQuestions: number;
  intent?: Intent;
};

type ChatStateProperties = {
  numOfConversations: number;
};

function sendUserSubmittedEvent(
  message: ChatMessageProps,
  conversationMessages: ChatMessages
) {
  sendEvent(
    "chat-user-submit-message",
    processMessageProperties(message, conversationMessages)
  );
}

function sendBotSubmittedEvent(
  message: ChatMessageProps,
  conversationMessages: ChatMessages
) {
  sendEvent(
    "chat-bot-submit-message",
    processMessageProperties(message, conversationMessages)
  );
}

function sendUserCancelledResponseEvent(
  message: ChatMessageProps,
  conversationMessages: ChatMessages
) {
  sendEvent(
    "chat-user-cancelled-response",
    processMessageProperties(message, conversationMessages)
  );
}

function sendUserClickThumbsEvent(
  message: ChatMessageProps,
  conversationMessages: ChatMessages,
  isThumbsUp: boolean
) {
  sendEvent("chat-user-click-thumbs", {
    ...processMessageProperties(message, conversationMessages),
    thumbsKind: isThumbsUp ? "up" : "down",
  });
}

function sendUserClickedOnCopyEvent(
  message: ChatMessageProps,
  conversationMessages: ChatMessages,
  code: string
) {
  sendEvent("chat-user-click-copy", {
    ...processMessageProperties(message, conversationMessages),
    copiedCodeLength: code.length,
  });
}

function sendUserClickedOnInsertEvent(
  message: ChatMessageProps,
  conversationMessages: ChatMessages,
  code: string
) {
  sendEvent("chat-user-click-insert", {
    ...processMessageProperties(message, conversationMessages),
    copiedCodeLength: code.length,
  });
}

function sendUserClickedOnWrapLinesEvent(
  message: ChatMessageProps,
  conversationMessages: ChatMessages,
  code: string,
  wrapLinesValue: boolean
) {
  sendEvent("chat-user-click-wrap-lines", {
    ...processMessageProperties(message, conversationMessages),
    copiedCodeLength: code.length,
    wrapLinesValue,
  });
}

function sendUserCopiedTextEvent(
  message: ChatMessageProps,
  conversationMessages: ChatMessages,
  text: string = ""
) {
  sendEvent("chat-user-copied-text", {
    ...processMessageProperties(message, conversationMessages),
    copiedTextLength: text.length,
  });
}

function sendBotResponseErrorEvent(message: string) {
  sendEvent("chat-bot-response-error", {
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
    numOfConversations: chatState
      ? Object.keys(chatState.conversations).length
      : 0,
  };
}

function processMessageProperties(
  message: ChatMessageProps,
  conversationMessages: ChatMessages
): MessageProperties {
  const messageSegments = getMessageSegments(message.text);
  return {
    chatMessageId: message.id || "",
    chatConversationId: message.conversationId,
    totalMessageLength: message.text.length,
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
    intent: message.intent,
  };
}

function sendEvent(eventName: string, properties: Properties) {
  sendRequestToExtension<EventPayload, void>({
    command: "send_event",
    data: {
      eventName,
      properties: snakecaseKeys(properties),
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
  sendUserClickedOnWrapLinesEvent,
  sendUserClickedOnInsertEvent,
};

export default events;
