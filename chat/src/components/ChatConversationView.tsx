import React, { useEffect, useState } from "react";
import styled from "styled-components";
import { ChatInput } from "../components/ChatInput";
import { ChatMessages, ChatConversation } from "../types/ChatTypes";
import { ChatMessage } from "../components/ChatMessage";
import Events from "../utils/events";
import { ChatBotIsTyping } from "../components/ChatBotIsTyping";
import { sendRequestToExtension } from "../hooks/ExtensionCommunicationProvider";

type Props = {
  chatConversation: ChatConversation;
  closeConversation(): void;
};

export function ChatConversationView({
  chatConversation,
  closeConversation,
}: Props): React.ReactElement {
  const [chatMessages, setChatMessages] = useState<ChatMessages>(
    chatConversation.messages
  );
  const [isBotTyping, setIsBotTyping] = useState(false);
  const [partialBotResponse, setPartialBotResponse] = useState("");

  const onMessageSubmitted = (userText: string) => {
    Events.sendUserSubmittedEvent(userText);
    setIsBotTyping(true);
    setChatMessages((prevChatMessages) => [
      ...prevChatMessages,
      {
        text: userText,
        isBot: false,
        timestamp: Date.now().toString(),
      },
    ]);
  };

  useEffect(() => {
    if (chatMessages.length > 0) {
      chatConversation.messages = chatMessages;
      sendRequestToExtension<ChatConversation, void>({
        command: "update_chat_conversation",
        data: chatConversation,
      });
    }
  }, [chatMessages]);

  useEffect(() => {
    function handleResponse(eventMessage: MessageEvent) {
      const eventData = eventMessage.data;
      switch (eventData?.command) {
        case "submit-message":
          onMessageSubmitted(eventData.data.input);
      }
    }

    window.addEventListener("message", handleResponse);
    return () => {
      window.removeEventListener("message", handleResponse);
    };
  }, []);

  return (
    <Wrapper>
      <CloseChatButton onClick={closeConversation}>
        Close Conversation
      </CloseChatButton>
      <ChatMessagesContainer>
        <ChatMessagesHolder>
          {chatMessages.map(({ text, isBot, timestamp }) => {
            return <ChatMessage key={timestamp} text={text} isBot={isBot} />;
          })}
          {isBotTyping && (
            <ChatBotIsTyping
              chatMessages={chatMessages}
              onTextChange={setPartialBotResponse}
              onFinish={(finalBotResponse, isError) => {
                if (isError) {
                  Events.sendBotResponseErrorEvent(finalBotResponse);
                } else {
                  Events.sendBotSubmittedEvent(finalBotResponse);
                }

                setIsBotTyping(false);
                setPartialBotResponse("");
                setChatMessages([
                  ...chatMessages,
                  {
                    text: finalBotResponse,
                    isBot: true,
                    timestamp: Date.now().toString(),
                  },
                ]);
              }}
            />
          )}
        </ChatMessagesHolder>
      </ChatMessagesContainer>
      <Bottom>
        {isBotTyping && (
          <CancelResponseButton
            onClick={() => {
              Events.sendUserCancelledResponseEvent(partialBotResponse);
              setIsBotTyping(false);
              setChatMessages([
                ...chatMessages,
                {
                  text: partialBotResponse,
                  isBot: true,
                  timestamp: Date.now().toString(),
                },
              ]);
              setPartialBotResponse("");
            }}
          >
            Cancel response
          </CancelResponseButton>
        )}
        <ChatInputStyled
          isDisabled={isBotTyping}
          onSubmit={onMessageSubmitted}
        />
      </Bottom>
    </Wrapper>
  );
}

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  color: var(--vscode-editor-foreground);
  position: relative;
`;

const ChatMessagesContainer = styled.div`
  padding-bottom: 0.4rem;
  overflow-y: auto;
  height: 100%;
  flex-grow: 1;
  display: flex;
  flex-direction: column-reverse;
`;

const ChatMessagesHolder = styled.div``;

const Bottom = styled.div`
  flex-grow: 0;
  width: 100%;
`;

const CancelResponseButton = styled.div`
  margin: 10px;
  border: none;
  background-color: transparent;
  color: var(--vscode-editorError-foreground);

  &:hover {
    cursor: pointer;
    color: var(--vscode-list-focusHighlightForeground);
  }
`;

const CloseChatButton = styled.div`
  text-align: center;
  margin: 10px;
  border: none;
  background-color: transparent;
  color: var(--vscode-editor-foreground);

  &:hover {
    cursor: pointer;
    color: var(--vscode-list-focusHighlightForeground);
  }
`;

const ChatInputStyled = styled(ChatInput)``;
