import { describe, expect, it } from "vitest";
import { trackWorkspaceInteraction } from "./interactionTracker";
import {
  loadWorkspaceMemory,
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

describe("trackWorkspaceInteraction", () => {
  it("persists a typed interaction and bounded counters", () => {
    const storage = new MemoryStorage();
    const event = trackWorkspaceInteraction(
      {
        type: "learning_continued",
        domain: "learning",
        targetId: "sorting-algorithms",
        targetTitle: "Sorting Algorithms",
        source: "right_rail_learning",
        metadata: { progress: 82 },
      },
      { now: new Date("2026-07-10T09:00:00Z"), storage },
    );

    expect(event?.type).toBe("learning_continued");
    const memory = loadWorkspaceMemory(storage);
    expect(memory.recentInteractions).toHaveLength(1);
    expect(memory.interactionCountsByType.learning_continued).toBe(1);
    expect(memory.interactionCountsByDomain.learning).toBe(1);
    expect(memory.lastInteractionAt).toBe("2026-07-10T09:00:00.000Z");
  });

  it("never throws or stores invalid interactions", () => {
    const storage = new MemoryStorage();
    const event = trackWorkspaceInteraction(
      {
        type: "action_clicked",
        domain: "tasks",
        targetTitle: "",
        source: "suggested_actions",
      },
      { storage },
    );

    expect(event).toBeNull();
    expect(storage.getItem(WORKSPACE_MEMORY_STORAGE_KEY)).toBeNull();
  });

  it("strips sensitive URL query values from metadata", () => {
    const storage = new MemoryStorage();
    trackWorkspaceInteraction(
      {
        type: "recommendation_opened",
        domain: "documents",
        targetTitle: "Open document",
        source: "right_rail_recommendations",
        metadata: {
          url: "https://example.test/docs?id=secret#token",
        },
      },
      { storage },
    );

    const memory = loadWorkspaceMemory(storage);
    expect(memory.recentInteractions[0]?.metadata?.url).toBe(
      "https://example.test/docs",
    );
  });

  it("keeps only the latest 50 recent interactions", () => {
    const storage = new MemoryStorage();
    for (let index = 0; index < 60; index += 1) {
      trackWorkspaceInteraction(
        {
          type: "action_clicked",
          domain: "tasks",
          targetId: `task-${index}`,
          targetTitle: `Task ${index}`,
          source: "suggested_actions",
        },
        { now: new Date(2026, 6, 10, 9, 0, index), storage },
      );
    }

    const memory = loadWorkspaceMemory(storage);
    expect(memory.recentInteractions).toHaveLength(50);
    expect(memory.recentInteractions[0]?.targetTitle).toBe("Task 10");
    expect(memory.interactionCountsByType.action_clicked).toBe(60);
  });
});
