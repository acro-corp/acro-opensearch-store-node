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

import { breakCircularReferences } from "@acro-sdk/common-store";

export const transformArrayToObject = (
  arr: Array<{ key: string; value: string }> | undefined
): Record<string, string> | undefined => {
  if (!arr) return undefined;
  return arr.reduce<Record<string, string>>((obj, item) => {
    obj[item.key] = item.value;
    return obj;
  }, {});
};

export const transformObjectToArray = (
  obj: Record<string, string> | undefined
): Array<{ key: string; value: string }> | undefined => {
  if (!obj) return undefined;
  return Object.entries(obj).map(([key, value]) => ({
    key,
    value:
      typeof value === "string"
        ? value
        : JSON.stringify(breakCircularReferences(value)),
  }));
};
