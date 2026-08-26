# AgriGuard preliminary scenarios

`preliminary-scenarios.json` is the independently labelled, fixed-seed input
manifest for the preliminary PCIE experiment. The detector reads but does not
write `expectedFraud` or `expectedRules`.

Registry identities, authorization history and yield policies are immutable
TypeScript research fixtures under
`apps/backend/src/research/agriguard/fixtures.ts`. This is an urgent research
prototype limitation: the model is not backed by production Prisma migrations
or production API endpoints.

Do not tune or relabel scenarios after observing metrics. Additions require a
manifest version change and must be committed before re-running evaluation.
