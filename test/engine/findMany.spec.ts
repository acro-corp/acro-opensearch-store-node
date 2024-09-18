import { describe, it, expect, beforeEach } from "vitest";
import { Action } from "@acro-sdk/common-store";
import dotenv from "dotenv";

import { OpenSearchAction, OpenSearchEngine } from "../../src";
import { ACTION_TEMPLATE, OPENSEARCH_ACTION_TEMPLATE } from "../mock/actions";

describe("OpenSearchEngine.findMany", () => {
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

  it("should perform query with only companyId", async () => {
    const results = await engine.findMany({}, { companyId: "company123" });

    expect(results[0]).toEqual({
      id: results[0]?.id,
      timestamp: results[0]?.timestamp,
      ...OPENSEARCH_ACTION_TEMPLATE,
    });
  });

  it("should perform query with date range", async () => {
    const results = await engine.findMany(
      {},
      {
        companyId: "123",
        start: "2021-07-01T00:00:00.000Z",
        end: "2021-08-31T23:59:59.999Z",
      }
    );

    expect(results).toEqual([]);
  });

  it("should perform query with clientId, app, environment, sessionId, traceIds", async () => {
    const results = await engine.findMany(
      {},
      {
        companyId: "company123",
        clientId: "client456",
        app: "testApp",
        environment: "production",
        sessionId: "session789",
        traceIds: ["trace1", "trace2"],
      }
    );

    expect(results[0]).toEqual({
      id: results[0]?.id,
      timestamp: results[0]?.timestamp,
      ...OPENSEARCH_ACTION_TEMPLATE,
    });
  });

  it("should perform query with framework", async () => {
    const results = await engine.findMany(
      {},
      {
        companyId: "company123",
        framework: {
          name: "elastic",
          version: "18.2.0",
        },
      }
    );

    expect(results[0]).toEqual({
      id: results[0]?.id,
      timestamp: results[0]?.timestamp,
      ...OPENSEARCH_ACTION_TEMPLATE,
    });
  });

  it("should perform query with action", async () => {
    const results = await engine.findMany(
      {},
      {
        companyId: "company123",
        action: { type: "USER_ACTION", verb: "CLICK", object: "BUTTON" },
      }
    );

    expect(results[0]).toEqual({
      id: results[0]?.id,
      timestamp: results[0]?.timestamp,
      ...OPENSEARCH_ACTION_TEMPLATE,
    });
  });

  it("should perform query with agents", async () => {
    const results = await engine.findMany(
      {},
      {
        companyId: "company123",
        agents: { type: "pwn", id: "agent1" },
      }
    );

    expect(results[0]).toEqual({
      id: results[0]?.id,
      timestamp: results[0]?.timestamp,
      ...OPENSEARCH_ACTION_TEMPLATE,
    });
  });

  it("should perform query with agents and meta", async () => {
    const results = await engine.findMany(
      {},
      {
        companyId: "company123",
        agents: { type: "pwn", meta: { version: "1.0" } },
      }
    );

    expect(results[0]).toEqual({
      id: results[0]?.id,
      timestamp: results[0]?.timestamp,
      ...OPENSEARCH_ACTION_TEMPLATE,
    });
  });

  it("should perform query with agents array", async () => {
    const results = await engine.findMany(
      {},
      {
        companyId: "company123",
        agents: [
          { type: "pwn", id: "agent1" },
          { type: "pwn", meta: { version: "1.0" } },
        ],
      }
    );

    expect(results[0]).toEqual({
      id: results[0]?.id,
      timestamp: results[0]?.timestamp,
      ...OPENSEARCH_ACTION_TEMPLATE,
    });
  });

  it("should perform query with targets", async () => {
    const results = await engine.findMany(
      {},
      {
        companyId: "company123",
        targets: { type: "stuff", id: "target1" },
      }
    );

    expect(results[0]).toEqual({
      id: results[0]?.id,
      timestamp: results[0]?.timestamp,
      ...OPENSEARCH_ACTION_TEMPLATE,
    });
  });

  it("should perform query with targets and meta", async () => {
    const results = await engine.findMany(
      {},
      {
        companyId: "company123",
        targets: { type: "stuff", meta: { location: "header" } },
      }
    );

    expect(results[0]).toEqual({
      id: results[0]?.id,
      timestamp: results[0]?.timestamp,
      ...OPENSEARCH_ACTION_TEMPLATE,
    });
  });
});
