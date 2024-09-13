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

import z from "zod";

const OpenSearchActionSchema = z.object({
  id: z.string().optional(),
  timestamp: z.string(),
  companyId: z.string().optional(),
  clientId: z.string().optional(),
  app: z.string().optional(),
  environment: z.string().optional(),
  framework: z
    .object({
      name: z.string().optional(),
      version: z.string().optional(),
    })
    .optional(),
  sessionId: z.string().optional(),
  traceIds: z.array(z.string()).optional(),
  action: z.object({
    id: z.string().optional(),
    type: z.string(),
    verb: z.string(),
    object: z.string().optional(),
  }),
  agents: z.array(
    z.object({
      id: z.string().optional(),
      type: z.string(),
      name: z.string().optional(),
      meta: z
        .array(
          z.object({
            key: z.string(),
            value: z.string(),
          })
        )
        .optional(),
    })
  ),
  targets: z
    .array(
      z.object({
        id: z.string().optional(),
        type: z.string(),
        name: z.string().optional(),
        meta: z
          .array(
            z.object({
              key: z.string(),
              value: z.string(),
            })
          )
          .optional(),
      })
    )
    .optional(),
  request: z
    .array(
      z.object({
        key: z.string(),
        parent: z.string().optional(),
        value: z.string(),
      })
    )
    .optional(),
  response: z
    .object({
      status: z.string().optional(),
      time: z.number().optional(),
      body: z
        .array(
          z.object({
            key: z.string(),
            value: z.string(),
          })
        )
        .optional(),
      headers: z
        .array(
          z.object({
            key: z.string(),
            value: z.string(),
          })
        )
        .optional(),
    })
    .optional(),
  changes: z
    .array(
      z.object({
        model: z.string(),
        operation: z.string(), // create, update, delete, read
        id: z.string().optional(),
        path: z.string().optional(),
        before: z.string().optional(),
        after: z.string().optional(),
        meta: z
          .array(
            z.object({
              key: z.string(),
              value: z.string(),
            })
          )
          .optional(),
      })
    )
    .optional(),
  cost: z
    .object({
      amount: z.number(),
      currency: z.string(),
      components: z
        .array(
          z.object({
            type: z.string().optional(),
            key: z.string(),
            amount: z.number(),
          })
        )
        .optional(),
      meta: z
        .array(
          z.object({
            key: z.string(),
            value: z.string(),
          })
        )
        .optional(),
    })
    .optional(),
  meta: z
    .array(
      z.object({
        key: z.string(),
        value: z.string(),
      })
    )
    .optional(),
});

type OpenSearchAction = z.infer<typeof OpenSearchActionSchema>;

export { OpenSearchAction, OpenSearchActionSchema };
