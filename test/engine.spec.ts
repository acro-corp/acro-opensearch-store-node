import { describe, it, expect, beforeEach } from "vitest";
import { Action } from "@acro-sdk/common-store";
import { OpenSearchAction, OpenSearchEngine } from "../src";

describe("OpenSearchEngine", () => {
  let engine: OpenSearchEngine;

  beforeEach(() => {
    engine = new OpenSearchEngine(
      {},
      {
        nodes: ["https://your-opensearch-endpoint.com"],
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
      const action: Action = {
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
            meta: { role: "user", age: 30 },
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
      };

      const actionResponse = await engine.createAction(action);

      expect(actionResponse).toEqual({
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

  describe("direct serialize", () => {
    it("should correctly serialize an Action", async () => {
      const action: Action = {
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
            meta: { role: "user", age: 30 },
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
      };

      const serialized = await (engine as any).serialize(action);

      expect(serialized).toEqual({
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
      });
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
});
