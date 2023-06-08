import { useState } from "react";
import constate from "constate";

export function useCreateLastEditorContext() {
  const [lastEditorContextHash, setLastEditorContextHash] = useState<
    string | null
  >(null);

  return {
    lastEditorContextHash,
    setLastEditorContextHash,
  };
}

const [LastEditorContextProvider, useLastEditorContext] = constate(
  useCreateLastEditorContext
);

export { LastEditorContextProvider, useLastEditorContext };
