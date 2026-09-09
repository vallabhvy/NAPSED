# Specs

Git-native Napsed packages. Schema: [`schema.json`](./schema.json). Authoring contract: [`../CONTRIBUTING.md`](../CONTRIBUTING.md).

```
specs/
├── schema.json
├── practice/     # executionTier: wasm
└── challenges/   # executionTier: native (Judge0 in production)
```

`workspace.files` is hydrated from `starter/` by `scripts/hydrate-specs.mjs` and `src/services/specCatalog.ts`. Do not hand-duplicate file bodies into the manifest.
