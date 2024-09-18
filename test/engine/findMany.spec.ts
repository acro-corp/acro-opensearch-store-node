/**
 * Copyright (C) 2024 Acro Data Solutions, Inc.

 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Lesser General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 * 
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Lesser General Public License for more details.
 * 
 * You should have received a copy of the GNU Lesser General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

import { describe, it, expect, beforeEach } from "vitest";
import dotenv from "dotenv";

import { OpenSearchEngine } from "../../src";
import { OPENSEARCH_ACTION_TEMPLATE } from "../mock/actions";

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

  it("should perform query with with specific key in request", async () => {
    const results = await engine.findMany(
      {},
      {
        companyId: "company123",
        request: { body: { transactionId: "transaction_123" } },
      }
    );

    expect(results[0]).toEqual({
      id: results[0]?.id,
      timestamp: results[0]?.timestamp,
      ...OPENSEARCH_ACTION_TEMPLATE,
    });
  });

  it("should perform query with with generic (any child) key in request", async () => {
    const results = await engine.findMany(
      {},
      {
        companyId: "company123",
        request: { transactionId: "transaction_123" },
      }
    );

    expect(results[0]).toEqual({
      id: results[0]?.id,
      timestamp: results[0]?.timestamp,
      ...OPENSEARCH_ACTION_TEMPLATE,
    });
  });

  it("should perform query with multiple specific keys in request", async () => {
    const results = await engine.findMany(
      {},
      {
        companyId: "company123",
        request: {
          params: { storeId: "store_123", transactionId: "transaction_123" },
        },
      }
    );

    expect(results[0]).toEqual({
      id: results[0]?.id,
      timestamp: results[0]?.timestamp,
      ...OPENSEARCH_ACTION_TEMPLATE,
    });
  });

  it("should perform query with multiple specific keys in request (no match)", async () => {
    const results = await engine.findMany(
      {},
      {
        companyId: "company123",
        request: {
          body: { storeId: "store_123", transactionId: "transaction_123" },
        },
      }
    );

    expect(results).toEqual([]);
  });

  it("should perform query with multiple generic keys in request", async () => {
    const results = await engine.findMany(
      {},
      {
        companyId: "company123",
        request: {
          storeId: "store_123",
          transactionId: "transaction_123",
        },
      }
    );

    expect(results[0]).toEqual({
      id: results[0]?.id,
      timestamp: results[0]?.timestamp,
      ...OPENSEARCH_ACTION_TEMPLATE,
    });
  });

  it("should perform query with multiple generic keys in request (match across multiple children)", async () => {
    const results = await engine.findMany(
      {},
      {
        companyId: "company123",
        request: {
          storeId: "store_123",
          transactionId: "transaction_123",
        },
      }
    );

    expect(results[0]).toEqual({
      id: results[0]?.id,
      timestamp: results[0]?.timestamp,
      ...OPENSEARCH_ACTION_TEMPLATE,
    });
  });

  it("should perform query with multiple generic keys in request (no match)", async () => {
    const results = await engine.findMany(
      {},
      {
        companyId: "company123",
        request: {
          body: { storeId: "store_456", transactionId: "transaction_123" },
        },
      }
    );

    expect(results).toEqual([]);
  });

  it("should perform query with array of specific keys in request", async () => {
    const results = await engine.findMany(
      {},
      {
        companyId: "company123",
        request: [
          { body: { transactionId: "transaction_123" } },
          { body: { storeId: "store_123" } },
        ],
      }
    );

    expect(results[0]).toEqual({
      id: results[0]?.id,
      timestamp: results[0]?.timestamp,
      ...OPENSEARCH_ACTION_TEMPLATE,
    });
  });

  it("should perform query with array of specific keys in request", async () => {
    const results = await engine.findMany(
      {},
      {
        companyId: "company123",
        request: [
          { transactionId: "transaction_123" },
          { storeId: "store_123" },
        ],
      }
    );

    expect(results[0]).toEqual({
      id: results[0]?.id,
      timestamp: results[0]?.timestamp,
      ...OPENSEARCH_ACTION_TEMPLATE,
    });
  });

  it("should perform query with response filter", async () => {
    const results = await engine.findMany(
      {},
      {
        companyId: "company123",
        response: { status: "200" },
      }
    );

    expect(results[0]).toEqual({
      id: results[0]?.id,
      timestamp: results[0]?.timestamp,
      ...OPENSEARCH_ACTION_TEMPLATE,
    });
  });

  it("should perform query with response body filter", async () => {
    const results = await engine.findMany(
      {},
      {
        companyId: "company123",
        response: { status: "200", body: { result: "success" } },
      }
    );

    expect(results[0]).toEqual({
      id: results[0]?.id,
      timestamp: results[0]?.timestamp,
      ...OPENSEARCH_ACTION_TEMPLATE,
    });
  });

  it("should perform query with response headers filter", async () => {
    const results = await engine.findMany(
      {},
      {
        companyId: "company123",
        response: {
          status: "200",
          headers: { "Content-Type": "application/json" },
        },
      }
    );

    expect(results[0]).toEqual({
      id: results[0]?.id,
      timestamp: results[0]?.timestamp,
      ...OPENSEARCH_ACTION_TEMPLATE,
    });
  });

  it("should perform query with array of response body filters", async () => {
    const results = await engine.findMany(
      {},
      {
        companyId: "company123",
        response: {
          status: "200",
          body: [{ result: "success" }, { result: "error" }],
        },
      }
    );

    expect(results[0]).toEqual({
      id: results[0]?.id,
      timestamp: results[0]?.timestamp,
      ...OPENSEARCH_ACTION_TEMPLATE,
    });
  });

  it("should perform query with changes", async () => {
    const results = await engine.findMany(
      {},
      {
        companyId: "company123",
        changes: { model: "model", operation: "update" },
      }
    );

    expect(results[0]).toEqual({
      id: results[0]?.id,
      timestamp: results[0]?.timestamp,
      ...OPENSEARCH_ACTION_TEMPLATE,
    });
  });

  it("should perform query with changes and meta", async () => {
    const results = await engine.findMany(
      {},
      {
        companyId: "company123",
        changes: { model: "model", operation: "update", meta: { eye: "ball" } },
      }
    );

    expect(results[0]).toEqual({
      id: results[0]?.id,
      timestamp: results[0]?.timestamp,
      ...OPENSEARCH_ACTION_TEMPLATE,
    });
  });

  it("should perform query with changes array", async () => {
    const results = await engine.findMany(
      {},
      {
        companyId: "company123",
        changes: [
          { model: "model", operation: "create" },
          { model: "model", operation: "update", meta: { eye: "ball" } },
        ],
      }
    );

    expect(results[0]).toEqual({
      id: results[0]?.id,
      timestamp: results[0]?.timestamp,
      ...OPENSEARCH_ACTION_TEMPLATE,
    });
  });

  it("should perform query with meta filter", async () => {
    const results = await engine.findMany(
      {},
      {
        companyId: "company123",
        meta: { importance: "high" },
      }
    );

    expect(results[0]).toEqual({
      id: results[0]?.id,
      timestamp: results[0]?.timestamp,
      ...OPENSEARCH_ACTION_TEMPLATE,
    });
  });

  it("should perform query with multiple meta filters", async () => {
    const results = await engine.findMany(
      {},
      {
        companyId: "company123",
        meta: { importance: "high", category: "user-interaction" },
      }
    );

    expect(results[0]).toEqual({
      id: results[0]?.id,
      timestamp: results[0]?.timestamp,
      ...OPENSEARCH_ACTION_TEMPLATE,
    });
  });

  it("should perform query with array of meta filters", async () => {
    const results = await engine.findMany(
      {},
      {
        companyId: "company123",
        meta: [{ importance: "high" }, { importance: "low" }],
      }
    );

    expect(results[0]).toEqual({
      id: results[0]?.id,
      timestamp: results[0]?.timestamp,
      ...OPENSEARCH_ACTION_TEMPLATE,
    });
  });

  it("should perform query with array of multiple meta filters", async () => {
    const results = await engine.findMany(
      {},
      {
        companyId: "company123",
        meta: [
          { importance: "high", category: "user-interaction" },
          { importance: "low" },
        ],
      }
    );

    expect(results[0]).toEqual({
      id: results[0]?.id,
      timestamp: results[0]?.timestamp,
      ...OPENSEARCH_ACTION_TEMPLATE,
    });
  });
});
