/**
 * Reverse Prompt Scorer
 * Scores tasks based on their alignment with the mission
 * Uses keyword matching with weighted scoring
 */

import type { Mission } from "./mission-types";
import type { KanbanTask } from "./kanban-db";

// ============================================================================
// Types
// ============================================================================

export type PriorityLevel = "high" | "medium" | "low";

export interface ScoredTask extends KanbanTask {
  score: number;
  priorityLevel: PriorityLevel;
  matchedKeywords: string[];
}

// ============================================================================
// Scoring Configuration
// ============================================================================

const SCORE_WEIGHTS = {
  title: 10,
  description: 5,
  labels: 15,
  goals: 20,
  values: 15,
} as const;

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Tokenize text into searchable keywords
 */
function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .split(/\s+/)
    .filter((word) => word.length > 2);
}

/**
 * Check if any keyword from searchTerms appears in text
 * Returns matching keywords
 */
function findMatches(text: string, searchTerms: string[]): string[] {
  const textLower = text.toLowerCase();
  return searchTerms.filter((term) => textLower.includes(term.toLowerCase()));
}

/**
 * Calculate score for a single field
 */
function scoreField(
  text: string,
  searchTerms: string[],
  weight: number
): { score: number; matches: string[] } {
  const matches = findMatches(text, searchTerms);
  if (matches.length === 0) {
    return { score: 0, matches: [] };
  }
  // Score is weighted by number of unique matches
  const uniqueMatches = [...new Set(matches)];
  const score = Math.min(uniqueMatches.length * weight, weight);
  return { score, matches: uniqueMatches };
}

/**
 * Determine priority level based on score
 */
function getPriorityLevel(score: number): PriorityLevel {
  if (score >= 70) return "high";
  if (score >= 40) return "medium";
  return "low";
}

// ============================================================================
// Main Scorer Function
// ============================================================================

/**
 * Score a single task against the mission
 * @param task - The Kanban task to score
 * @param mission - The mission to score against
 * @returns Scored task with score, priority, and matched keywords
 */
export function scoreTaskByMission(
  task: KanbanTask,
  mission: Mission
): ScoredTask {
  // Build search terms from mission
  const goalTerms = mission.goals.flatMap(tokenize);
  const valueTerms = mission.values.flatMap(tokenize);
  const statementTerms = tokenize(mission.statement);

  // Combine all search terms
  const allSearchTerms = [...goalTerms, ...valueTerms, ...statementTerms];

  // If no mission data, return low score
  if (allSearchTerms.length === 0) {
    return {
      ...task,
      score: 0,
      priorityLevel: "low",
      matchedKeywords: [],
    };
  }

  // Score each field
  const titleResult = scoreField(task.title, allSearchTerms, SCORE_WEIGHTS.title);
  const descriptionResult = scoreField(
    task.description || "",
    allSearchTerms,
    SCORE_WEIGHTS.description
  );
  const labelsResult = scoreField(
    task.labels.map((l) => l.name).join(" "),
    allSearchTerms,
    SCORE_WEIGHTS.labels
  );
  const goalsResult = scoreField(
    mission.goals.join(" "),
    allSearchTerms,
    SCORE_WEIGHTS.goals
  );
  const valuesResult = scoreField(
    mission.values.join(" "),
    allSearchTerms,
    SCORE_WEIGHTS.values
  );

  // Calculate total score (capped at 100)
  const totalScore = Math.min(
    titleResult.score +
      descriptionResult.score +
      labelsResult.score +
      goalsResult.score +
      valuesResult.score,
    100
  );

  // Collect all matched keywords
  const allMatches = [
    ...titleResult.matches,
    ...descriptionResult.matches,
    ...labelsResult.matches,
    ...goalsResult.matches,
    ...valuesResult.matches,
  ];
  const uniqueMatches = [...new Set(allMatches)];

  return {
    ...task,
    score: totalScore,
    priorityLevel: getPriorityLevel(totalScore),
    matchedKeywords: uniqueMatches,
  };
}

/**
 * Score multiple tasks and return sorted by score (descending)
 * @param tasks - Array of Kanban tasks to score
 * @param mission - The mission to score against
 * @param limit - Maximum number of tasks to return (default 20)
 * @returns Array of scored tasks sorted by score descending
 */
export function scoreTasksByMission(
  tasks: KanbanTask[],
  mission: Mission,
  limit: number = 20
): ScoredTask[] {
  const scoredTasks = tasks.map((task) => scoreTaskByMission(task, mission));

  // Sort by score descending
  scoredTasks.sort((a, b) => b.score - a.score);

  // Return top N tasks
  return scoredTasks.slice(0, limit);
}
