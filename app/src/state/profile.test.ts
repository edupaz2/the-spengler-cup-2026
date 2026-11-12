import { describe, expect, it } from "vitest";
import { loadProfile, newProfile, saveProfile } from "./profile";

function mem(initial?: string) {
  const data = new Map<string, string>();
  if (initial !== undefined) data.set("sa.profile", initial);
  return {
    getItem: (k: string) => data.get(k) ?? null,
    setItem: (k: string, v: string) => void data.set(k, v),
  };
}

describe("profile", () => {
  it("corrupted_json_gives_new_profile", () => {
    expect(loadProfile(mem("{not json"))).toEqual(newProfile());
  });
  it("throwing_storage_is_tolerated", () => {
    const bad = { getItem: () => { throw new Error("blocked"); }, setItem: () => { throw new Error("full"); } };
    expect(loadProfile(bad)).toEqual(newProfile());
    expect(() => saveProfile(bad, newProfile())).not.toThrow();
  });
  it("wrong_version_gives_new_profile", () => {
    expect(loadProfile(mem(JSON.stringify({ ...newProfile(), pucks: 999, version: 2 })))).toEqual(newProfile());
  });
  it("profile_round_trip", () => {
    const s = mem();
    const p = { ...newProfile(), pucks: 42, streak: 3, claimedDoors: ["2025-12-26"], collection: { c1: { tier: "silver" as const, copies: 2 } } };
    saveProfile(s, p);
    expect(loadProfile(s)).toEqual(p);
  });
});

describe("opening fields", () => {
  it("old_profiles_get_the_new_opening_fields", () => {
    const old = JSON.stringify({ ...newProfile(), seenWelcome: undefined, seenRecaps: undefined });
    const p = loadProfile({ getItem: () => old });
    expect(p.seenWelcome).toBe(false);
    expect(p.seenRecaps).toEqual([]);
  });
});
