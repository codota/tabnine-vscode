import constate from "constate";
import { useUserDetails } from "./useUserDetails";

type UserDetailsResponse = {
  username: string;
};

export function useCreateUserDetailsState(): UserDetailsResponse {
  const userDetails = useUserDetails();

  return {
    username: userDetails ? userDetails.username : "Me",
  };
}

const [UserDetailsStateProvider, useUserDetailsState] = constate(
  useCreateUserDetailsState
);

export { UserDetailsStateProvider, useUserDetailsState };
