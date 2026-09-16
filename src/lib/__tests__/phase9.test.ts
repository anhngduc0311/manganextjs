import { describe, it, expect } from "vitest";
import robots from "@/app/robots";

describe("Phase 9 - SEO, Robots & Sitemap", () => {
  it("robots returns valid rule set including sitemap URL", () => {
    const robotsConfig = robots();
    expect(robotsConfig).toBeDefined();
    expect(robotsConfig.sitemap).toContain("/sitemap.xml");

    if (Array.isArray(robotsConfig.rules)) {
      expect(robotsConfig.rules.length).toBeGreaterThan(0);
    } else {
      expect(robotsConfig.rules?.allow).toBe("/");
      expect(robotsConfig.rules?.disallow).toContain("/admin/");
      expect(robotsConfig.rules?.disallow).toContain("/api/");
    }
  });
});
