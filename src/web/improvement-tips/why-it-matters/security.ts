export const SECURITY_WHY_IT_MATTERS: Record<string, string> = {
  automated_security_review:
    'Automated security review catches risky patterns at machine speed, which matters when agents can generate broad changes quickly.',
  branch_protection:
    'Branch protection keeps agent-generated changes inside enforced review and CI gates instead of relying on manual discipline.',
  codeowners:
    'CODEOWNERS routes agent changes to the right humans, preserving domain review where blind automation would be risky.',
  dast_scanning:
    'DAST finds runtime-facing weaknesses that agents may not surface through static reasoning alone.',
  dependency_update_automation:
    'Automated dependency updates reduce the backlog of stale packages that agents would otherwise build on top of.',
  gitignore_comprehensive:
    'A comprehensive .gitignore prevents local secrets, build artifacts, and noise from entering the context agents read and modify.',
  log_scrubbing:
    'Log scrubbing matters because agents can expand observability quickly; without redaction, telemetry can become a data leak path.',
  pii_handling:
    'Explicit PII controls keep agents from introducing convenience changes that violate data handling expectations.',
  privacy_compliance:
    'Privacy requirements give agents hard boundaries around data collection, retention, and exposure decisions.',
  secret_scanning:
    'Secret scanning limits one of the fastest ways agent-generated changes can cause real damage: credential exposure.',
  secrets_management:
    'Managed secret patterns keep sensitive values out of code and docs, reducing the chance that agents learn or propagate them incorrectly.',
};
