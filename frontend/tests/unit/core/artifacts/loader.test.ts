import { afterEach, describe, expect, it, rs } from "@rstest/core";

import {
  ARTIFACT_PREVIEW_MAX_BYTES,
  loadArtifactContent,
} from "@/core/artifacts/loader";

describe("loadArtifactContent", () => {
  afterEach(() => {
    rs.unstubAllGlobals();
  });

  it("requests only the preview byte budget and reports truncation", async () => {
    const bytes = new TextEncoder().encode("preview");
    const fetchMock = rs.fn(async (_url: string, init?: RequestInit) => {
      expect(new Headers(init?.headers).get("Range")).toBe(
        `bytes=0-${ARTIFACT_PREVIEW_MAX_BYTES - 1}`,
      );
      return new Response(bytes, {
        status: 206,
        headers: {
          "Content-Range": `bytes 0-${bytes.length - 1}/2000000`,
        },
      });
    });
    rs.stubGlobal("fetch", fetchMock);

    const result = await loadArtifactContent({
      filepath: "/mnt/user-data/outputs/large.txt",
      threadId: "thread-1",
    });

    expect(result.content).toBe("preview");
    expect(result.truncated).toBe(true);
    expect(result.totalBytes).toBe(2_000_000);
  });

  it("loads the full file only when explicitly requested", async () => {
    const fetchMock = rs.fn(async (_url: string, init?: RequestInit) => {
      expect(new Headers(init?.headers).has("Range")).toBe(false);
      return new Response("complete", {
        status: 200,
        headers: { "Content-Length": "8" },
      });
    });
    rs.stubGlobal("fetch", fetchMock);

    const result = await loadArtifactContent({
      filepath: "/mnt/user-data/outputs/large.txt",
      threadId: "thread-1",
      full: true,
    });

    expect(result).toMatchObject({
      content: "complete",
      truncated: false,
      totalBytes: 8,
    });
  });

  it("does not render a replacement character for a split UTF-8 code point", async () => {
    const emojiBytes = new TextEncoder().encode("abc😀");
    const partial = emojiBytes.slice(0, -2);
    rs.stubGlobal(
      "fetch",
      rs.fn(
        async () =>
          new Response(partial, {
            status: 206,
            headers: {
              "Content-Range": `bytes 0-${partial.length - 1}/${emojiBytes.length + 10}`,
            },
          }),
      ),
    );

    const result = await loadArtifactContent({
      filepath: "/mnt/user-data/outputs/unicode.txt",
      threadId: "thread-1",
    });

    expect(result.content).toBe("abc");
  });

  it("treats an unsatisfied range on an empty file as empty content", async () => {
    rs.stubGlobal(
      "fetch",
      rs.fn(
        async () =>
          new Response(null, {
            status: 416,
            headers: { "Content-Range": "bytes */0" },
          }),
      ),
    );

    const result = await loadArtifactContent({
      filepath: "/mnt/user-data/outputs/empty.txt",
      threadId: "thread-1",
    });

    expect(result).toMatchObject({
      content: "",
      truncated: false,
      totalBytes: 0,
    });
  });
});
