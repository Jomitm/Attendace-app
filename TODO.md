- [ ] Implement fix in js/modules/day-plan.js so day switching only fetches data for the selected date.
  - [ ] Remove AppDB.queryMany('work_plans', [{field:'date', operator:'==', value: date}]) usage from openDayPlan() hydration.
  - [ ] Remove AppDB.queryMany('work_plans', [{field:'date', operator:'==', value: safeDate}]) usage from prefetch logic.
  - [ ] Add helper to fetch day plans by doc ids only (annual shared + per-user personal plans).
  - [ ] Validate that othersBlocks still render correctly from fetched plans.
- [x] Run app / quick smoke test: open multiple day clicks and confirm no full collection reads.


