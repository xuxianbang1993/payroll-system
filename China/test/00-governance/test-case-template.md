# Test Case Template

Use this metadata header at the top of each test file.

```ts
/**
 * phase: pX
 * module: settings | employee | payroll | voucher | import-export | data | i18n | acceptance
 * requirement: PRD section reference (e.g. 05-mod-payroll.md §2.1)
 * scope: unit | component | e2e
 * fixtures: relative path under 04-fixtures (optional)
 */
```

## Checklist

- requirement section is explicit and verifiable
- assertions reflect exact PRD formula or behavior
- naming follows `<phase>.<module>.<scope>.<case>.spec.ts`
- fixture data can be reused by at least one more test when applicable
