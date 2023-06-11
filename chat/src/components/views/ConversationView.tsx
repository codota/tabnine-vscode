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

export function ConversationView(): React.ReactElement {
  const {
    conversationMessages,
    addMessage,
    isBotTyping,
    setIsBotTyping,
  } = useChatState();
  const [showError, setShowError] = useState(false);
  const [
    currentBotMessage,
    setCurrentBotMessage,
  ] = useState<MessageResponse | null>(null);

  useEffect(() => setShowError(false), [conversationMessages.length]);

  const onTextChange = useCallback((messageResponse: MessageResponse) => {
    setCurrentBotMessage(messageResponse);
    setShowError(false);
  }, []);

  const onFinish = useCallback(
    (messageResponse: MessageResponse) => {
      const message = {
        id: messageResponse.id,
        text: messageResponse.content,
        isBot: true,
        timestamp: Date.now().toString(),
      };
      Events.sendBotSubmittedEvent(message, conversationMessages);
      setIsBotTyping(false);
      setCurrentBotMessage(null);
      addMessage(message);
    },
    [conversationMessages, addMessage, setIsBotTyping]
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
              text: partialBotResponse,
              isBot: true,
              timestamp: Date.now().toString(),
            };
            Events.sendUserCancelledResponseEvent(
              message,
              conversationMessages
            );
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
          {conversationMessages.map((message) => (
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
              chatMessages={conversationMessages}
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
