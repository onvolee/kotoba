import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("extension workspace manifest", () => {
  it("does not register the workspace as a popup", () => {
    const manifestPath = resolve(__dirname, "../.output/chrome-mv3/manifest.json");
    const workspacePath = resolve(__dirname, "../.output/chrome-mv3/workspace.html");
    const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));

    expect(manifest.action?.default_popup).toBeUndefined();
    expect(manifest.action?.default_title).toBe("Open Kotoba workspace");
    expect(manifest.permissions).toContain("storage");
    expect(manifest.host_permissions).toEqual(expect.arrayContaining(["http://*/*", "https://*/*"]));
    expect(existsSync(workspacePath)).toBe(true);
  });
});
