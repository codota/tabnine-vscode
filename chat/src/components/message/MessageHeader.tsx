import React, { useState } from "react";
import styled from "styled-components";
import tabnineBotIcon from "../../assets/tabnine-bot.png";
import thubmsUpIcon from "../../assets/thumbs-up.png";
import thubmsDownIcon from "../../assets/thumbs-down.png";
import Events from "../../utils/events";
import { UserBadge } from "../profile/UserBadge";
import { Badge } from "../profile/Badge";

type Props = {
  text: string;
  isBot: boolean;
  withThumbs?: boolean;
};

type RankOptions = "up" | "down" | null;

export function MessageHeader({
  isBot,
  text,
  withThumbs,
}: Props): React.ReactElement {
  const [selectedThumbs, setSelectedThumbs] = useState<RankOptions>(null);
  return (
    <Wrapper>
      {isBot && (
        <BotBadgeWrapper>
          <Badge icon={tabnineBotIcon} text="Tabnine" />
          {withThumbs && (
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
          )}
        </BotBadgeWrapper>
      )}
      {!isBot && <UserBadge />}
    </Wrapper>
  );
}

const Wrapper = styled.div`
  margin-bottom: 0.5rem;
`;

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
