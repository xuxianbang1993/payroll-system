import { describe, expect, it } from "vitest";

import { cn } from "@/lib/utils";

describe("cn", () => {
  it("merges tailwind classes with later override", () => {
    const className = cn("px-2 py-2", "px-4");
    expect(className).toContain("py-2");
    expect(className).toContain("px-4");
    expect(className).not.toContain("px-2");
  });
});
