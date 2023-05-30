import { tabNineProcess } from "../../binary/requests/requests";

type UserInfo = {
  email: string;
  team: [];
  verified: [];
  is_logged_in: boolean;
};
export default function getUserInfo(): Promise<UserInfo | null | undefined> {
  return tabNineProcess.request({ UserInfo: {} });
}
