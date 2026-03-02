import { describe, it, expect } from "vitest";
import {
  getAgentSkillMappings,
  getAllUsedSkills,
  getAgentsUsingSkill,
  type AgentSkillMapping,
} from "./agent-skills";

// Note: These tests work with the actual OPENCLAW_DIR.
// The module reads the env var at load time, so we can't mock it easily.
// For isolated testing, the module would need dependency injection.

describe("agent-skills", () => {
  describe("getAgentSkillMappings", () => {
    it("returns an array", () => {
      const result = getAgentSkillMappings();
      expect(Array.isArray(result)).toBe(true);
    });

    it("returns mappings with correct structure", () => {
      const result = getAgentSkillMappings();

      for (const mapping of result) {
        expect(mapping).toHaveProperty("agentId");
        expect(mapping).toHaveProperty("agentName");
        expect(mapping).toHaveProperty("emoji");
        expect(mapping).toHaveProperty("skillIds");
        expect(Array.isArray(mapping.skillIds)).toBe(true);
      }
    });

    it("returns non-empty skill arrays for each agent", () => {
      const result = getAgentSkillMappings();

      for (const mapping of result) {
        expect(mapping.skillIds.length).toBeGreaterThan(0);
      }
    });

    it("sorts results by agent name", () => {
      const result = getAgentSkillMappings();

      if (result.length >= 2) {
        const names = result.map((m) => m.agentName);
        const sorted = [...names].sort((a, b) => a.localeCompare(b));
        expect(names).toEqual(sorted);
      }
    });
  });

  describe("getAllUsedSkills", () => {
    it("returns an array", () => {
      const result = getAllUsedSkills();
      expect(Array.isArray(result)).toBe(true);
    });

    it("returns unique skills", () => {
      const result = getAllUsedSkills();

      // Check no duplicates
      const unique = new Set(result);
      expect(unique.size).toBe(result.length);
    });

    it("sorts skills alphabetically", () => {
      const result = getAllUsedSkills();

      if (result.length >= 2) {
        const sorted = [...result].sort();
        expect(result).toEqual(sorted);
      }
    });

    it("returns strings", () => {
      const result = getAllUsedSkills();

      for (const skill of result) {
        expect(typeof skill).toBe("string");
        expect(skill.length).toBeGreaterThan(0);
      }
    });
  });

  describe("getAgentsUsingSkill", () => {
    it("returns an array", () => {
      const result = getAgentsUsingSkill("non-existent-skill-xyz");
      expect(Array.isArray(result)).toBe(true);
    });

    it("returns empty array for non-existent skill", () => {
      const result = getAgentsUsingSkill("non-existent-skill-xyz");
      expect(result).toEqual([]);
    });

    it("returns agents with correct structure", () => {
      // Get all skills first
      const allSkills = getAllUsedSkills();

      if (allSkills.length > 0) {
        const result = getAgentsUsingSkill(allSkills[0]);

        for (const agent of result) {
          expect(agent).toHaveProperty("agentId");
          expect(agent).toHaveProperty("agentName");
          expect(agent).toHaveProperty("emoji");
          expect(agent).toHaveProperty("skillIds");
          expect(agent.skillIds).toContain(allSkills[0]);
        }
      }
    });

    it("returns only agents that have the specified skill", () => {
      const allSkills = getAllUsedSkills();

      if (allSkills.length > 0) {
        const skillToTest = allSkills[0];
        const result = getAgentsUsingSkill(skillToTest);

        for (const agent of result) {
          expect(agent.skillIds).toContain(skillToTest);
        }
      }
    });
  });

  describe("AgentSkillMapping type", () => {
    it("has all required properties with correct types", () => {
      const mapping: AgentSkillMapping = {
        agentId: "test-agent",
        agentName: "Test Agent",
        emoji: "🤖",
        skillIds: ["typescript", "react-19"],
      };

      expect(typeof mapping.agentId).toBe("string");
      expect(typeof mapping.agentName).toBe("string");
      expect(typeof mapping.emoji).toBe("string");
      expect(Array.isArray(mapping.skillIds)).toBe(true);
    });
  });

  describe("integration", () => {
    it("getAllUsedSkills is consistent with getAgentSkillMappings", () => {
      const mappings = getAgentSkillMappings();
      const allSkills = getAllUsedSkills();

      // Collect all skills from mappings
      const collectedSkills = new Set<string>();
      for (const mapping of mappings) {
        for (const skill of mapping.skillIds) {
          collectedSkills.add(skill);
        }
      }

      // allSkills should contain exactly the collected skills
      expect(new Set(allSkills)).toEqual(collectedSkills);
    });

    it("getAgentsUsingSkill returns subset of getAgentSkillMappings", () => {
      const allSkills = getAllUsedSkills();

      if (allSkills.length > 0) {
        const skillToTest = allSkills[0];
        const allAgents = getAgentSkillMappings();
        const agentsWithSkill = getAgentsUsingSkill(skillToTest);

        // All agents with skill should be in all agents
        for (const agent of agentsWithSkill) {
          const found = allAgents.find((a) => a.agentId === agent.agentId);
          expect(found).toBeDefined();
        }
      }
    });
  });
});
