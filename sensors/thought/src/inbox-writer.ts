import { writeFileSync, readFileSync, copyFileSync, existsSync } from "node:fs";
import type { InboxItem, ValidTag } from "./types.js";

/**
 * Item to mark as processed (update tag and add ✓).
 */
export interface ItemToMark {
  item: InboxItem;
  tag: ValidTag;
}

/**
 * Check if file content has changed since we read it.
 */
export function hasFileChanged(inboxPath: string, originalContent: string): boolean {
  if (!existsSync(inboxPath)) {
    return true;
  }
  const currentContent = readFileSync(inboxPath, "utf-8");
  return currentContent !== originalContent;
}

/**
 * Create a backup of the inbox file.
 * Returns the backup path.
 */
export function createBackup(inboxPath: string): string {
  const backupPath = `${inboxPath}.bak`;
  copyFileSync(inboxPath, backupPath);
  return backupPath;
}

/**
 * Update the first line of an item to have the correct tag and ✓ marker.
 */
function markLineAsProcessed(line: string, tag: ValidTag): string {
  // Remove any existing tag and ✓ marker
  const cleaned = line.replace(/\s*\[\w+\]\s*✓?\s*$/, "");
  // Add the new tag and ✓
  return `${cleaned} [${tag}] ✓`;
}

/**
 * Update inbox.md:
 * - Mark saved items with their tag and ✓
 * - Remove deleted items
 * - Leave everything else untouched
 *
 * Creates a backup before modifying.
 *
 * @param inboxPath - Path to inbox.md
 * @param originalContent - Original file content
 * @param itemsToMark - Items to mark as processed (saved)
 * @param itemsToDelete - Items to delete
 * @returns Object with success status and backup path
 */
export function updateInbox(
  inboxPath: string,
  originalContent: string,
  itemsToMark: ItemToMark[],
  itemsToDelete: InboxItem[]
): { success: boolean; backupPath?: string; error?: string } {
  if (itemsToMark.length === 0 && itemsToDelete.length === 0) {
    return { success: true };
  }

  // Check if file changed during processing
  if (hasFileChanged(inboxPath, originalContent)) {
    return {
      success: false,
      error: "Inbox was modified during processing. No changes made to avoid data loss.",
    };
  }

  // Create backup before modifying
  const backupPath = createBackup(inboxPath);

  const lines = originalContent.split("\n");

  // Build maps for quick lookup
  const markMap = new Map<number, ValidTag>(); // lineStart -> tag
  for (const { item, tag } of itemsToMark) {
    markMap.set(item.lineStart, tag);
  }

  const linesToDelete = new Set<number>();
  for (const item of itemsToDelete) {
    for (let line = item.lineStart; line <= item.lineEnd; line++) {
      linesToDelete.add(line);
    }
  }

  // Process lines
  const newLines: string[] = [];
  for (let i = 0; i < lines.length; i++) {
    const lineNumber = i + 1; // 1-based

    // Skip deleted lines
    if (linesToDelete.has(lineNumber)) {
      continue;
    }

    // Check if this is the first line of an item to mark
    const tagToApply = markMap.get(lineNumber);
    if (tagToApply) {
      newLines.push(markLineAsProcessed(lines[i], tagToApply));
    } else {
      newLines.push(lines[i]);
    }
  }

  // Clean up multiple consecutive empty lines
  const cleanedLines: string[] = [];
  let lastWasEmpty = false;
  for (const line of newLines) {
    const isEmpty = line.trim() === "";
    if (isEmpty && lastWasEmpty) {
      continue;
    }
    cleanedLines.push(line);
    lastWasEmpty = isEmpty;
  }

  // Write back
  writeFileSync(inboxPath, cleanedLines.join("\n"));

  return { success: true, backupPath };
}
