import { describe, it, expect, beforeEach } from "vitest";
import { Action } from "@acro-sdk/common-store";
import { OpenSearchAction, OpenSearchEngine } from "../src";
import dotenv from "dotenv";

const ACTION_TEMPLATE = {
  timestamp: new Date().toISOString(),
  companyId: "company123",
  clientId: "client456",
  app: "testApp",
  environment: "production",
  framework: {
    name: "elastic",
    version: "18.2.0",
  },
  sessionId: "session789",
  traceIds: ["trace1", "trace2"],
  action: {
    id: "action123",
    type: "USER_ACTION",
    verb: "CLICK",
    object: "BUTTON",
  },
  agents: [
    {
      id: "agent1",
      type: "pwn",
      name: "anyi",
      meta: { role: "user", age: "30" },
    },
    {
      id: "agent2",
      type: "pwn",
      name: "snickers",
      meta: { version: "1.0" },
    },
  ],
  targets: [
    {
      id: "target1",
      type: "stuff",
      name: "target",
      meta: { location: "header" },
    },
  ],
  request: {
    url: "/api/submit",
    method: "POST",
    body: { data: "test" },
  },
  response: {
    status: "200",
    time: 150,
    body: { result: "success" },
    headers: { "Content-Type": "application/json" },
  },
  changes: [
    {
      model: "model",
      operation: "update",
      id: "model_123",
      path: "/status",
      before: "pending",
      after: "completed",
      meta: { eye: "ball" },
    },
  ],
  cost: {
    amount: 0.00045,
    currency: "USD",
    components: [
      {
        type: "gpt-4o-mini",
        key: "promptTokens",
        amount: 0.00026,
      },
      {
        type: "gpt-4o-mini",
        key: "responseTokens",
        amount: 0.00019,
      },
    ],
    meta: {
      promptTokens: "1733",
      responseTokens: "317",
    },
  },
  meta: { importance: "high", category: "user-interaction" },
};

const OPENSEARCH_ACTION_TEMPLATE = {
  ...ACTION_TEMPLATE,
  agents: [
    {
      ...ACTION_TEMPLATE.agents[0],
      meta: [
        { key: "role", value: "user" },
        { key: "age", value: "30" },
      ],
    },
    { ...ACTION_TEMPLATE.agents[1], meta: [{ key: "version", value: "1.0" }] },
  ],
  targets: [
    {
      ...ACTION_TEMPLATE.targets[0],
      meta: [{ key: "location", value: "header" }],
    },
  ],
  request: [
    { key: "url", value: "/api/submit" },
    { key: "method", value: "POST" },
    { key: "data", parent: "body", value: "test" },
  ],
  response: {
    ...ACTION_TEMPLATE.response,
    body: [{ key: "result", value: "success" }],
    headers: [{ key: "Content-Type", value: "application/json" }],
  },
  changes: [
    {
      ...ACTION_TEMPLATE.changes[0],
      meta: [
        {
          key: "eye",
          value: "ball",
        },
      ],
    },
  ],
  cost: {
    ...ACTION_TEMPLATE.cost,
    meta: [
      {
        key: "promptTokens",
        value: "1733",
      },
      {
        key: "responseTokens",
        value: "317",
      },
    ],
  },
  meta: [
    { key: "importance", value: "high" },
    { key: "category", value: "user-interaction" },
  ],
};

describe("OpenSearchEngine", () => {
  let engine: OpenSearchEngine;

  beforeEach(() => {
    dotenv.config({ path: ".env.local" });

    engine = new OpenSearchEngine(
      {},
      {
        nodes: [process.env.OPENSEARCH_NODE as string],
        auth: {
          username: "your-username",
          password: "your-password",
        },
        ssl: {
          rejectUnauthorized: false,
        },
      }
    );
  });

  describe("createAction", () => {
    it("should correctly serialize, create, and deserialize an action", async () => {
      const timestamp = new Date().toISOString();

      const action: Action = {
        ...ACTION_TEMPLATE,
      };

      const actionResponse = await engine.createAction(action);

      expect(actionResponse).toEqual({
        id: actionResponse.id,
        ...ACTION_TEMPLATE,
      });
    });
  });

  describe("direct serialize", () => {
    it("should correctly serialize an Action", async () => {
      const action: Action = { ...ACTION_TEMPLATE };

      const serialized = await (engine as any).serialize(action);

      expect(serialized).toEqual({ ...OPENSEARCH_ACTION_TEMPLATE });
    });
  });

  describe("direct deserialize", () => {
    it("should correctly deserialize OpenSearchAction", async () => {
      const dbAction: OpenSearchAction = {
        timestamp: "2023-09-08T12:00:00Z",
        companyId: "company123",
        clientId: "client456",
        app: "testApp",
        environment: "production",
        framework: {
          name: "elastic",
          version: "18.2.0",
        },
        sessionId: "session789",
        traceIds: ["trace1", "trace2"],
        action: {
          id: "action123",
          type: "USER_ACTION",
          verb: "CLICK",
          object: "BUTTON",
        },
        agents: [
          {
            id: "agent1",
            type: "pwn",
            name: "anyi",
            meta: [
              { key: "role", value: "user" },
              { key: "age", value: "30" },
            ],
          },
          {
            id: "agent2",
            type: "pwn",
            name: "snickers",
            meta: [{ key: "version", value: "1.0" }],
          },
        ],
        targets: [
          {
            id: "target1",
            type: "stuff",
            name: "target",
            meta: [{ key: "location", value: "header" }],
          },
        ],
        request: [
          { key: "url", value: "/api/submit" },
          { key: "method", value: "POST" },
          { key: "data", parent: "body", value: "test" },
        ],
        response: {
          status: "200",
          time: 150,
          body: [{ key: "result", value: "success" }],
          headers: [{ key: "Content-Type", value: "application/json" }],
        },
        meta: [
          { key: "importance", value: "high" },
          { key: "category", value: "user-interaction" },
        ],
      };

      const deserialized = await (engine as any).deserialize(dbAction);

      expect(deserialized).toEqual({
        timestamp: "2023-09-08T12:00:00Z",
        companyId: "company123",
        clientId: "client456",
        app: "testApp",
        environment: "production",
        framework: {
          name: "elastic",
          version: "18.2.0",
        },
        sessionId: "session789",
        traceIds: ["trace1", "trace2"],
        action: {
          id: "action123",
          type: "USER_ACTION",
          verb: "CLICK",
          object: "BUTTON",
        },
        agents: [
          {
            id: "agent1",
            type: "pwn",
            name: "anyi",
            meta: { role: "user", age: "30" },
          },
          {
            id: "agent2",
            type: "pwn",
            name: "snickers",
            meta: { version: "1.0" },
          },
        ],
        targets: [
          {
            id: "target1",
            type: "stuff",
            name: "target",
            meta: { location: "header" },
          },
        ],
        request: {
          url: "/api/submit",
          method: "POST",
          body: { data: "test" },
        },
        response: {
          status: "200",
          time: 150,
          body: { result: "success" },
          headers: { "Content-Type": "application/json" },
        },
        meta: { importance: "high", category: "user-interaction" },
      });
    });
  });

  describe("buildFindManyQuery", () => {
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
          framework: [
            { name: "apollo" },
            { name: "express", version: "5.0.0" },
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
                  "action.object": "/v1/transactions",
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
                        "action.object": "/v1/transactions",
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
                        "action.object": "CreateTransaction",
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
          bool: {
            must: [
              {
                term: {
                  "agents.type": "USER",
                },
              },
              {
                term: {
                  "agents.meta.clerkUserId": "clk_user_456",
                },
              },
            ],
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
                      term: {
                        "agents.meta.clerkUserId": "clk_user_456",
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
          bool: {
            must: [
              {
                term: {
                  "targets.type": "user",
                },
              },
              {
                term: {
                  "targets.meta.clerkUserId": "clk_user_456",
                },
              },
            ],
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
                      term: {
                        "targets.meta.clerkUserId": "clk_user_456",
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
  });

  describe("findMany", () => {
    it("should perform query with only companyId", async () => {
      const results = await engine.findMany({}, { companyId: "company123" });

      expect(results[0]).toEqual({
        id: results[0]?.id,
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
        ...OPENSEARCH_ACTION_TEMPLATE,
      });
    });
  });
});
