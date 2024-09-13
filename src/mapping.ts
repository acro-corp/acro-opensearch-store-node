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

export const INDEX_MAPPING = {
  id: {
    type: "keyword",
  },
  timestamp: {
    type: "date",
    format: "date_time",
  },
  companyId: {
    type: "keyword",
  },
  clientId: {
    type: "keyword",
  },
  app: {
    type: "keyword",
  },
  environment: {
    type: "keyword",
  },
  framework: {
    properties: {
      name: {
        type: "keyword",
      },
      version: {
        type: "keyword",
      },
    },
  },
  sessionId: {
    type: "keyword",
  },
  traceIds: {
    type: "keyword",
  },
  action: {
    properties: {
      id: {
        type: "keyword",
      },
      type: {
        type: "keyword",
      },
      verb: {
        type: "keyword",
      },
      object: {
        type: "text",
        fields: {
          keyword: {
            type: "keyword",
          },
        },
      },
    },
  },
  agents: {
    properties: {
      id: {
        type: "keyword",
      },
      type: {
        type: "keyword",
      },
      name: {
        type: "text",
        fields: {
          keyword: {
            type: "keyword",
          },
        },
      },
      meta: {
        properties: {
          key: {
            type: "keyword",
          },
          value: {
            type: "text",
            fields: {
              keyword: {
                type: "keyword",
              },
            },
          },
        },
      },
    },
  },
  targets: {
    properties: {
      id: {
        type: "keyword",
      },
      type: {
        type: "keyword",
      },
      name: {
        type: "text",
        fields: {
          keyword: {
            type: "keyword",
          },
        },
      },
      meta: {
        properties: {
          key: {
            type: "keyword",
          },
          value: {
            type: "text",
            fields: {
              keyword: {
                type: "keyword",
              },
            },
          },
        },
      },
    },
  },
  request: {
    properties: {
      key: {
        type: "keyword",
      },
      parent: {
        type: "keyword",
      },
      value: {
        type: "text",
        fields: {
          keyword: {
            type: "keyword",
          },
        },
      },
    },
  },
  response: {
    properties: {
      status: {
        type: "keyword",
      },
      time: {
        type: "float",
      },
      body: {
        properties: {
          key: {
            type: "keyword",
          },
          value: {
            type: "text",
            fields: {
              keyword: {
                type: "keyword",
              },
            },
          },
        },
      },
      headers: {
        properties: {
          key: {
            type: "keyword",
          },
          value: {
            type: "text",
            fields: {
              keyword: {
                type: "keyword",
              },
            },
          },
        },
      },
    },
  },
  meta: {
    properties: {
      key: {
        type: "keyword",
      },
      value: {
        type: "text",
        fields: {
          keyword: {
            type: "keyword",
          },
        },
      },
    },
  },
  cost: {
    properties: {
      amount: {
        type: "float",
      },
      currency: {
        type: "keyword",
      },
      components: {
        properties: {
          type: {
            type: "keyword",
          },
          key: {
            type: "keyword",
          },
          amount: {
            type: "float",
          },
        },
      },
      meta: {
        properties: {
          key: {
            type: "keyword",
          },
          value: {
            type: "text",
            fields: {
              keyword: {
                type: "keyword",
              },
            },
          },
        },
      },
    },
  },
};
