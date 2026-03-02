import { describe, it, expect } from "vitest";
import path from "path";

// Need to test the module fresh since it uses process.env at load time
describe("paths", () => {
  it("exports OPENCLAW_DIR with default value", async () => {
    // Reset module cache
    vi.resetModules();
    
    const { OPENCLAW_DIR } = await import("./paths");
    
    // Should be either env value or default
    expect(typeof OPENCLAW_DIR).toBe("string");
    expect(OPENCLAW_DIR.length).toBeGreaterThan(0);
  });

  it("exports OPENCLAW_WORKSPACE", async () => {
    vi.resetModules();
    
    const { OPENCLAW_WORKSPACE } = await import("./paths");
    
    expect(typeof OPENCLAW_WORKSPACE).toBe("string");
  });

  it("exports OPENCLAW_CONFIG path", async () => {
    vi.resetModules();
    
    const { OPENCLAW_CONFIG } = await import("./paths");
    
    expect(OPENCLAW_CONFIG).toContain("openclaw.json");
  });

  it("exports OPENCLAW_MEDIA path", async () => {
    vi.resetModules();
    
    const { OPENCLAW_MEDIA } = await import("./paths");
    
    expect(OPENCLAW_MEDIA).toContain("media");
  });

  it("exports WORKSPACE_IDENTITY path", async () => {
    vi.resetModules();
    
    const { WORKSPACE_IDENTITY } = await import("./paths");
    
    expect(WORKSPACE_IDENTITY).toContain("IDENTITY.md");
  });

  it("exports WORKSPACE_TOOLS path", async () => {
    vi.resetModules();
    
    const { WORKSPACE_TOOLS } = await import("./paths");
    
    expect(WORKSPACE_TOOLS).toContain("TOOLS.md");
  });

  it("exports WORKSPACE_MEMORY path", async () => {
    vi.resetModules();
    
    const { WORKSPACE_MEMORY } = await import("./paths");
    
    expect(WORKSPACE_MEMORY).toContain("memory");
  });

  it("exports SYSTEM_SKILLS_PATH", async () => {
    vi.resetModules();
    
    const { SYSTEM_SKILLS_PATH } = await import("./paths");
    
    expect(SYSTEM_SKILLS_PATH).toContain("skills");
  });

  it("exports WORKSPACE_SKILLS_PATH", async () => {
    vi.resetModules();
    
    const { WORKSPACE_SKILLS_PATH } = await import("./paths");
    
    expect(WORKSPACE_SKILLS_PATH).toContain("skills");
  });

  it("exports ALLOWED_MEDIA_PREFIXES as array", async () => {
    vi.resetModules();
    
    const { ALLOWED_MEDIA_PREFIXES } = await import("./paths");
    
    expect(Array.isArray(ALLOWED_MEDIA_PREFIXES)).toBe(true);
    expect(ALLOWED_MEDIA_PREFIXES.length).toBe(2);
  });

  it("uses custom OPENCLAW_DIR from env", async () => {
    vi.resetModules();
    
    // Set custom env
    process.env.OPENCLAW_DIR = "/custom/path";
    
    const { OPENCLAW_DIR } = await import("./paths");
    
    expect(OPENCLAW_DIR).toBe("/custom/path");
    
    // Cleanup
    delete process.env.OPENCLAW_DIR;
  });
});
