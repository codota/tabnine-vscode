import React from "react";
import styled from "styled-components";
import { useChatState } from "../hooks/useChatState";
import { ChatConversationView } from "./ChatConversationView";
import { ChatHistoryView } from "./ChatHistoryView";
import { ChatInput } from "./ChatInput";

export const ChatViewManager: React.FC = () => {
  const {
    isBotTyping,
    submitUserMessage,
    currentConversation,
    createNewConversation,
    backToHistory,
  } = useChatState();
  return (
    <Wrapper>
      {!currentConversation ? (
        <ChatHistoryView />
      ) : (
        <>
          <CloseChatButton onClick={backToHistory}>
            Close Conversation
          </CloseChatButton>
          <ChatConversationView />
        </>
      )}
      <ChatInputStyled isDisabled={isBotTyping} onSubmit={submitUserMessage} />
    </Wrapper>
  );
};

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  color: var(--vscode-editor-foreground);
  position: relative;
  height: 100%;
`;

const ChatInputStyled = styled(ChatInput)`
  flex-grow: 0;
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
