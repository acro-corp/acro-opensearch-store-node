import { describe, it, expect, beforeEach } from "vitest";
import dotenv from "dotenv";

import { OpenSearchAction, OpenSearchEngine } from "../../src";
import { ACTION_TEMPLATE, OPENSEARCH_ACTION_TEMPLATE } from "../mock/actions";

describe("OpenSearchEngine.deserialize", () => {
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

  it("should correctly deserialize OpenSearchAction", async () => {
    const dbAction: OpenSearchAction = {
      timestamp: new Date().toISOString(),
      ...OPENSEARCH_ACTION_TEMPLATE,
    };

    const deserialized = await (engine as any).deserialize(dbAction);

    expect(deserialized).toEqual({
      timestamp: dbAction.timestamp,
      ...ACTION_TEMPLATE,
    });
  });
});
