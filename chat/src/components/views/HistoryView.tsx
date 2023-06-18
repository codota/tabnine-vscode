import React, { useMemo } from "react";
import styled from "styled-components";
import { ConversationItem } from "../general/ConversationItem";
import { useChatState } from "../../hooks/useChatState";
import { HistoryEmptyState } from "../general/HistoryEmptyState";
import Events from "../../utils/events";
import { useClearChatData, useGetChatData } from "../../hooks/chatData";

export const HistoryView: React.FC = () => {
  const { mutate: clearAllConversations } = useClearChatData();
  const { data: chatData } = useGetChatData();
  if (!chatData) {
    return <>Fetching the chat history</>;
  }

  const { conversations } = chatData;
  const { setCurrentConversationData } = useChatState();
  const hasConversations = useMemo(
    () =>
      Object.values(conversations).length > 0 &&
      Object.values(conversations).some(
        (conversation) => conversation.messages.length > 0
      ),
    [conversations]
  );

  const sortedConversations = useMemo(
    () =>
      Object.values(conversations)
        .filter((conversation) => conversation.messages.length > 0)
        .sort(
          (c1, c2) =>
            Number(c2.messages[c2.messages.length - 1].timestamp) -
            Number(c1.messages[c1.messages.length - 1].timestamp)
        ),
    [conversations]
  );

  return (
    <Wrapper>
      <ConversationsList>
        <Top>
          <ChatHistoryText>Chat history</ChatHistoryText>
          {hasConversations && (
            <ConversationActionButton onClick={() => clearAllConversations()}>
              Clear all conversations
            </ConversationActionButton>
          )}
        </Top>
        {!hasConversations && <HistoryEmptyState />}
        {sortedConversations.map((conversation) => (
          <ConversationItem
            key={conversation.id}
            conversation={conversation}
            onClick={() => {
              setCurrentConversationData(conversation);
              Events.sendUserSelectedConversationEvent(chatData);
            }}
          />
        ))}
      </ConversationsList>
    </Wrapper>
  );
};

const Wrapper = styled.div`
  padding-bottom: 0.4rem;
  overflow-y: auto;
  height: 100%;
  display: flex;
  flex-direction: column;
  flex-grow: 1;
`;

const ConversationsList = styled.div`
  padding: 10px;
`;

const Top = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.7rem;
`;

const ConversationActionButton = styled.div`
  text-align: center;
  border: none;
  background-color: transparent;

  &:hover {
    cursor: pointer;
    color: var(--vscode-list-focusHighlightForeground);
  }
`;

const ChatHistoryText = styled.div`
  font-weight: 600;
`;
