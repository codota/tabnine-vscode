import React, { useState, useEffect } from "react";
import styled from "styled-components";
import { v4 as uuidv4 } from "uuid";
import { sendRequestToExtension } from "../hooks/ExtensionCommunicationProvider";
import { ChatState, ChatConversation } from "../types/ChatTypes";
import { ChatConversationItem } from "./ChatConversationItem";
import { ChatConversationView } from "./ChatConversationView";
import tabnineLogo from "../assets/tabnine-logo.png";
import { UserBadge } from "./UserBadge";
import Events from "../utils/events";

export const ChatConversationsView: React.FC = () => {
  const [chatData, setChatData] = useState<ChatState | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [
    selectedConversation,
    setSelectedConversation,
  ] = useState<ChatConversation | null>(null);

  const createNewConversation = () => {
    const newId = uuidv4();
    const newConversation: ChatConversation = {
      id: newId,
      messages: [],
    };
    if (chatData) {
      chatData.conversations[newId] = newConversation;
      setChatData({ ...chatData });
      setSelectedConversation(newConversation);
    }
  };

  const clearAllConversations = async () => {
    Events.sendUserClearedAllConversationsEvent(
      chatData?.conversations ? Object.keys(chatData.conversations).length : 0
    );
    await sendRequestToExtension<void, ChatState>({
      command: "clear_all_chat_conversations",
    });
    setChatData({
      conversations: {},
    });
  };

  useEffect(() => {
    const fetchChatData = async () => {
      const chatState = await sendRequestToExtension<void, ChatState>({
        command: "get_chat_state",
      });

      setChatData(chatState);
      setIsLoading(false);
      if (Object.keys(chatState.conversations).length === 0) {
        createNewConversation();
      }
    };

    fetchChatData();
  }, []);

  const handleConversationClick = (id: string) => {
    if (chatData) {
      setSelectedConversation(chatData.conversations[id]);
    }
  };

  if (isLoading) {
    return <div>Fetch chat data...</div>;
  }

  if (selectedConversation) {
    return (
      <ChatConversationView
        chatConversation={selectedConversation}
        closeConversation={() => setSelectedConversation(null)}
      />
    );
  }

  return (
    <Wrapper>
      <Header>
        <Left>
          <TabnineLogo src={tabnineLogo} />
          <ExperimentalText>Experimental</ExperimentalText>
        </Left>
        <Right>
          <UserBadge />
        </Right>
      </Header>
      <ConversationsList>
        <Actions>
          <ConversationActionButton onClick={createNewConversation}>
            Create a new conversation
          </ConversationActionButton>
          <ConversationActionButton onClick={clearAllConversations}>
            Clear conversations
          </ConversationActionButton>
        </Actions>
        {chatData &&
          Object.values(chatData.conversations)
            .filter((conversation) => conversation.messages.length > 0)
            .sort(
              (c1, c2) =>
                Number(c2.messages[c2.messages.length - 1].timestamp) -
                Number(c1.messages[c1.messages.length - 1].timestamp)
            )
            .map((conversation) => (
              <ChatConversationItem
                key={conversation.id}
                conversation={conversation}
                onClick={() => handleConversationClick(conversation.id)}
              />
            ))}
      </ConversationsList>
    </Wrapper>
  );
};

const Wrapper = styled.div``;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 1.2rem;
  border-bottom: solid 1px var(--vscode-list-inactiveSelectionBackground);
`;

const Left = styled.div`
  display: flex;
  align-items: center;
`;

const Right = styled.div`
  display: flex;
  align-items: center;
`;

const ExperimentalText = styled.div`
  margin-left: 0.5rem;
  font-size: 0.8rem;
  color: #606060; // TODO
`;

const ConversationsList = styled.div`
  padding: 10px;
`;

const Actions = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.7rem;
`;

const ConversationActionButton = styled.div`
  text-align: center;
  border: none;
  background-color: transparent;
  color: var(--vscode-editor-foreground);

  &:hover {
    cursor: pointer;
    color: var(--vscode-list-focusHighlightForeground);
  }
`;

const TabnineLogo = styled.img``;
