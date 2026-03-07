export const BUILD_SYSTEM_WHY_IT_MATTERS: Record<string, string> = {
  agentic_development:
    'Evidence of agent workflows shows the repo already encodes patterns for human-agent collaboration instead of treating AI usage as ad hoc.',
  automated_pr_review:
    'Automated PR review adds a second layer of machine feedback around agent-generated changes before humans approve them.',
  build_cmd_doc:
    'Agents need a canonical build path; without it they guess commands, miss required steps, and produce unverifiable changes.',
  build_performance_tracking:
    'Slow or unstable builds reduce the feedback speed agents need to iterate safely on proposed changes.',
  dead_feature_flag_detection:
    'Agents often add temporary toggles; without cleanup detection, stale flags accumulate and make behavior harder to reason about.',
  deployment_frequency:
    'Regular deployments usually mean the delivery path is exercised and trustworthy, which lowers the risk of agent-generated changes getting stuck.',
  deps_pinned:
    'Pinned dependencies keep environments reproducible so agents and humans validate against the same dependency graph.',
  fast_ci_feedback:
    'Fast CI lets agents confirm or reject changes quickly, reducing long loops where bad assumptions survive.',
  feature_flag_infrastructure:
    'Feature flags let agents ship risky changes behind controlled rollout boundaries instead of all-or-nothing releases.',
  heavy_dependency_detection:
    'Agents can add dependencies too casually; weight checks protect performance budgets that code review alone often misses.',
  monorepo_tooling:
    'In monorepos, agents need package boundaries, task orchestration, and graph awareness to avoid breaking unrelated workspaces.',
  progressive_rollout:
    'Progressive rollout limits blast radius when agent-generated changes behave differently in production than in tests.',
  release_automation:
    'Automated releases turn shipping into an explicit system, so agents do not have to reconstruct brittle manual release steps.',
  release_notes_automation:
    'Structured release notes preserve change context, which helps agents and humans understand what moved and why.',
  rollback_automation:
    'Rollback paths matter for agent readiness because they make risky automation reversible when something slips through.',
  single_command_setup:
    'A one-command setup gives agents a deterministic starting point instead of forcing environment-specific guesswork.',
  unused_dependencies_detection:
    'Agents may preserve or add packages that no longer serve a purpose; dependency hygiene keeps the codebase easier to navigate.',
  vcs_cli_tools:
    'Usable VCS tooling gives agents and humans explicit primitives for branching, diffing, and change recovery.',
  version_drift_detection:
    'Version drift checks stop agents from updating one package contract while leaving related packages inconsistent.',
};
