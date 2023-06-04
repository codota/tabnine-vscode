import React, { useState } from "react";
import styled from "styled-components";
import tabnineBotIcon from "../../assets/tabnine-bot.png";
import thubmsUpIcon from "../../assets/thumbs-up.png";
import thubmsDownIcon from "../../assets/thumbs-down.png";
import Events from "../../utils/events";
import { Badge } from "../profile/Badge";
import { useMessageContext } from "../../hooks/useMessageContext";

type RankOptions = "up" | "down" | null;

export function BotMessageHeader(): React.ReactElement {
  const {
    message: { text },
  } = useMessageContext();

  const [selectedThumbs, setSelectedThumbs] = useState<RankOptions>(null);
  return (
    <BotBadgeWrapper>
      <Badge icon={tabnineBotIcon} text="Tabnine" />
      <RateIconsContainer>
        {(!selectedThumbs || selectedThumbs === "down") && (
          <RateIcon
            selectedRank={selectedThumbs}
            onClick={() => {
              setSelectedThumbs("down");
              if (!selectedThumbs) {
                Events.sendUserClickThumbsEvent(text, false);
              }
            }}
            src={thubmsDownIcon}
            alt="Thumbs down"
          />
        )}
        {(!selectedThumbs || selectedThumbs === "up") && (
          <RateIcon
            selectedRank={selectedThumbs}
            onClick={() => {
              setSelectedThumbs("up");
              if (!selectedThumbs) {
                Events.sendUserClickThumbsEvent(text, true);
              }
            }}
            src={thubmsUpIcon}
            alt="Thumbs up"
          />
        )}
      </RateIconsContainer>
    </BotBadgeWrapper>
  );
}

const BotBadgeWrapper = styled.div`
  display: flex;
  justify-content: space-between;
`;

const RateIconsContainer = styled.div`
  & > *:not(:last-child) {
    margin: 0 0.5rem;
  }
`;
const RateIcon = styled.img<{ selectedRank: RankOptions }>`
  &:hover {
    cursor: ${({ selectedRank }) => (!selectedRank ? "pointer" : "initial")};
  }
`;
