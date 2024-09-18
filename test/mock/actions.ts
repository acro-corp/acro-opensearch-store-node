const ACTION_TEMPLATE = {
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

export { ACTION_TEMPLATE, OPENSEARCH_ACTION_TEMPLATE };
