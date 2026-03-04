import { countKeywordMatches, gitignoreEntryMatches, hasAnyDependency, hasAnyFilePattern, includesAny, parseGitignoreEntries } from './helpers';
import { evidenceDetail, makeResult } from './result';
import { CriterionEvaluatorInput } from './types';

export async function evaluateSecurity(
  input: CriterionEvaluatorInput,
) {
  const { criterion, ctx, signals } = input;
  const { local, ghData } = ctx;

  switch (criterion.id) {
    case 'automated_security_review':
      return includesAny(signals.workflowText, ['codeql', 'snyk', 'semgrep'])
        ? makeResult(
            criterion,
            'pass',
            'Automated security review workflow detected.',
            [],
            [
              evidenceDetail(
                'workflow',
                'medium',
                'Workflow includes CodeQL/Snyk/Semgrep references.',
              ),
            ],
          )
        : makeResult(criterion, 'fail', 'No automated security review workflow detected.');

    case 'branch_protection':
      if (!ghData.available || !ghData.authenticated) {
        return makeResult(
          criterion,
          'unverified',
          'Requires authenticated gh CLI to verify branch protection.',
        );
      }
      if (ghData.branchProtectionEnabled === undefined) {
        return makeResult(
          criterion,
          'unverified',
          'Branch protection status unavailable (permissions may be limited).',
        );
      }
      return ghData.branchProtectionEnabled
        ? makeResult(criterion, 'pass', 'Branch protection is enabled.')
        : makeResult(
            criterion,
            'fail',
            'Branch protection not detected on default branch.',
          );

    case 'codeowners':
      return local.fileSet.has('CODEOWNERS') || local.fileSet.has('.github/CODEOWNERS')
        ? makeResult(criterion, 'pass', 'CODEOWNERS file detected.')
        : makeResult(criterion, 'fail', 'CODEOWNERS file not found.');

    case 'dast_scanning':
      return includesAny(signals.workflowText, ['zap', 'dast', 'dynamic application security'])
        ? makeResult(criterion, 'pass', 'DAST workflow detected.')
        : makeResult(criterion, 'fail', 'No DAST scanning workflow detected.');

    case 'dependency_update_automation':
      return local.fileSet.has('.github/dependabot.yml') ||
        local.fileSet.has('.github/dependabot.yaml') ||
        local.fileSet.has('.github/renovate.json') ||
        local.fileSet.has('renovate.json')
        ? makeResult(
            criterion,
            'pass',
            'Dependency update automation configuration detected.',
            [],
            [
              evidenceDetail(
                'file',
                'strong',
                'Dependabot/Renovate configuration file detected.',
              ),
            ],
          )
        : makeResult(criterion, 'fail', 'No Dependabot/Renovate configuration found.');

    case 'gitignore_comprehensive': {
      if (!local.fileSet.has('.gitignore')) {
        return makeResult(criterion, 'fail', '.gitignore file is missing.');
      }

      const entries = parseGitignoreEntries(local.gitignoreContent);
      const hasEnvIgnore =
        gitignoreEntryMatches(entries, '.env') ||
        gitignoreEntryMatches(entries, '.env.local') ||
        gitignoreEntryMatches(entries, '.env.production') ||
        gitignoreEntryMatches(entries, '.env.development');

      if (!hasEnvIgnore) {
        return makeResult(
          criterion,
          'fail',
          '.gitignore exists but does not ignore common environment secret files (for example `.env` or `.env*`).',
          [],
          [
            evidenceDetail(
              'file',
              'strong',
              '.gitignore found without explicit environment secret ignore entries.',
            ),
          ],
        );
      }

      const recommendedLocal = ['.vscode', '.idea', '.ds_store'];
      const missingRecommended = recommendedLocal.filter(
        (entry) => !gitignoreEntryMatches(entries, entry),
      );
      if (missingRecommended.length === 0) {
        return makeResult(
          criterion,
          'pass',
          '.gitignore includes environment-secret and common local artifact ignores.',
          [],
          [
            evidenceDetail(
              'file',
              'strong',
              '.gitignore includes `.env` and common local artifact ignore entries.',
            ),
          ],
        );
      }

      return makeResult(
        criterion,
        'pass',
        `.gitignore covers environment secrets. Optional local entries missing: ${missingRecommended.join(', ')}.`,
        [],
        [
          evidenceDetail(
            'file',
            'medium',
            '.gitignore includes secret-file ignores but not all optional local artifacts.',
          ),
        ],
      );
    }

    case 'log_scrubbing':
      if (countKeywordMatches(signals.workflowText, ['redact', 'scrub', 'mask', 'sanitize']) > 0) {
        return makeResult(
          criterion,
          'pass',
          'Log scrubbing/redaction checks detected in workflows.',
          [],
          [
            evidenceDetail(
              'workflow',
              'medium',
              'Workflow references log scrubbing/redaction checks.',
            ),
          ],
        );
      }
      if (countKeywordMatches(signals.allTextIndex, ['redact', 'scrub', 'mask', 'sanitize']) > 0) {
        return makeResult(
          criterion,
          'unverified',
          'Only weak textual references to log scrubbing were found.',
          [],
          [
            evidenceDetail(
              'text',
              'weak',
              'Redaction/scrubbing keywords present in repository text index.',
            ),
          ],
        );
      }
      return makeResult(criterion, 'fail', 'No log scrubbing mechanism detected.');

    case 'pii_handling':
      if (countKeywordMatches(signals.workflowText, ['pii', 'data classification', 'personal data']) > 0) {
        return makeResult(
          criterion,
          'pass',
          'PII handling controls referenced in workflow/policy automation.',
          [],
          [
            evidenceDetail(
              'workflow',
              'medium',
              'Workflow references PII handling checks/policies.',
            ),
          ],
        );
      }
      if (countKeywordMatches(signals.allTextIndex, ['pii', 'data classification', 'personal data']) > 0) {
        return makeResult(
          criterion,
          'unverified',
          'Only textual references to PII handling were found.',
          [],
          [
            evidenceDetail(
              'text',
              'weak',
              'PII-related keywords present in text index.',
            ),
          ],
        );
      }
      return makeResult(criterion, 'fail', 'No explicit PII handling controls detected.');

    case 'privacy_compliance':
      if (countKeywordMatches(signals.workflowText, ['gdpr', 'ccpa', 'privacy policy']) > 0) {
        return makeResult(
          criterion,
          'pass',
          'Privacy compliance checks/policies detected in workflows.',
          [],
          [
            evidenceDetail(
              'workflow',
              'medium',
              'Workflow references GDPR/CCPA/privacy policy checks.',
            ),
          ],
        );
      }
      if (countKeywordMatches(signals.allTextIndex, ['gdpr', 'ccpa', 'privacy policy']) > 0) {
        return makeResult(
          criterion,
          'unverified',
          'Only textual privacy-compliance references were found.',
          [],
          [
            evidenceDetail(
              'text',
              'weak',
              'GDPR/CCPA/privacy policy keywords present in text index.',
            ),
          ],
        );
      }
      return makeResult(criterion, 'fail', 'No privacy compliance references detected.');

    case 'secret_scanning':
      if (!ghData.available || !ghData.authenticated) {
        return makeResult(
          criterion,
          'unverified',
          'Requires authenticated gh CLI to verify secret scanning.',
        );
      }
      if (ghData.secretScanningEnabled === undefined) {
        return makeResult(
          criterion,
          'unverified',
          'Secret scanning status unavailable (permissions may be limited).',
        );
      }
      return ghData.secretScanningEnabled
        ? makeResult(criterion, 'pass', 'GitHub secret scanning is enabled.')
        : makeResult(criterion, 'fail', 'Secret scanning not detected as enabled.');

    case 'secrets_management':
      return hasAnyDependency(local, ['aws-secrets-manager', 'vault', 'doppler', 'sops']) ||
        includesAny(signals.allTextIndex, ['secret manager', 'vault', 'kms'])
        ? hasAnyDependency(local, ['aws-secrets-manager', 'vault', 'doppler', 'sops'])
          ? makeResult(
              criterion,
              'pass',
              'Secrets management dependency detected.',
              [],
              [
                evidenceDetail(
                  'dependency',
                  'strong',
                  'Found dependency for secrets management integration.',
                ),
              ],
            )
          : makeResult(
              criterion,
              'unverified',
              'Only weak textual references to secrets management were found.',
              [],
              [
                evidenceDetail(
                  'text',
                  'weak',
                  'Secret manager/vault/KMS keywords found in text index.',
                ),
              ],
            )
        : makeResult(criterion, 'fail', 'No secrets management integration detected.');

    default:
      return null;
  }
}
