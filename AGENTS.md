# AGENTS.md

## Code Conventions

- Default to English everywhere in the source code, except for i18n/localization copy.

## Post-Task Lint Check

After completing a task that involved editing any files, you MUST:

1. Use `nr format` command to format files.
2. Use `nr lint` command to check linter errors.
3. Use `nr typecheck` command to check type errors.
4. If any **new** errors were introduced by your edits, fix them immediately.
