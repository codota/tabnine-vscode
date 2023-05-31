import userChatIcon from "../assets/user-chat-icon.png";
import { Badge } from "./Badge";
import { useUserDetailsState } from "../hooks/useUserDetailsState";

export const UserBadge: React.FC = () => {
  const userDetails = useUserDetailsState();

  return <Badge icon={userChatIcon} text={userDetails.username} />;
};
