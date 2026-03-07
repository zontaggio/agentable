export const DEV_ENVIRONMENT_WHY_IT_MATTERS: Record<string, string> = {
  database_schema:
    'Explicit schema and migration state help agents understand data shape and evolve it without creating silent contract drift.',
  devcontainer:
    'A devcontainer makes the execution environment reproducible, which reduces setup variance between agent runs and human runs.',
  devcontainer_runnable:
    'A valid, runnable devcontainer matters only if agents can actually boot the promised environment end to end.',
  env_template:
    'An environment template tells agents which configuration surfaces exist and prevents hidden local-only variables from becoming implicit dependencies.',
  local_services_setup:
    'Clear local service setup lets agents run realistic workflows instead of editing code against a partially simulated environment.',
};
