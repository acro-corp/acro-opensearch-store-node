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

describe("OpenSearchEngine.buildFindManyQuery", () => {
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

  it("should successfully build a query with only companyId", async () => {
    const query = engine.buildFindManyQuery({}, { companyId: "123" });
    const timestampQuery = query.find((v) => !!v.range?.timestamp);

    expect(query).toEqual([
      {
        term: {
          companyId: "123",
        },
      },
      {
        range: {
          timestamp: {
            gte: timestampQuery.range.timestamp?.gte,
            lt: timestampQuery.range.timestamp?.lt,
          },
        },
      },
    ]);
  });

  it("should correctly create a query with date range", async () => {
    const query = engine.buildFindManyQuery(
      {},
      {
        companyId: "123",
        start: "2024-07-01T00:00:00.000Z",
        end: "2024-08-31T23:59:59.999Z",
      }
    );

    expect(query).toEqual([
      {
        term: {
          companyId: "123",
        },
      },
      {
        range: {
          timestamp: {
            gte: "2024-07-01T00:00:00.000Z",
            lt: "2024-08-31T23:59:59.999Z",
          },
        },
      },
    ]);
  });

  it("should correctly create a query with query string", async () => {
    const query = engine.buildFindManyQuery(
      {},
      {
        companyId: "123",
        start: "2024-07-01T00:00:00.000Z",
        end: "2024-08-31T23:59:59.999Z",
        query: "abc123",
      }
    );

    expect(query).toEqual([
      {
        term: {
          companyId: "123",
        },
      },
      {
        range: {
          timestamp: {
            gte: "2024-07-01T00:00:00.000Z",
            lt: "2024-08-31T23:59:59.999Z",
          },
        },
      },
      {
        bool: {
          should: [
            {
              term: {
                id: "abc123",
              },
            },
            {
              term: {
                app: "abc123",
              },
            },
            {
              term: {
                environment: "abc123",
              },
            },
            {
              term: {
                "framework.name": "abc123",
              },
            },
            {
              term: {
                sessionId: "abc123",
              },
            },
            {
              term: {
                traceIds: "abc123",
              },
            },
            {
              term: {
                "action.id": "abc123",
              },
            },
            {
              term: {
                "action.object.keyword": "abc123",
              },
            },
            {
              nested: {
                path: "agents",
                query: {
                  bool: {
                    should: [
                      {
                        term: {
                          "agents.id": "abc123",
                        },
                      },
                      {
                        nested: {
                          path: "agents.meta",
                          query: {
                            term: {
                              "agents.meta.value.keyword": "abc123",
                            },
                          },
                        },
                      },
                    ],
                  },
                },
              },
            },
            {
              nested: {
                path: "targets",
                query: {
                  bool: {
                    should: [
                      {
                        term: {
                          "targets.id": "abc123",
                        },
                      },
                      {
                        nested: {
                          path: "targets.meta",
                          query: {
                            term: {
                              "targets.meta.value.keyword": "abc123",
                            },
                          },
                        },
                      },
                    ],
                  },
                },
              },
            },
            {
              nested: {
                path: "request",
                query: {
                  term: {
                    "request.value.keyword": "abc123",
                  },
                },
              },
            },
            {
              nested: {
                path: "response.body",
                query: {
                  term: {
                    "response.body.value.keyword": "abc123",
                  },
                },
              },
            },
            {
              nested: {
                path: "response.headers",
                query: {
                  term: {
                    "response.headers.value.keyword": "abc123",
                  },
                },
              },
            },
            {
              nested: {
                path: "changes",
                query: {
                  term: {
                    "changes.id": "abc123",
                  },
                },
              },
            },
            {
              nested: {
                path: "changes",
                query: {
                  term: {
                    "changes.path.keyword": "abc123",
                  },
                },
              },
            },
            {
              nested: {
                path: "meta",
                query: {
                  term: {
                    "meta.value.keyword": "abc123",
                  },
                },
              },
            },
          ],
        },
      },
    ]);
  });

  it("should correctly create a query with id, clientId, app, environment, sessionId, traceIds", async () => {
    const query = engine.buildFindManyQuery(
      {},
      {
        companyId: "123",
        start: "2024-07-01T00:00:00.000Z",
        end: "2024-08-31T23:59:59.999Z",
        id: "action_123",
        clientId: "client_123",
        app: "app_123",
        environment: "production",
        sessionId: "sess_123",
        traceIds: "trace_123",
      }
    );

    expect(query).toEqual([
      {
        term: {
          companyId: "123",
        },
      },
      {
        range: {
          timestamp: {
            gte: "2024-07-01T00:00:00.000Z",
            lt: "2024-08-31T23:59:59.999Z",
          },
        },
      },
      {
        terms: {
          id: ["action_123"],
        },
      },
      {
        terms: {
          clientId: ["client_123"],
        },
      },
      {
        terms: {
          app: ["app_123"],
        },
      },
      {
        terms: {
          environment: ["production"],
        },
      },
      {
        terms: {
          sessionId: ["sess_123"],
        },
      },
      {
        terms: {
          traceIds: ["trace_123"],
        },
      },
    ]);
  });

  it("should correctly create a query with id, clientId, app, environment, sessionId, traceIds arrays", async () => {
    const query = engine.buildFindManyQuery(
      {},
      {
        companyId: "123",
        start: "2024-07-01T00:00:00.000Z",
        end: "2024-08-31T23:59:59.999Z",
        id: ["action_123", "action_456"],
        clientId: ["client_123", "client_456"],
        app: ["app_123", "app_456"],
        environment: ["production", "test"],
        sessionId: ["sess_123", "sess_456"],
        traceIds: ["trace_123", "trace_456"],
      }
    );

    expect(query).toEqual([
      {
        term: {
          companyId: "123",
        },
      },
      {
        range: {
          timestamp: {
            gte: "2024-07-01T00:00:00.000Z",
            lt: "2024-08-31T23:59:59.999Z",
          },
        },
      },
      {
        terms: {
          id: ["action_123", "action_456"],
        },
      },
      {
        terms: {
          clientId: ["client_123", "client_456"],
        },
      },
      {
        terms: {
          app: ["app_123", "app_456"],
        },
      },
      {
        terms: {
          environment: ["production", "test"],
        },
      },
      {
        terms: {
          sessionId: ["sess_123", "sess_456"],
        },
      },
      {
        terms: {
          traceIds: ["trace_123", "trace_456"],
        },
      },
    ]);
  });

  it("should correctly create a query with framework", async () => {
    const query = engine.buildFindManyQuery(
      {},
      {
        companyId: "123",
        start: "2024-07-01T00:00:00.000Z",
        end: "2024-08-31T23:59:59.999Z",
        framework: { name: "express", version: "5.0.0" },
      }
    );

    expect(query).toEqual([
      {
        term: {
          companyId: "123",
        },
      },
      {
        range: {
          timestamp: {
            gte: "2024-07-01T00:00:00.000Z",
            lt: "2024-08-31T23:59:59.999Z",
          },
        },
      },
      {
        bool: {
          must: [
            {
              term: {
                "framework.name": "express",
              },
            },
            {
              term: {
                "framework.version": "5.0.0",
              },
            },
          ],
        },
      },
    ]);
  });

  it("should correctly create a query with framework array", async () => {
    const query = engine.buildFindManyQuery(
      {},
      {
        companyId: "123",
        start: "2024-07-01T00:00:00.000Z",
        end: "2024-08-31T23:59:59.999Z",
        framework: [{ name: "apollo" }, { name: "express", version: "5.0.0" }],
      }
    );

    expect(query).toEqual([
      {
        term: {
          companyId: "123",
        },
      },
      {
        range: {
          timestamp: {
            gte: "2024-07-01T00:00:00.000Z",
            lt: "2024-08-31T23:59:59.999Z",
          },
        },
      },
      {
        bool: {
          should: [
            {
              term: {
                "framework.name": "apollo",
              },
            },
            {
              bool: {
                must: [
                  {
                    term: {
                      "framework.name": "express",
                    },
                  },
                  {
                    term: {
                      "framework.version": "5.0.0",
                    },
                  },
                ],
              },
            },
          ],
        },
      },
    ]);
  });

  it("should correctly create a query with action", async () => {
    const query = engine.buildFindManyQuery(
      {},
      {
        companyId: "123",
        start: "2024-07-01T00:00:00.000Z",
        end: "2024-08-31T23:59:59.999Z",
        action: { type: "HTTP", verb: "POST", object: "/v1/transactions" },
      }
    );

    expect(query).toEqual([
      {
        term: {
          companyId: "123",
        },
      },
      {
        range: {
          timestamp: {
            gte: "2024-07-01T00:00:00.000Z",
            lt: "2024-08-31T23:59:59.999Z",
          },
        },
      },
      {
        bool: {
          must: [
            {
              term: {
                "action.type": "HTTP",
              },
            },
            {
              term: {
                "action.verb": "POST",
              },
            },
            {
              term: {
                "action.object.keyword": "/v1/transactions",
              },
            },
          ],
        },
      },
    ]);
  });

  it("should correctly create a query with action array", async () => {
    const query = engine.buildFindManyQuery(
      {},
      {
        companyId: "123",
        start: "2024-07-01T00:00:00.000Z",
        end: "2024-08-31T23:59:59.999Z",
        action: [
          { type: "HTTP", verb: "POST", object: "/v1/transactions" },
          { type: "GRAPHQL", verb: "mutation", object: "CreateTransaction" },
        ],
      }
    );

    expect(query).toEqual([
      {
        term: {
          companyId: "123",
        },
      },
      {
        range: {
          timestamp: {
            gte: "2024-07-01T00:00:00.000Z",
            lt: "2024-08-31T23:59:59.999Z",
          },
        },
      },
      {
        bool: {
          should: [
            {
              bool: {
                must: [
                  {
                    term: {
                      "action.type": "HTTP",
                    },
                  },
                  {
                    term: {
                      "action.verb": "POST",
                    },
                  },
                  {
                    term: {
                      "action.object.keyword": "/v1/transactions",
                    },
                  },
                ],
              },
            },
            {
              bool: {
                must: [
                  {
                    term: {
                      "action.type": "GRAPHQL",
                    },
                  },
                  {
                    term: {
                      "action.verb": "mutation",
                    },
                  },
                  {
                    term: {
                      "action.object.keyword": "CreateTransaction",
                    },
                  },
                ],
              },
            },
          ],
        },
      },
    ]);
  });

  it("should correctly create a query with agents", async () => {
    const query = engine.buildFindManyQuery(
      {},
      {
        companyId: "123",
        start: "2024-07-01T00:00:00.000Z",
        end: "2024-08-31T23:59:59.999Z",
        agents: { type: "USER", id: "user_123" },
      }
    );

    expect(query).toEqual([
      {
        term: {
          companyId: "123",
        },
      },
      {
        range: {
          timestamp: {
            gte: "2024-07-01T00:00:00.000Z",
            lt: "2024-08-31T23:59:59.999Z",
          },
        },
      },
      {
        nested: {
          path: "agents",
          query: {
            bool: {
              must: [
                {
                  term: {
                    "agents.id": "user_123",
                  },
                },
                {
                  term: {
                    "agents.type": "USER",
                  },
                },
              ],
            },
          },
        },
      },
    ]);
  });

  it("should correctly create a query with agents and meta", async () => {
    const query = engine.buildFindManyQuery(
      {},
      {
        companyId: "123",
        start: "2024-07-01T00:00:00.000Z",
        end: "2024-08-31T23:59:59.999Z",
        agents: { type: "USER", meta: { clerkUserId: "clk_user_456" } },
      }
    );

    expect(query).toEqual([
      {
        term: {
          companyId: "123",
        },
      },
      {
        range: {
          timestamp: {
            gte: "2024-07-01T00:00:00.000Z",
            lt: "2024-08-31T23:59:59.999Z",
          },
        },
      },
      {
        nested: {
          path: "agents",
          query: {
            bool: {
              must: [
                {
                  term: {
                    "agents.type": "USER",
                  },
                },
                {
                  nested: {
                    path: "agents.meta",
                    query: {
                      bool: {
                        must: [
                          {
                            term: {
                              "agents.meta.key": "clerkUserId",
                            },
                          },
                          {
                            term: {
                              "agents.meta.value.keyword": "clk_user_456",
                            },
                          },
                        ],
                      },
                    },
                  },
                },
              ],
            },
          },
        },
      },
    ]);
  });

  it("should correctly create a query with agents array", async () => {
    const query = engine.buildFindManyQuery(
      {},
      {
        companyId: "123",
        start: "2024-07-01T00:00:00.000Z",
        end: "2024-08-31T23:59:59.999Z",
        agents: [
          { type: "USER", id: "user_123" },
          { type: "USER", meta: { clerkUserId: "clk_user_456" } },
        ],
      }
    );

    expect(query).toEqual([
      {
        term: {
          companyId: "123",
        },
      },
      {
        range: {
          timestamp: {
            gte: "2024-07-01T00:00:00.000Z",
            lt: "2024-08-31T23:59:59.999Z",
          },
        },
      },
      {
        nested: {
          path: "agents",
          query: {
            bool: {
              should: [
                {
                  bool: {
                    must: [
                      {
                        term: {
                          "agents.id": "user_123",
                        },
                      },
                      {
                        term: {
                          "agents.type": "USER",
                        },
                      },
                    ],
                  },
                },
                {
                  bool: {
                    must: [
                      {
                        term: {
                          "agents.type": "USER",
                        },
                      },
                      {
                        nested: {
                          path: "agents.meta",
                          query: {
                            bool: {
                              must: [
                                {
                                  term: {
                                    "agents.meta.key": "clerkUserId",
                                  },
                                },
                                {
                                  term: {
                                    "agents.meta.value.keyword": "clk_user_456",
                                  },
                                },
                              ],
                            },
                          },
                        },
                      },
                    ],
                  },
                },
              ],
            },
          },
        },
      },
    ]);
  });

  it("should correctly create a query with targets", async () => {
    const query = engine.buildFindManyQuery(
      {},
      {
        companyId: "123",
        start: "2024-07-01T00:00:00.000Z",
        end: "2024-08-31T23:59:59.999Z",
        targets: { type: "transaction", id: "transaction_123" },
      }
    );

    expect(query).toEqual([
      {
        term: {
          companyId: "123",
        },
      },
      {
        range: {
          timestamp: {
            gte: "2024-07-01T00:00:00.000Z",
            lt: "2024-08-31T23:59:59.999Z",
          },
        },
      },
      {
        nested: {
          path: "targets",
          query: {
            bool: {
              must: [
                {
                  term: {
                    "targets.id": "transaction_123",
                  },
                },
                {
                  term: {
                    "targets.type": "transaction",
                  },
                },
              ],
            },
          },
        },
      },
    ]);
  });

  it("should correctly create a query with targets and meta", async () => {
    const query = engine.buildFindManyQuery(
      {},
      {
        companyId: "123",
        start: "2024-07-01T00:00:00.000Z",
        end: "2024-08-31T23:59:59.999Z",
        targets: { type: "user", meta: { clerkUserId: "clk_user_456" } },
      }
    );

    expect(query).toEqual([
      {
        term: {
          companyId: "123",
        },
      },
      {
        range: {
          timestamp: {
            gte: "2024-07-01T00:00:00.000Z",
            lt: "2024-08-31T23:59:59.999Z",
          },
        },
      },
      {
        nested: {
          path: "targets",
          query: {
            bool: {
              must: [
                {
                  term: {
                    "targets.type": "user",
                  },
                },
                {
                  nested: {
                    path: "targets.meta",
                    query: {
                      bool: {
                        must: [
                          {
                            term: {
                              "targets.meta.key": "clerkUserId",
                            },
                          },
                          {
                            term: {
                              "targets.meta.value.keyword": "clk_user_456",
                            },
                          },
                        ],
                      },
                    },
                  },
                },
              ],
            },
          },
        },
      },
    ]);
  });

  it("should correctly create a query with targets array", async () => {
    const query = engine.buildFindManyQuery(
      {},
      {
        companyId: "123",
        start: "2024-07-01T00:00:00.000Z",
        end: "2024-08-31T23:59:59.999Z",
        targets: [
          { type: "transaction", id: "transaction_123" },
          { type: "user", meta: { clerkUserId: "clk_user_456" } },
        ],
      }
    );

    expect(query).toEqual([
      {
        term: {
          companyId: "123",
        },
      },
      {
        range: {
          timestamp: {
            gte: "2024-07-01T00:00:00.000Z",
            lt: "2024-08-31T23:59:59.999Z",
          },
        },
      },
      {
        nested: {
          path: "targets",
          query: {
            bool: {
              should: [
                {
                  bool: {
                    must: [
                      {
                        term: {
                          "targets.id": "transaction_123",
                        },
                      },
                      {
                        term: {
                          "targets.type": "transaction",
                        },
                      },
                    ],
                  },
                },
                {
                  bool: {
                    must: [
                      {
                        term: {
                          "targets.type": "user",
                        },
                      },
                      {
                        nested: {
                          path: "targets.meta",
                          query: {
                            bool: {
                              must: [
                                {
                                  term: {
                                    "targets.meta.key": "clerkUserId",
                                  },
                                },
                                {
                                  term: {
                                    "targets.meta.value.keyword":
                                      "clk_user_456",
                                  },
                                },
                              ],
                            },
                          },
                        },
                      },
                    ],
                  },
                },
              ],
            },
          },
        },
      },
    ]);
  });

  it("should correctly create a query with specific key in request", async () => {
    const query = engine.buildFindManyQuery(
      {},
      {
        companyId: "company123",
        start: "2024-07-01T00:00:00.000Z",
        end: "2024-08-31T23:59:59.999Z",
        request: { body: { transactionId: "transaction_123" } },
      }
    );

    expect(query).toEqual([
      {
        term: {
          companyId: "company123",
        },
      },
      {
        range: {
          timestamp: {
            gte: "2024-07-01T00:00:00.000Z",
            lt: "2024-08-31T23:59:59.999Z",
          },
        },
      },
      {
        nested: {
          path: "request",
          query: {
            bool: {
              must: [
                {
                  term: {
                    "request.key": "transactionId",
                  },
                },
                {
                  term: {
                    "request.parent": "body",
                  },
                },
                {
                  term: {
                    "request.value.keyword": "transaction_123",
                  },
                },
              ],
            },
          },
        },
      },
    ]);
  });

  it("should correctly create a query with generic (any child) key in request", async () => {
    const query = engine.buildFindManyQuery(
      {},
      {
        companyId: "company123",
        start: "2024-07-01T00:00:00.000Z",
        end: "2024-08-31T23:59:59.999Z",
        request: { transactionId: "transaction_123" },
      }
    );

    expect(query).toEqual([
      {
        term: {
          companyId: "company123",
        },
      },
      {
        range: {
          timestamp: {
            gte: "2024-07-01T00:00:00.000Z",
            lt: "2024-08-31T23:59:59.999Z",
          },
        },
      },
      {
        nested: {
          path: "request",
          query: {
            bool: {
              must: [
                {
                  term: {
                    "request.key": "transactionId",
                  },
                },
                {
                  term: {
                    "request.value.keyword": "transaction_123",
                  },
                },
              ],
            },
          },
        },
      },
    ]);
  });

  it("should correctly create a query with multiple specific keys in request", async () => {
    const query = engine.buildFindManyQuery(
      {},
      {
        companyId: "company123",
        start: "2024-07-01T00:00:00.000Z",
        end: "2024-08-31T23:59:59.999Z",
        request: {
          params: { storeId: "store_123", transactionId: "transaction_123" },
        },
      }
    );

    expect(query).toEqual([
      {
        term: {
          companyId: "company123",
        },
      },
      {
        range: {
          timestamp: {
            gte: "2024-07-01T00:00:00.000Z",
            lt: "2024-08-31T23:59:59.999Z",
          },
        },
      },
      {
        bool: {
          must: [
            {
              nested: {
                path: "request",
                query: {
                  bool: {
                    must: [
                      {
                        term: {
                          "request.key": "storeId",
                        },
                      },
                      {
                        term: {
                          "request.parent": "params",
                        },
                      },
                      {
                        term: {
                          "request.value.keyword": "store_123",
                        },
                      },
                    ],
                  },
                },
              },
            },
            {
              nested: {
                path: "request",
                query: {
                  bool: {
                    must: [
                      {
                        term: {
                          "request.key": "transactionId",
                        },
                      },
                      {
                        term: {
                          "request.parent": "params",
                        },
                      },
                      {
                        term: {
                          "request.value.keyword": "transaction_123",
                        },
                      },
                    ],
                  },
                },
              },
            },
          ],
        },
      },
    ]);
  });

  it("should correctly create a query with multiple generic keys in request", async () => {
    const query = engine.buildFindManyQuery(
      {},
      {
        companyId: "company123",
        start: "2024-07-01T00:00:00.000Z",
        end: "2024-08-31T23:59:59.999Z",
        request: {
          storeId: "store_123",
          transactionId: "transaction_123",
        },
      }
    );

    expect(query).toEqual([
      {
        term: {
          companyId: "company123",
        },
      },
      {
        range: {
          timestamp: {
            gte: "2024-07-01T00:00:00.000Z",
            lt: "2024-08-31T23:59:59.999Z",
          },
        },
      },
      {
        bool: {
          must: [
            {
              nested: {
                path: "request",
                query: {
                  bool: {
                    must: [
                      {
                        term: {
                          "request.key": "storeId",
                        },
                      },
                      {
                        term: {
                          "request.value.keyword": "store_123",
                        },
                      },
                    ],
                  },
                },
              },
            },
            {
              nested: {
                path: "request",
                query: {
                  bool: {
                    must: [
                      {
                        term: {
                          "request.key": "transactionId",
                        },
                      },
                      {
                        term: {
                          "request.value.keyword": "transaction_123",
                        },
                      },
                    ],
                  },
                },
              },
            },
          ],
        },
      },
    ]);
  });

  it("should correctly create a query with specific keys in request", async () => {
    const query = engine.buildFindManyQuery(
      {},
      {
        companyId: "company123",
        start: "2024-07-01T00:00:00.000Z",
        end: "2024-08-31T23:59:59.999Z",
        request: [
          { body: { transactionId: "transaction_123" } },
          { body: { storeId: "store_123" } },
        ],
      }
    );

    expect(query).toEqual([
      {
        term: {
          companyId: "company123",
        },
      },
      {
        range: {
          timestamp: {
            gte: "2024-07-01T00:00:00.000Z",
            lt: "2024-08-31T23:59:59.999Z",
          },
        },
      },
      {
        bool: {
          should: [
            {
              nested: {
                path: "request",
                query: {
                  bool: {
                    must: [
                      {
                        term: {
                          "request.key": "transactionId",
                        },
                      },
                      {
                        term: {
                          "request.parent": "body",
                        },
                      },
                      {
                        term: {
                          "request.value.keyword": "transaction_123",
                        },
                      },
                    ],
                  },
                },
              },
            },
            {
              nested: {
                path: "request",
                query: {
                  bool: {
                    must: [
                      {
                        term: {
                          "request.key": "storeId",
                        },
                      },
                      {
                        term: {
                          "request.parent": "body",
                        },
                      },
                      {
                        term: {
                          "request.value.keyword": "store_123",
                        },
                      },
                    ],
                  },
                },
              },
            },
          ],
        },
      },
    ]);
  });

  it("should correctly create a query with generic keys in request", async () => {
    const query = engine.buildFindManyQuery(
      {},
      {
        companyId: "company123",
        start: "2024-07-01T00:00:00.000Z",
        end: "2024-08-31T23:59:59.999Z",
        request: [
          { transactionId: "transaction_123" },
          { storeId: "store_123" },
        ],
      }
    );

    expect(query).toEqual([
      {
        term: {
          companyId: "company123",
        },
      },
      {
        range: {
          timestamp: {
            gte: "2024-07-01T00:00:00.000Z",
            lt: "2024-08-31T23:59:59.999Z",
          },
        },
      },
      {
        bool: {
          should: [
            {
              nested: {
                path: "request",
                query: {
                  bool: {
                    must: [
                      {
                        term: {
                          "request.key": "transactionId",
                        },
                      },
                      {
                        term: {
                          "request.value.keyword": "transaction_123",
                        },
                      },
                    ],
                  },
                },
              },
            },
            {
              nested: {
                path: "request",
                query: {
                  bool: {
                    must: [
                      {
                        term: {
                          "request.key": "storeId",
                        },
                      },
                      {
                        term: {
                          "request.value.keyword": "store_123",
                        },
                      },
                    ],
                  },
                },
              },
            },
          ],
        },
      },
    ]);
  });

  it("should correctly create a query with response filter", async () => {
    const query = engine.buildFindManyQuery(
      {},
      {
        companyId: "company123",
        start: "2024-07-01T00:00:00.000Z",
        end: "2024-08-31T23:59:59.999Z",
        response: { status: "200" },
      }
    );

    expect(query).toEqual([
      {
        term: {
          companyId: "company123",
        },
      },
      {
        range: {
          timestamp: {
            gte: "2024-07-01T00:00:00.000Z",
            lt: "2024-08-31T23:59:59.999Z",
          },
        },
      },
      {
        term: {
          "response.status": "200",
        },
      },
    ]);
  });

  it("should correctly create a query with response body filter", async () => {
    const query = engine.buildFindManyQuery(
      {},
      {
        companyId: "company123",
        start: "2024-07-01T00:00:00.000Z",
        end: "2024-08-31T23:59:59.999Z",
        response: { status: "200", body: { result: "success" } },
      }
    );

    expect(query).toEqual([
      {
        term: {
          companyId: "company123",
        },
      },
      {
        range: {
          timestamp: {
            gte: "2024-07-01T00:00:00.000Z",
            lt: "2024-08-31T23:59:59.999Z",
          },
        },
      },
      {
        bool: {
          must: [
            {
              term: {
                "response.status": "200",
              },
            },
            {
              nested: {
                path: "response.body",
                query: {
                  bool: {
                    must: [
                      {
                        term: {
                          "response.body.key": "result",
                        },
                      },
                      {
                        term: {
                          "response.body.value.keyword": "success",
                        },
                      },
                    ],
                  },
                },
              },
            },
          ],
        },
      },
    ]);
  });

  it("should correctly create a query with response headers filter", async () => {
    const query = engine.buildFindManyQuery(
      {},
      {
        companyId: "company123",
        start: "2024-07-01T00:00:00.000Z",
        end: "2024-08-31T23:59:59.999Z",
        response: {
          status: "200",
          headers: { "Content-Type": "application/json" },
        },
      }
    );

    expect(query).toEqual([
      {
        term: {
          companyId: "company123",
        },
      },
      {
        range: {
          timestamp: {
            gte: "2024-07-01T00:00:00.000Z",
            lt: "2024-08-31T23:59:59.999Z",
          },
        },
      },
      {
        bool: {
          must: [
            {
              term: {
                "response.status": "200",
              },
            },
            {
              nested: {
                path: "response.headers",
                query: {
                  bool: {
                    must: [
                      {
                        term: {
                          "response.headers.key": "Content-Type",
                        },
                      },
                      {
                        term: {
                          "response.headers.value.keyword": "application/json",
                        },
                      },
                    ],
                  },
                },
              },
            },
          ],
        },
      },
    ]);
  });

  it("should correctly create a query with response body filters", async () => {
    const query = engine.buildFindManyQuery(
      {},
      {
        companyId: "company123",
        start: "2024-07-01T00:00:00.000Z",
        end: "2024-08-31T23:59:59.999Z",
        response: {
          status: "200",
          body: [{ result: "success" }, { result: "error" }],
        },
      }
    );

    expect(query).toEqual([
      {
        term: {
          companyId: "company123",
        },
      },
      {
        range: {
          timestamp: {
            gte: "2024-07-01T00:00:00.000Z",
            lt: "2024-08-31T23:59:59.999Z",
          },
        },
      },
      {
        bool: {
          must: [
            {
              term: {
                "response.status": "200",
              },
            },
            {
              bool: {
                should: [
                  {
                    nested: {
                      path: "response.body",
                      query: {
                        bool: {
                          must: [
                            {
                              term: {
                                "response.body.key": "result",
                              },
                            },
                            {
                              term: {
                                "response.body.value.keyword": "success",
                              },
                            },
                          ],
                        },
                      },
                    },
                  },
                  {
                    nested: {
                      path: "response.body",
                      query: {
                        bool: {
                          must: [
                            {
                              term: {
                                "response.body.key": "result",
                              },
                            },
                            {
                              term: {
                                "response.body.value.keyword": "error",
                              },
                            },
                          ],
                        },
                      },
                    },
                  },
                ],
              },
            },
          ],
        },
      },
    ]);
  });

  it("should correctly create a query with changes", async () => {
    const query = engine.buildFindManyQuery(
      {},
      {
        companyId: "123",
        start: "2024-07-01T00:00:00.000Z",
        end: "2024-08-31T23:59:59.999Z",
        changes: { model: "model", operation: "update" },
      }
    );

    expect(query).toEqual([
      {
        term: {
          companyId: "123",
        },
      },
      {
        range: {
          timestamp: {
            gte: "2024-07-01T00:00:00.000Z",
            lt: "2024-08-31T23:59:59.999Z",
          },
        },
      },
      {
        nested: {
          path: "changes",
          query: {
            bool: {
              must: [
                {
                  term: {
                    "changes.model": "model",
                  },
                },
                {
                  term: {
                    "changes.operation": "update",
                  },
                },
              ],
            },
          },
        },
      },
    ]);
  });

  it("should correctly create a query with changes and meta", async () => {
    const query = engine.buildFindManyQuery(
      {},
      {
        companyId: "123",
        start: "2024-07-01T00:00:00.000Z",
        end: "2024-08-31T23:59:59.999Z",
        changes: { model: "model", operation: "update", meta: { eye: "ball" } },
      }
    );

    expect(query).toEqual([
      {
        term: {
          companyId: "123",
        },
      },
      {
        range: {
          timestamp: {
            gte: "2024-07-01T00:00:00.000Z",
            lt: "2024-08-31T23:59:59.999Z",
          },
        },
      },
      {
        nested: {
          path: "changes",
          query: {
            bool: {
              must: [
                {
                  term: {
                    "changes.model": "model",
                  },
                },
                {
                  term: {
                    "changes.operation": "update",
                  },
                },
                {
                  nested: {
                    path: "changes.meta",
                    query: {
                      bool: {
                        must: [
                          {
                            term: {
                              "changes.meta.key": "eye",
                            },
                          },
                          {
                            term: {
                              "changes.meta.value.keyword": "ball",
                            },
                          },
                        ],
                      },
                    },
                  },
                },
              ],
            },
          },
        },
      },
    ]);
  });

  it("should correctly create a query with changes array", async () => {
    const query = engine.buildFindManyQuery(
      {},
      {
        companyId: "123",
        start: "2024-07-01T00:00:00.000Z",
        end: "2024-08-31T23:59:59.999Z",
        changes: [
          { model: "model", operation: "create" },
          { model: "model", operation: "update", meta: { eye: "ball" } },
        ],
      }
    );

    expect(query).toEqual([
      {
        term: {
          companyId: "123",
        },
      },
      {
        range: {
          timestamp: {
            gte: "2024-07-01T00:00:00.000Z",
            lt: "2024-08-31T23:59:59.999Z",
          },
        },
      },
      {
        nested: {
          path: "changes",
          query: {
            bool: {
              should: [
                {
                  bool: {
                    must: [
                      {
                        term: {
                          "changes.model": "model",
                        },
                      },
                      {
                        term: {
                          "changes.operation": "create",
                        },
                      },
                    ],
                  },
                },
                {
                  bool: {
                    must: [
                      {
                        term: {
                          "changes.model": "model",
                        },
                      },
                      {
                        term: {
                          "changes.operation": "update",
                        },
                      },
                      {
                        nested: {
                          path: "changes.meta",
                          query: {
                            bool: {
                              must: [
                                {
                                  term: {
                                    "changes.meta.key": "eye",
                                  },
                                },
                                {
                                  term: {
                                    "changes.meta.value.keyword": "ball",
                                  },
                                },
                              ],
                            },
                          },
                        },
                      },
                    ],
                  },
                },
              ],
            },
          },
        },
      },
    ]);
  });

  it("should correctly create a query with meta filter", async () => {
    const query = engine.buildFindManyQuery(
      {},
      {
        companyId: "company123",
        start: "2024-07-01T00:00:00.000Z",
        end: "2024-08-31T23:59:59.999Z",
        meta: { importance: "high" },
      }
    );

    expect(query).toEqual([
      {
        term: {
          companyId: "company123",
        },
      },
      {
        range: {
          timestamp: {
            gte: "2024-07-01T00:00:00.000Z",
            lt: "2024-08-31T23:59:59.999Z",
          },
        },
      },
      {
        nested: {
          path: "meta",
          query: {
            bool: {
              must: [
                {
                  term: {
                    "meta.key": "importance",
                  },
                },
                {
                  term: {
                    "meta.value.keyword": "high",
                  },
                },
              ],
            },
          },
        },
      },
    ]);
  });

  it("should correctly create a query with multiple meta filters", async () => {
    const query = engine.buildFindManyQuery(
      {},
      {
        companyId: "company123",
        start: "2024-07-01T00:00:00.000Z",
        end: "2024-08-31T23:59:59.999Z",
        meta: { importance: "high", category: "user-interaction" },
      }
    );

    expect(query).toEqual([
      {
        term: {
          companyId: "company123",
        },
      },
      {
        range: {
          timestamp: {
            gte: "2024-07-01T00:00:00.000Z",
            lt: "2024-08-31T23:59:59.999Z",
          },
        },
      },
      {
        bool: {
          must: [
            {
              nested: {
                path: "meta",
                query: {
                  bool: {
                    must: [
                      {
                        term: {
                          "meta.key": "importance",
                        },
                      },
                      {
                        term: {
                          "meta.value.keyword": "high",
                        },
                      },
                    ],
                  },
                },
              },
            },
            {
              nested: {
                path: "meta",
                query: {
                  bool: {
                    must: [
                      {
                        term: {
                          "meta.key": "category",
                        },
                      },
                      {
                        term: {
                          "meta.value.keyword": "user-interaction",
                        },
                      },
                    ],
                  },
                },
              },
            },
          ],
        },
      },
    ]);
  });

  it("should correctly create a query with meta filters", async () => {
    const query = engine.buildFindManyQuery(
      {},
      {
        companyId: "company123",
        start: "2024-07-01T00:00:00.000Z",
        end: "2024-08-31T23:59:59.999Z",
        meta: [{ importance: "high" }, { importance: "low" }],
      }
    );

    expect(query).toEqual([
      {
        term: {
          companyId: "company123",
        },
      },
      {
        range: {
          timestamp: {
            gte: "2024-07-01T00:00:00.000Z",
            lt: "2024-08-31T23:59:59.999Z",
          },
        },
      },
      {
        bool: {
          should: [
            {
              nested: {
                path: "meta",
                query: {
                  bool: {
                    must: [
                      {
                        term: {
                          "meta.key": "importance",
                        },
                      },
                      {
                        term: {
                          "meta.value.keyword": "high",
                        },
                      },
                    ],
                  },
                },
              },
            },
            {
              nested: {
                path: "meta",
                query: {
                  bool: {
                    must: [
                      {
                        term: {
                          "meta.key": "importance",
                        },
                      },
                      {
                        term: {
                          "meta.value.keyword": "low",
                        },
                      },
                    ],
                  },
                },
              },
            },
          ],
        },
      },
    ]);
  });

  it("should correctly create a query with multiple meta filters", async () => {
    const query = engine.buildFindManyQuery(
      {},
      {
        companyId: "company123",
        start: "2024-07-01T00:00:00.000Z",
        end: "2024-08-31T23:59:59.999Z",
        meta: [
          { importance: "high", category: "user-interaction" },
          { importance: "low" },
        ],
      }
    );

    expect(query).toEqual([
      {
        term: {
          companyId: "company123",
        },
      },
      {
        range: {
          timestamp: {
            gte: "2024-07-01T00:00:00.000Z",
            lt: "2024-08-31T23:59:59.999Z",
          },
        },
      },
      {
        bool: {
          should: [
            {
              bool: {
                must: [
                  {
                    nested: {
                      path: "meta",
                      query: {
                        bool: {
                          must: [
                            {
                              term: {
                                "meta.key": "importance",
                              },
                            },
                            {
                              term: {
                                "meta.value.keyword": "high",
                              },
                            },
                          ],
                        },
                      },
                    },
                  },
                  {
                    nested: {
                      path: "meta",
                      query: {
                        bool: {
                          must: [
                            {
                              term: {
                                "meta.key": "category",
                              },
                            },
                            {
                              term: {
                                "meta.value.keyword": "user-interaction",
                              },
                            },
                          ],
                        },
                      },
                    },
                  },
                ],
              },
            },
            {
              nested: {
                path: "meta",
                query: {
                  bool: {
                    must: [
                      {
                        term: {
                          "meta.key": "importance",
                        },
                      },
                      {
                        term: {
                          "meta.value.keyword": "low",
                        },
                      },
                    ],
                  },
                },
              },
            },
          ],
        },
      },
    ]);
  });
});
