import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { getAllAuthors, setRetryDelayForTests } from "@/lib/api";

const AUTHORS = {
  data: {
    authorCollection: {
      items: [
        {
          name: "Alex Placeholder",
          slug: "alex-placeholder",
          picture: { url: "https://images.ctfassets.net/placeholder.jpg" },
        },
      ],
    },
  },
};

const ok = (body: unknown) =>
  new Response(JSON.stringify(body), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });

const httpError = (status: number, statusText: string) =>
  new Response(JSON.stringify({ errors: [{ message: "upstream" }] }), {
    status,
    statusText,
  });

// A 200 whose body is not JSON, which is what a proxy or edge error page looks
// like from the client side.
const notJson = () =>
  new Response("<html><body>502 Bad Gateway</body></html>", {
    status: 200,
    headers: { "Content-Type": "text/html" },
  });

// Every ms the retry loop would have slept, in order. Assertions can read the
// schedule from here, which the previous real-timer version could only prove by
// taking 1.5 seconds per retry-exhausting case and never checked directly.
let delays: number[] = [];

beforeEach(() => {
  vi.stubEnv("CONTENTFUL_SPACE_ID", "space123");
  vi.stubEnv("CONTENTFUL_ACCESS_TOKEN", "cda-token");
  delays = [];
  setRetryDelayForTests(async (ms) => {
    delays.push(ms);
  });
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
  // Restore the real backoff, so a future test file importing lib/api does not
  // silently inherit a no-op delay from this one.
  setRetryDelayForTests();
});

describe("fetchGraphQL", () => {
  it("returns items and makes a single request when Contentful answers", async () => {
    const fetchMock = vi.fn().mockResolvedValue(ok(AUTHORS));
    vi.stubGlobal("fetch", fetchMock);

    await expect(getAllAuthors()).resolves.toHaveLength(1);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("retries a 500 and succeeds on the next attempt", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(httpError(500, "Internal Server Error"))
      .mockResolvedValueOnce(ok(AUTHORS));
    vi.stubGlobal("fetch", fetchMock);

    await expect(getAllAuthors()).resolves.toHaveLength(1);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("gives up after three attempts on a persistent 500", async () => {
    // Built per call, not once: a Response body can only be read once, and the
    // retry loop reads it on every attempt. A shared instance would fail the
    // second read with "Body has already been read", which no real fetch does.
    const fetchMock = vi
      .fn()
      .mockImplementation(async () => httpError(500, "Internal Server Error"));
    vi.stubGlobal("fetch", fetchMock);

    await expect(getAllAuthors()).rejects.toThrow(/500 Internal Server Error/);
    expect(fetchMock).toHaveBeenCalledTimes(3);
    // 500ms before attempt two, 1000ms before attempt three: the exponential
    // step, asserted rather than merely waited out.
    expect(delays).toEqual([500, 1000]);
  });

  it("retries a socket-level failure", async () => {
    const fetchMock = vi
      .fn()
      .mockRejectedValueOnce(new Error("ECONNRESET"))
      .mockResolvedValueOnce(ok(AUTHORS));
    vi.stubGlobal("fetch", fetchMock);

    await expect(getAllAuthors()).resolves.toHaveLength(1);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("does not retry a 401", async () => {
    const fetchMock = vi.fn().mockResolvedValue(httpError(401, "Unauthorized"));
    vi.stubGlobal("fetch", fetchMock);

    await expect(getAllAuthors()).rejects.toThrow(/401 Unauthorized/);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("throws when a 200 response carries errors and no data", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(ok({ errors: [{ message: "Cannot query field" }] }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(getAllAuthors()).rejects.toThrow(/returned errors/);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("warns but still returns data on a partial response", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const fetchMock = vi
      .fn()
      .mockResolvedValue(
        ok({ ...AUTHORS, errors: [{ message: "UNRESOLVABLE_LINK" }] }),
      );
    vi.stubGlobal("fetch", fetchMock);

    await expect(getAllAuthors()).resolves.toHaveLength(1);
    expect(warn).toHaveBeenCalledOnce();
  });

  it("retries an unparseable 200 and succeeds on the next attempt", async () => {
    const fetchMock = vi
      .fn()
      .mockImplementationOnce(async () => notJson())
      .mockImplementationOnce(async () => ok(AUTHORS));
    vi.stubGlobal("fetch", fetchMock);

    await expect(getAllAuthors()).resolves.toHaveLength(1);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("names Contentful and quotes the body when it never parses", async () => {
    const fetchMock = vi.fn().mockImplementation(async () => notJson());
    vi.stubGlobal("fetch", fetchMock);

    const error = await getAllAuthors().catch((thrown: unknown) => thrown);
    expect(error).toBeInstanceOf(Error);
    expect((error as Error).message).toMatch(/unparseable/);
    expect((error as Error).message).toMatch(/502 Bad Gateway/);
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it("attaches the underlying error as the cause of a socket failure", async () => {
    const cause = new Error("ECONNRESET");
    const fetchMock = vi.fn().mockRejectedValue(cause);
    vi.stubGlobal("fetch", fetchMock);

    const error = await getAllAuthors().catch((thrown: unknown) => thrown);
    expect(error).toBeInstanceOf(Error);
    expect((error as Error).cause).toBe(cause);
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it("names the missing environment variable and never calls fetch", async () => {
    vi.stubEnv("CONTENTFUL_SPACE_ID", "");
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    await expect(getAllAuthors()).rejects.toThrow(/CONTENTFUL_SPACE_ID/);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("trims whitespace out of the space id before building the URL", async () => {
    vi.stubEnv("CONTENTFUL_SPACE_ID", " space123\n");
    const fetchMock = vi.fn().mockResolvedValue(ok(AUTHORS));
    vi.stubGlobal("fetch", fetchMock);

    await getAllAuthors();
    expect(fetchMock.mock.calls[0][0]).toBe(
      "https://graphql.contentful.com/content/v1/spaces/space123",
    );
  });
});

describe("retry backoff", () => {
  it("does not delay before the first attempt", async () => {
    const fetchMock = vi.fn().mockResolvedValue(ok(AUTHORS));
    vi.stubGlobal("fetch", fetchMock);

    await getAllAuthors();
    expect(delays).toEqual([]);
  });

  it("waits once, for the base interval, before a single retry", async () => {
    const fetchMock = vi
      .fn()
      .mockImplementationOnce(async () => httpError(503, "Service Unavailable"))
      .mockImplementationOnce(async () => ok(AUTHORS));
    vi.stubGlobal("fetch", fetchMock);

    await expect(getAllAuthors()).resolves.toHaveLength(1);
    expect(delays).toEqual([500]);
  });

  it("does not delay at all when a 4xx fails immediately", async () => {
    const fetchMock = vi.fn().mockResolvedValue(httpError(401, "Unauthorized"));
    vi.stubGlobal("fetch", fetchMock);

    await expect(getAllAuthors()).rejects.toThrow(/401 Unauthorized/);
    expect(delays).toEqual([]);
  });
});
