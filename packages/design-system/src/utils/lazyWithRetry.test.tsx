import { describe, it, expect, vi } from "vitest";
import { render, waitFor } from "@testing-library/react";
import { Suspense } from "react";
import { lazyWithRetry, resolveWithRetry, clearChunkRetryFlag, LazyRetryDeps } from "./lazyWithRetry";

function fakeDeps(initialFlag: string | null = null): LazyRetryDeps & { flagValue: () => string | null } {
  let flag = initialFlag;
  return {
    reload: vi.fn(),
    getFlag: () => flag,
    setFlag: (v) => {
      flag = v;
    },
    clearFlag: () => {
      flag = null;
    },
    flagValue: () => flag,
  };
}

describe("resolveWithRetry (pure logic, no React involved)", () => {
  it("returns the module and clears the flag on success", async () => {
    const deps = fakeDeps("true"); // leftover flag from a previous failed session
    const Comp = () => null;
    const result = await resolveWithRetry(() => Promise.resolve({ default: Comp }), deps);

    expect(result.default).toBe(Comp);
    expect(deps.flagValue()).toBeNull();
    expect(deps.reload).not.toHaveBeenCalled();
  });

  it("reloads exactly once on first failure and never resolves/rejects that call", async () => {
    const deps = fakeDeps(null);
    const error = new Error("chunk failed");

    let settled = false;
    resolveWithRetry(() => Promise.reject(error), deps).then(
      () => (settled = true),
      () => (settled = true)
    );

    await vi.waitFor(() => expect(deps.reload).toHaveBeenCalledTimes(1));
    expect(deps.flagValue()).toBe("true");
    expect(settled).toBe(false); // intentionally hangs — the page is reloading
  });

  it("does not reload again if the flag is already set, and rejects with the real error", async () => {
    const deps = fakeDeps("true"); // simulates: already reloaded once this session
    const error = new Error("still broken after reload");

    await expect(resolveWithRetry(() => Promise.reject(error), deps)).rejects.toThrow(
      "still broken after reload"
    );
    expect(deps.reload).not.toHaveBeenCalled();
  });
});

describe("lazyWithRetry (React integration)", () => {
  it("renders the component normally when the import succeeds", async () => {
    const Comp = () => <div>ok</div>;
    const deps = fakeDeps();
    const Lazy = lazyWithRetry(() => Promise.resolve({ default: Comp }), deps);

    const { getByText } = render(
      <Suspense fallback="loading">
        <Lazy />
      </Suspense>
    );

    await waitFor(() => expect(getByText("ok")).toBeInTheDocument());
    expect(deps.reload).not.toHaveBeenCalled();
  });

  it("triggers exactly one reload on first failure instead of throwing to the ErrorBoundary immediately", async () => {
    const deps = fakeDeps(null);
    const Lazy = lazyWithRetry(() => Promise.reject(new Error("chunk failed")), deps);

    render(
      <Suspense fallback="loading">
        <Lazy />
      </Suspense>
    );

    await waitFor(() => expect(deps.reload).toHaveBeenCalledTimes(1));
  });
});

describe("clearChunkRetryFlag", () => {
  it("resets the flag", () => {
    const deps = fakeDeps("true");
    expect(deps.flagValue()).toBe("true");
    clearChunkRetryFlag(deps);
    expect(deps.flagValue()).toBeNull();
  });
});
