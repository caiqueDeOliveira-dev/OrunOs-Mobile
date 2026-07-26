import { vi } from "vitest";

/**
 * supabase-js query builders are chainable AND thenable (`await builder`
 * resolves once you stop chaining). This fake reproduces just enough of
 * that shape for the methods these services actually call — it is NOT a
 * general-purpose Supabase mock, extend the method list if a new service
 * needs a method not covered here.
 */
export function fakeQueryResult(result: { data: any; error: any }) {
  const chain: any = {
    select: vi.fn(() => chain),
    eq: vi.fn(() => chain),
    is: vi.fn(() => chain),
    not: vi.fn(() => chain),
    order: vi.fn(() => chain),
    limit: vi.fn(() => chain),
    update: vi.fn(() => chain),
    insert: vi.fn(() => chain),
    maybeSingle: vi.fn(() => Promise.resolve(result)),
    single: vi.fn(() => Promise.resolve(result)),
    then: (onFulfilled: (r: typeof result) => any) => Promise.resolve(result).then(onFulfilled),
  };
  return chain;
}

export function fakeSupabaseFrom(tableResults: Record<string, { data: any; error: any }>) {
  return vi.fn((table: string) => {
    const result = tableResults[table] ?? { data: null, error: new Error(`no fake result configured for "${table}"`) };
    return fakeQueryResult(result);
  });
}
