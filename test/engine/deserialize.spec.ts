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
