export const DOCUMENTATION_WHY_IT_MATTERS: Record<string, string> = {
  agents_md:
    'AGENTS.md gives repository-specific operating instructions, which is one of the clearest ways to constrain agent behavior.',
  agents_md_validation:
    'Validation for AGENTS.md keeps agent instructions current and enforced instead of becoming stale folklore.',
  api_schema_docs:
    'Schema docs give agents explicit contracts for external behavior, reducing guesswork around request and response shapes.',
  automated_doc_generation:
    'Automated docs reduce drift between implementation and reference material that agents depend on for context.',
  documentation_freshness:
    'Fresh docs lower the chance that agents optimize for workflows or architecture that the repo no longer uses.',
  readme:
    'A real README gives agents the minimum shared context for purpose, setup, and basic workflows.',
  service_flow_documented:
    'Service flow docs help agents understand data movement and system boundaries before they modify operational code.',
  skills:
    'A skills directory makes specialized workflows explicit, so agents can reuse project-approved procedures instead of improvising.',
};
