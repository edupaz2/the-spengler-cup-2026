import { readFileSync } from "node:fs";
import { describe, expect, it, vi } from "vitest";
import { requestReminder } from "./pwa";

describe("pwa", () => {
  it("manifest_is_installable", () => {
    const m = JSON.parse(readFileSync("public/manifest.webmanifest", "utf8"));
    expect(m.name).toBeTruthy();
    expect(m.display).toBe("standalone");
    expect(m.start_url).toBe("./");
    const sizes = m.icons.map((i: { sizes: string }) => i.sizes);
    expect(sizes).toContain("192x192");
    expect(sizes).toContain("512x512");
    for (const i of m.icons) expect(() => readFileSync("public/" + i.src)).not.toThrow();
  });
  it("reminder_button_tolerates_denied_permission", async () => {
    const show = vi.fn();
    const denied = { requestPermission: async () => "denied" as const, show };
    await expect(requestReminder(denied)).resolves.toBe("denied");
    expect(show).not.toHaveBeenCalled();
    await expect(requestReminder(undefined)).resolves.toBe("unsupported");
    const throwing = { requestPermission: async () => { throw new Error("nope"); }, show };
    await expect(requestReminder(throwing)).resolves.toBe("denied");
  });
  it("granted_permission_shows_sample_notification", async () => {
    const show = vi.fn();
    await expect(requestReminder({ requestPermission: async () => "granted" as const, show })).resolves.toBe("granted");
    expect(show).toHaveBeenCalledOnce();
  });
});
