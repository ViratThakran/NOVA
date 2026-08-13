/**
 * NOTIFICATION UI STATE / FILTERING LOGIC
 *
 * Pure-function tests for the notification unread-count helpers used by
 * /student/notifications and the dashboard notification summary. No
 * database required.
 *
 * Run with: npm run test
 */

import { describe, it, expect } from "vitest";
import { countUnread, hasUnread } from "../../src/lib/notification-view-state";

describe("countUnread", () => {
  it("returns 0 for an empty list", () => {
    expect(countUnread([])).toBe(0);
  });

  it("returns 0 when all notifications are read", () => {
    expect(countUnread([{ read: true }, { read: true }])).toBe(0);
  });

  it("counts only unread notifications", () => {
    expect(countUnread([{ read: true }, { read: false }, { read: false }])).toBe(2);
  });
});

describe("hasUnread", () => {
  it("is false for an empty list", () => {
    expect(hasUnread([])).toBe(false);
  });

  it("is false when everything is read", () => {
    expect(hasUnread([{ read: true }])).toBe(false);
  });

  it("is true when at least one notification is unread", () => {
    expect(hasUnread([{ read: true }, { read: false }])).toBe(true);
  });
});
