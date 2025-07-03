export type Value = string[];

export const parseValue = (input: string | null): Value | null | "invalidValue" => {
  if (input === null) {
    return null;
  }

  try {
    const parsedValue = JSON.parse(input);
    return isValidValue(parsedValue) ? parsedValue : "invalidValue";
  } catch (e) {
    return "invalidValue";
  }
};

const isValidValue = (obj: unknown): obj is string[] =>
  Array.isArray(obj) && obj.every(item => typeof item === "string");
