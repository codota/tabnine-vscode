import { useState, useEffect } from "react";
import { sendRequestToExtension } from "./ExtensionCommunicationProvider";

type UserDetailsResponse = {
  token: string;
  username: string;
};

export function useUserDetails(): UserDetailsResponse | undefined {
  const [userDetails, setUserDetails] = useState<
    UserDetailsResponse | undefined
  >();

  useEffect(() => {
    sendRequestToExtension<void, UserDetailsResponse>({
      command: "get_user",
    }).then(({ token, username }) => {
      setUserDetails({
        token,
        username,
      });
    });
  }, []);

  return userDetails;
}
