import styled from "styled-components";
import userChatIcon from "../assets/user-chat-icon.png";
import { useUserDetails } from "../hooks/useUserDetails";
import { Badge } from "./Badge";

export const UserBadge: React.FC = () => {
  const userDetails = useUserDetails();

  return (
    <Badge
      icon={userChatIcon}
      text={userDetails ? userDetails.username : "Me"}
    />
  );
};
