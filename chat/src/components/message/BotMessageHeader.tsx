import React, { useState } from "react";
import styled, { css } from "styled-components";
import tabnineBotIcon from "../../assets/tabnine-bot.png";
import tabnineErrorBotIcon from "../../assets/tabnine-error-bot.png";
import { ReactComponent as ThubmsUpIcon } from "../../assets/thumbs-up.svg";
import { ReactComponent as ThubmsDownIcon } from "../../assets/thumbs-down.svg";
import Events from "../../utils/events";
import { Badge } from "../profile/Badge";
import { useMessageContext } from "../../hooks/useMessageContext";
import { useCurrentConversationState } from "../../hooks/useCurrentConversationState";

type RankOptions = "up" | "down" | null;

export function BotMessageHeader(): React.ReactElement {
  const { message, isError } = useMessageContext();

  const { conversationMessages } = useCurrentConversationState();

  const [selectedThumbs, setSelectedThumbs] = useState<RankOptions>(null);
  return (
    <BotBadgeWrapper>
      <Badge
        icon={isError ? tabnineErrorBotIcon : tabnineBotIcon}
        text="Tabnine"
      />
      <Right>
        <RateIconsContainer>
          <ThumbsIconWrapper
            selectedThumbs={selectedThumbs}
            selected={selectedThumbs === "down"}
            onClick={() => {
              if (selectedThumbs) {
                return;
              }
              setSelectedThumbs("down");
              if (!selectedThumbs) {
                Events.sendUserClickThumbsEvent(
                  message,
                  conversationMessages,
                  false
                );
              }
            }}
          >
            <ThubmsDownIcon />
          </ThumbsIconWrapper>
          <ThumbsIconWrapper
            selectedThumbs={selectedThumbs}
            selected={selectedThumbs === "up"}
            onClick={() => {
              if (selectedThumbs) {
                return;
              }
              setSelectedThumbs("up");
              if (!selectedThumbs) {
                Events.sendUserClickThumbsEvent(
                  message,
                  conversationMessages,
                  true
                );
              }
            }}
          >
            <ThubmsUpIcon />
          </ThumbsIconWrapper>
        </RateIconsContainer>
      </Right>
    </BotBadgeWrapper>
  );
}

const BotBadgeWrapper = styled.div`
  display: flex;
  justify-content: space-between;
`;

const RateIconsContainer = styled.div`
  display: flex;
  align-items: center;
  & > *:not(:last-child) {
    margin: 0 0.5rem;
  }
`;

const Right = styled.div`
  display: flex;
  align-items: center;
`;

const ThumbsIconWrapper = styled.span<{
  selectedThumbs: RankOptions;
  selected: boolean;
}>`
  cursor: ${({ selectedThumbs }) => (!selectedThumbs ? "pointer" : "initial")};
  path {
    fill: ${({ selected }) => (selected ? "#e0e0e0" : "#7F7F7F")};
  }

  ${({ selectedThumbs }) =>
    selectedThumbs
      ? ""
      : css`
          &:hover {
            path {
              fill: #e0e0e0;
            }
          }
        `};
`;
