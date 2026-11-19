import { Mastra } from "@mastra/core/mastra";

import { UNIFIED_AGENT_ID, createUnifiedAgent } from "./agents/unified";

let mastraInstance: Mastra | undefined;

/** No storage: nothing about a conversation outlives the request. */
export function getMastra() {
  mastraInstance ??= new Mastra({
    agents: { [UNIFIED_AGENT_ID]: createUnifiedAgent() },
  });
  return mastraInstance;
}

export function getUnifiedAgent() {
  return getMastra().getAgentById(UNIFIED_AGENT_ID);
}
