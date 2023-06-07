import React, { useEffect, useState } from "react";
import styled from "styled-components";
import Events from "../../utils/events";
import { useChatState } from "../../hooks/useChatState";
import { AbstractMessage } from "../message/AbstractMessage";
import { BotIsTyping } from "../message/BotIsTyping";
import { BotErrorMessage } from "../message/BotErrorMessage";
import { MessageContextProvider } from "../../hooks/useMessageContext";
import { ReactComponent as AbortIcon } from "../../assets/abort.svg";

export function ConversationView(): React.ReactElement {
  const {
    conversationMessages,
    addMessage,
    isBotTyping,
    setIsBotTyping,
  } = useChatState();
  const [partialBotResponse, setPartialBotResponse] = useState("");
  const [errorText, setErrorText] = useState("");

  useEffect(() => setErrorText(""), [conversationMessages.length]);

  return (
    <Wrapper>
      {isBotTyping && (
        <CancelResponseButton
          onClick={() => {
            Events.sendUserCancelledResponseEvent(partialBotResponse);
            setIsBotTyping(false);
            if (partialBotResponse.trim().length > 0) {
              addMessage({
                text: partialBotResponse,
                isBot: true,
                timestamp: Date.now().toString(),
              });
            }
            setPartialBotResponse("");
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
          {errorText && (
            <BotErrorMessage
              onRegenerate={() => {
                setIsBotTyping(true);
                setErrorText("");
              }}
            />
          )}
        </>
        {isBotTyping && (
          <BotIsTyping
            chatMessages={conversationMessages}
            onTextChange={(text) => {
              setPartialBotResponse(text);
              setErrorText("");
            }}
            onFinish={(finalBotResponse) => {
              Events.sendBotSubmittedEvent(finalBotResponse);
              setIsBotTyping(false);
              setPartialBotResponse("");
              addMessage({
                text: finalBotResponse,
                isBot: true,
                timestamp: Date.now().toString(),
              });
            }}
            onError={(errorText) => {
              Events.sendBotResponseErrorEvent(errorText);
              setErrorText(errorText);
              setIsBotTyping(false);
              setPartialBotResponse("");
            }}
          />
        )}
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
