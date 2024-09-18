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
});
