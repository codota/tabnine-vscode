import { useState, useEffect } from "react";
import { ExtensionMessageEvent } from "../types/MessageEventTypes";
import { vscode } from "../utils/vscodeApi";
import { sendRequestToExtension } from "./ExtensionCommunicationProvider";

type JwtResponse = {
  token?: string;
};

export function useJwt() {
  const [jwt, setJwt] = useState<string | undefined>();

  useEffect(() => {
    sendRequestToExtension<void, JwtResponse>({
      command: "get_jwt",
    }).then((response) => {
      setJwt(response.token);
    });
  }, []);

  return jwt;
}
