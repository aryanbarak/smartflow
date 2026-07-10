import { describe, expect, it } from "vitest";
import {
  createDefaultWorkspaceMemory,
  loadWorkspaceMemory,
  migrateWorkspaceMemory,
  saveWorkspaceMemory,
  WORKSPACE_MEMORY_STORAGE_KEY,
} from "./workspaceMemoryStorage";

class MemoryStorage implements Storage {
  private values = new Map<string, string>();
  get length() {
    return this.values.size;
  }
  clear() {
    this.values.clear();
  }
  getItem(key: string) {
    return this.values.get(key) ?? null;
  }
  key(index: number) {
    return Array.from(this.values.keys())[index] ?? null;
  }
  removeItem(key: string) {
    this.values.delete(key);
  }
  setItem(key: string, value: string) {
    this.values.set(key, value);
  }
}

describe("workspaceMemoryStorage", () => {
  it("creates default v1 memory", () => {
    const memory = createDefaultWorkspaceMemory(new Date("2026-07-10T08:00:00Z"));

    expect(memory.version).toBe(1);
    expect(memory.createdAt).toBe("2026-07-10T08:00:00.000Z");
    expect(memory.recentDomains).toEqual([]);
    expect(memory.domainUsage.tasks.openCount).toBe(0);
    expect(memory.recentInteractions).toEqual([]);
    expect(memory.interactionCountsByType).toEqual({});
    expect(memory.interactionCountsByDomain).toEqual({});
  });

  it("falls back safely when storage contains corrupt JSON", () => {
    const storage = new MemoryStorage();
    storage.setItem(WORKSPACE_MEMORY_STORAGE_KEY, "{bad json");

    const memory = loadWorkspaceMemory(storage);

    expect(memory.version).toBe(1);
    expect(memory.workspaceHistory).toEqual([]);
  });

  it("resets unsupported versions", () => {
    const memory = migrateWorkspaceMemory({ version: 999, recentDomains: ["tasks"] });

    expect(memory.version).toBe(1);
    expect(memory.recentDomains).toEqual([]);
  });

  it("bounds persisted arrays during migration", () => {
    const memory = migrateWorkspaceMemory({
      version: 1,
      createdAt: "2026-07-10T08:00:00.000Z",
      updatedAt: "2026-07-10T08:00:00.000Z",
      recentDomains: Array(20).fill("tasks"),
      domainUsage: {
        tasks: {
          openCount: 50,
          recentOpenTimestamps: Array(40).fill("2026-07-10T08:00:00.000Z"),
        },
      },
      workspaceHistory: Array(30).fill({
        generatedAt: "2026-07-10T08:00:00.000Z",
        primaryDomain: "tasks",
        secondaryDomains: ["calendar"],
        confidence: "medium",
      }),
      recentInteractions: Array(70).fill({
        id: "interaction",
        type: "action_clicked",
        domain: "tasks",
        targetId: "tasks",
        targetTitle: "Tasks",
        source: "suggested_actions",
        occurredAt: "2026-07-10T08:00:00.000Z",
        schemaVersion: 1,
      }),
      interactionCountsByType: {
        action_clicked: 12,
        invalid: 99,
      },
      interactionCountsByDomain: {
        tasks: 12,
        invalid: 99,
      },
    });

    expect(memory.recentDomains).toHaveLength(10);
    expect(memory.domainUsage.tasks.recentOpenTimestamps).toHaveLength(20);
    expect(memory.workspaceHistory).toHaveLength(14);
    expect(memory.recentInteractions).toHaveLength(50);
    expect(memory.interactionCountsByType.action_clicked).toBe(12);
    expect(memory.interactionCountsByDomain.tasks).toBe(12);
  });

  it("saves and loads valid memory", () => {
    const storage = new MemoryStorage();
    const memory = createDefaultWorkspaceMemory(new Date("2026-07-10T08:00:00Z"));

    expect(saveWorkspaceMemory(memory, storage)).toBe(true);
    expect(loadWorkspaceMemory(storage).createdAt).toBe(memory.createdAt);
  });
});
