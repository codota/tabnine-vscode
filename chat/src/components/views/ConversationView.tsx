import React, { useCallback, useEffect, useState } from "react";
import styled from "styled-components";
import Events from "../../utils/events";
import { useChatState } from "../../hooks/useChatState";
import { AbstractMessage } from "../message/AbstractMessage";
import { BotIsTyping } from "../message/BotIsTyping";
import { BotErrorMessage } from "../message/BotErrorMessage";
import { MessageContextProvider } from "../../hooks/useMessageContext";
import { ReactComponent as AbortIcon } from "../../assets/abort.svg";
import { MessageResponse } from "../../types/ChatTypes";
import { useConversationContext } from "../../hooks/useConversationContext";

export function ConversationView(): React.ReactElement {
  const {
    addMessage,
    isBotTyping,
    setIsBotTyping,
    conversationMessages: messages,
  } = useChatState();
  const { id: conversationId } = useConversationContext();
  const [showError, setShowError] = useState(false);
  const [
    currentBotMessage,
    setCurrentBotMessage,
  ] = useState<MessageResponse | null>(null);

  useEffect(() => setShowError(false), [messages.length]);

  const onTextChange = useCallback((messageResponse: MessageResponse) => {
    setCurrentBotMessage(messageResponse);
    setShowError(false);
  }, []);

  const onFinish = useCallback(
    (messageResponse: MessageResponse) => {
      const message = {
        id: messageResponse.id,
        conversationId,
        text: messageResponse.content,
        isBot: true,
        timestamp: Date.now().toString(),
      };
      Events.sendBotSubmittedEvent(message, messages);
      setIsBotTyping(false);
      setCurrentBotMessage(null);
      addMessage(message);
    },
    [messages, addMessage, setIsBotTyping, conversationId]
  );

  const onError = useCallback(
    (messageResponse: MessageResponse) => {
      Events.sendBotResponseErrorEvent(messageResponse.content);
      setShowError(true);
      setIsBotTyping(false);
      setCurrentBotMessage(null);
    },
    [setIsBotTyping]
  );

  return (
    <Wrapper>
      {isBotTyping && (
        <CancelResponseButton
          onClick={() => {
            if (!currentBotMessage) {
              return;
            }
            const partialBotResponse = currentBotMessage.content;
            const message = {
              id: currentBotMessage.id,
              conversationId,
              text: partialBotResponse,
              isBot: true,
              timestamp: Date.now().toString(),
            };
            Events.sendUserCancelledResponseEvent(message, messages);
            setIsBotTyping(false);
            if (partialBotResponse.trim().length > 0) {
              addMessage(message);
            }
            setCurrentBotMessage(null);
          }}
        >
          <AbortIconStyled />
          Cancel
        </CancelResponseButton>
      )}
      <ChatMessagesHolder>
        <>
          {messages.map((message) => (
            <MessageContextProvider key={message.timestamp} message={message}>
              <AbstractMessage />
            </MessageContextProvider>
          ))}
          {showError && (
            <BotErrorMessage
              onRegenerate={() => {
                setIsBotTyping(true);
                setShowError(false);
              }}
            />
          )}
          {isBotTyping && (
            <BotIsTyping
              chatMessages={messages}
              onTextChange={onTextChange}
              onFinish={onFinish}
              onError={onError}
            />
          )}
        </>
      </ChatMessagesHolder>
    </Wrapper>
  );
}

const Wrapper = styled.div`
  padding-bottom: 0.4rem;
  overflow-y: auto;
  height: 100%;
  display: flex;
  flex-direction: column-reverse;
  flex-grow: 1;
`;

const ChatMessagesHolder = styled.div``;

const AbortIconStyled = styled(AbortIcon)`
  margin-right: 0.4rem;
`;

const CancelResponseButton = styled.div`
  margin: 0.5rem;
  padding-left: 0.5rem;
  border: none;
  background-color: transparent;
  &:hover {
    cursor: pointer;
    color: var(--vscode-editorError-foreground);

    ${AbortIconStyled} path {
      fill: var(--vscode-editorError-foreground);
    }
  }
`;
