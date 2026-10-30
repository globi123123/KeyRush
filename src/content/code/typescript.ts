import { defineSnippets } from '../types'

export const typescriptSnippets = defineSnippets('typescript', [
  {
    title: 'Interface and function',
    code: `
interface User {
  id: number;
  name: string;
  email?: string;
}

function greet(user: User): string {
  return \`Hello, \${user.name}!\`;
}`,
  },
  {
    title: 'Generic helper',
    code: `
function first<T>(items: T[]): T | undefined {
  return items.length > 0 ? items[0] : undefined;
}`,
  },
  {
    title: 'Discriminated union',
    code: `
type Shape =
  | { kind: "circle"; radius: number }
  | { kind: "square"; size: number };

function area(shape: Shape): number {
  switch (shape.kind) {
    case "circle":
      return Math.PI * shape.radius ** 2;
    case "square":
      return shape.size * shape.size;
  }
}`,
  },
  {
    title: 'Utility types',
    code: `
type Todo = { id: string; title: string; done: boolean };
type TodoPreview = Pick<Todo, "id" | "title">;
type TodoUpdate = Partial<Omit<Todo, "id">>;`,
  },
  {
    title: 'Generic queue',
    code: `
class Queue<T> {
  private items: T[] = [];

  enqueue(item: T): void {
    this.items.push(item);
  }

  dequeue(): T | undefined {
    return this.items.shift();
  }

  get size(): number {
    return this.items.length;
  }
}`,
  },
  {
    title: 'Result type',
    code: `
type Result<T> =
  | { ok: true; value: T }
  | { ok: false; error: string };

async function load(url: string): Promise<Result<unknown>> {
  try {
    const res = await fetch(url);
    return { ok: true, value: await res.json() };
  } catch (err) {
    return { ok: false, error: String(err) };
  }
}`,
  },
  {
    title: 'Enum and record',
    code: `
enum Level {
  Debug,
  Info,
  Warn,
  Error,
}

const labels: Record<Level, string> = {
  [Level.Debug]: "debug",
  [Level.Info]: "info",
  [Level.Warn]: "warning",
  [Level.Error]: "error",
};`,
  },
  {
    title: 'Typed component',
    code: `
type ButtonProps = {
  label: string;
  onClick: () => void;
  disabled?: boolean;
};

export function Button(props: ButtonProps) {
  const { label, onClick, disabled } = props;
  return (
    <button onClick={onClick} disabled={disabled}>
      {label}
    </button>
  );
}`,
  },
  {
    title: 'Type guard',
    code: `
function isString(value: unknown): value is string {
  return typeof value === "string";
}

const inputs: unknown[] = ["a", 1, "b", null];
const words = inputs.filter(isString);`,
  },
  {
    title: 'Mapped types',
    code: `
type Frozen<T> = {
  readonly [K in keyof T]: T[K];
};

function getProp<T, K extends keyof T>(obj: T, key: K): T[K] {
  return obj[key];
}`,
  },
])
