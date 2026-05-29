import { jsonrepair } from 'jsonrepair';

export const safeParseJson = <T>(input: string): T => {
  try {
    return JSON.parse(input) as T;
  } catch {
    try {
      const repairedJson = jsonrepair(input);
      return JSON.parse(repairedJson) as T;
    } catch {
      throw new Error(`Invalid JSON: ${input}`);
    }
  }
};

export const roundTo = (value: number, precision: number) => {
  return Math.round(value * 10 ** precision) / 10 ** precision;
};
