import { NextRequest, NextResponse } from "next/server";
import {
  getJournalEntry,
  updateJournalEntry,
  deleteJournalEntry,
} from "@/lib/kanban-db";
import type { UpdateJournalEntryInput } from "@/lib/mission-types";

export const dynamic = "force-dynamic";

/**
 * GET /api/journal/[id]
 * Get a single journal entry by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const entry = getJournalEntry(id);
    if (!entry) {
      return NextResponse.json(
        { error: "Journal entry not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ entry });
  } catch (error) {
    console.error("Failed to get journal entry:", error);
    return NextResponse.json(
      { error: "Failed to get journal entry" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/journal/[id]
 * Update a journal entry
 * Body: { date?, narrative?, highlights? }
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    // Check entry exists
    const existing = getJournalEntry(id);
    if (!existing) {
      return NextResponse.json(
        { error: "Journal entry not found" },
        { status: 404 }
      );
    }

    // Validate date if provided
    if (body.date !== undefined && typeof body.date !== "string") {
      return NextResponse.json(
        { error: "date must be a string" },
        { status: 400 }
      );
    }

    // Validate narrative if provided
    if (body.narrative !== undefined) {
      if (typeof body.narrative !== "string") {
        return NextResponse.json(
          { error: "narrative must be a string" },
          { status: 400 }
        );
      }

      if (body.narrative.length < 10) {
        return NextResponse.json(
          { error: "narrative must be at least 10 characters" },
          { status: 400 }
        );
      }

      if (body.narrative.length > 5000) {
        return NextResponse.json(
          { error: "narrative must be 5000 characters or less" },
          { status: 400 }
        );
      }
    }

    // Validate highlights if provided
    if (body.highlights !== undefined) {
      if (!Array.isArray(body.highlights)) {
        return NextResponse.json(
          { error: "highlights must be an array" },
          { status: 400 }
        );
      }

      if (body.highlights.length > 10) {
        return NextResponse.json(
          { error: "highlights must have at most 10 items" },
          { status: 400 }
        );
      }

      for (const highlight of body.highlights) {
        if (typeof highlight !== "string") {
          return NextResponse.json(
            { error: "each highlight must be a string" },
            { status: 400 }
          );
        }
      }
    }

    const input: UpdateJournalEntryInput = {
      date: body.date,
      narrative: body.narrative,
      highlights: body.highlights,
    };

    const entry = updateJournalEntry(id, input);
    if (!entry) {
      return NextResponse.json(
        { error: "Failed to update journal entry" },
        { status: 500 }
      );
    }

    return NextResponse.json({ entry });
  } catch (error) {
    console.error("Failed to update journal entry:", error);
    return NextResponse.json(
      { error: "Failed to update journal entry" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/journal/[id]
 * Delete a journal entry
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Check entry exists
    const existing = getJournalEntry(id);
    if (!existing) {
      return NextResponse.json(
        { error: "Journal entry not found" },
        { status: 404 }
      );
    }

    const deleted = deleteJournalEntry(id);
    if (!deleted) {
      return NextResponse.json(
        { error: "Failed to delete journal entry" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete journal entry:", error);
    return NextResponse.json(
      { error: "Failed to delete journal entry" },
      { status: 500 }
    );
  }
}
