export const STYLE_VALIDATION_WHY_IT_MATTERS: Record<string, string> = {
  code_modularization:
    'Clear module boundaries help agents change one area without misreading responsibilities or scattering edits across unrelated files.',
  cyclomatic_complexity:
    'Complex code paths are harder for agents to reason about, test, and modify safely, so unchecked complexity drives brittle changes.',
  dead_code_detection:
    'Agents read whatever exists in the repo; stale code increases ambiguity and makes them preserve or edit paths that no longer matter.',
  duplicate_code_detection:
    'Duplication hides the true source of behavior, so agents often patch one copy and miss the others.',
  formatter:
    'Consistent formatting removes low-value diff noise, which lets agents and reviewers focus on behavior instead of style churn.',
  large_file_detection:
    'Very large files make code understanding and safe localized edits harder for agents, increasing collateral changes.',
  lint_config:
    'Lint rules turn quality expectations into machine-enforced constraints that agents can follow instead of inferring team standards.',
  n_plus_one_detection:
    'Without N+1 guardrails, agents can introduce database regressions that look correct in code review but fail under real load.',
  naming_consistency:
    'Consistent names help agents infer intent correctly and navigate the codebase without guessing equivalent concepts.',
  pre_commit_hooks:
    'Pre-commit hooks catch basic issues before changes spread, giving agents a faster feedback loop on simple mistakes.',
  strict_typing:
    'Strict typing narrows the space of valid changes, which reduces hallucinated interfaces and catches integration mistakes earlier.',
  tech_debt_tracking:
    'Visible debt signals help agents avoid building on known weak spots and make follow-up cleanup work explicit.',
  type_check:
    'Type checking gives agents fast structural validation, catching invalid assumptions before they reach tests or review.',
};
