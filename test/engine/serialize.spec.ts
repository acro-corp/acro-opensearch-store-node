import { describe, it, expect, beforeEach } from "vitest";
import { Action } from "@acro-sdk/common-store";
import dotenv from "dotenv";

import { OpenSearchEngine } from "../../src";
import { ACTION_TEMPLATE, OPENSEARCH_ACTION_TEMPLATE } from "../mock/actions";

describe("OpenSearchEngine.serialize", () => {
  let engine: OpenSearchEngine;

  beforeEach(() => {
    dotenv.config({ path: ".env.local" });

    engine = new OpenSearchEngine(
      {},
      {
        nodes: [process.env.OPENSEARCH_NODE as string],
        ssl: {
          rejectUnauthorized: false,
        },
      }
    );
  });

  it("should correctly serialize an Action", async () => {
    const action: Action = {
      timestamp: new Date().toISOString(),
      ...ACTION_TEMPLATE,
    };

    const serialized = await (engine as any).serialize(action);

    expect(serialized).toEqual({
      timestamp: action.timestamp,
      ...OPENSEARCH_ACTION_TEMPLATE,
    });
  });
});
