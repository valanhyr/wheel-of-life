import healthCatalog from "./health-results.json" with { type: "json" };
import healthRules from "./health-rules.json" with { type: "json" };
import emotionalCatalog from "./emotional-results.json" with { type: "json" };
import emotionalRules from "./emotional-rules.json" with { type: "json" };
import relationshipsCatalog from "./relationships-results.json" with { type: "json" };
import relationshipsRules from "./relationships-rules.json" with { type: "json" };
import familyCatalog from "./family-results.json" with { type: "json" };
import familyRules from "./family-rules.json" with { type: "json" };
import growthCatalog from "./growth-results.json" with { type: "json" };
import growthRules from "./growth-rules.json" with { type: "json" };
import leisureCatalog from "./leisure-results.json" with { type: "json" };
import leisureRules from "./leisure-rules.json" with { type: "json" };

// The original Finance and Work entry points retain their existing rules.
// These areas use the same result builder with declarative context and pattern rules.
export const additionalAreas = {
  salud: { areaName: "Salud", prefix: "SAL", catalog: healthCatalog, rules: healthRules, patterns: healthCatalog.health_patterns },
  emocional: { areaName: "Emocional", prefix: "EMO", catalog: emotionalCatalog, rules: emotionalRules, patterns: emotionalCatalog.emotional_patterns },
  relaciones: { areaName: "Relaciones", prefix: "REL", catalog: relationshipsCatalog, rules: relationshipsRules, patterns: relationshipsCatalog.relationships_patterns },
  familia: { areaName: "Familia", prefix: "FAM", catalog: familyCatalog, rules: familyRules, patterns: familyCatalog.family_patterns },
  crecimiento: { areaName: "Crecimiento", prefix: "CRE", catalog: growthCatalog, rules: growthRules, patterns: growthCatalog.growth_patterns },
  ocio: { areaName: "Ocio", prefix: "OCI", catalog: leisureCatalog, rules: leisureRules, patterns: leisureCatalog.leisure_patterns },
};
