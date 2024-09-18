import { describe, it, expect, beforeEach } from "vitest";
import { Action } from "@acro-sdk/common-store";
import dotenv from "dotenv";

import { OpenSearchEngine } from "../../src";
import { ACTION_TEMPLATE } from "../mock/actions";

describe("OpenSearchEngine.createAction", () => {
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

  it("should correctly serialize, create, and deserialize an action", async () => {
    const timestamp = new Date().toISOString();

    const action: Action = {
      timestamp: new Date().toISOString(),
      ...ACTION_TEMPLATE,
    };

    const actionResponse = await engine.createAction(action);

    expect(actionResponse).toEqual({
      id: actionResponse.id,
      timestamp: actionResponse.timestamp,
      ...ACTION_TEMPLATE,
    });
  });
});
