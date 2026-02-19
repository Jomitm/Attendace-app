# CRWI Attendance Policy Manual

This manual explains how attendance is currently calculated in the app.

## 1. Standard Work Hours
- Standard office hours: `9:00 AM - 5:00 PM`
- Late marking starts after: `9:15 AM`
- Working days: Monday to Saturday
- Holiday pattern: 2nd and 4th Saturday are off, Sunday is off

## 2. Attendance Status Rules

### A. Morning / Before Afternoon Entry
- `On or before 9:15 AM`: `Present`
- `After 9:15 AM and up to 10:15 AM`:
- If worked `>= 8h`: `Present (Late Waived)`
- If worked `< 8h`: `Late`
- `After 10:15 AM and up to 12:00 PM`:
- If worked `>= 4h`: `Half Day`
- If worked `< 4h`: `Absent`

### B. Afternoon Office Entry
For afternoon check-ins, result is hours-based:
- Worked `< 4h`: `Absent`
- Worked `>= 4h and < 8h`: `Half Day`
- Worked `>= 8h`: `Present`

## 3. Day Credit Mapping
- `Present`: `1.0`
- `Present (Late Waived)`: `1.0`
- `Late`: `1.0` (but counts for late deduction policy)
- `Half Day`: `0.5`
- `Absent`: `0.0`

## 4. Mandatory Late Deduction Rule
- Every `3` late marks = `0.5 day` salary deduction
- Formula:
- `Raw Late Deduction Days = floor(Late Count / 3) * 0.5`

## 5. Extra Worked Hours and Penalty Offset
- Extra work hours are tracked.
- Extra hours can reduce late penalty.
- Rule:
- Every `4 extra hours` offsets `0.5 day` late deduction.
- Formula:
- `Penalty Offset Days = floor(Extra Hours / 4) * 0.5`
- `Effective Late Deduction Days = max(0, Raw Late Deduction Days - Penalty Offset Days)`

## 6. Salary Calculation (Current App Logic)
- Daily rate = `Base Salary / 22`
- Total deduction days = `Unpaid Leave Days + Effective Late Deduction Days`
- Attendance deduction amount = `Daily Rate * Total Deduction Days`
- Final net salary also applies TDS after adjusted salary.

## 7. Statuses You Will See in UI
- `Present`
- `Present (Late Waived)`
- `Late`
- `Half Day`
- `Absent`
- `Work - Home`, `Training`, `On Duty`, Leave/Holiday types (as applicable)

## 8. Admin Utilities
- `Policy Test` page:
- Simulate attendance outcome
- Simulate late deduction and penalty offset
- `Recalculate Existing Logs` button:
- Recomputes old attendance logs using current policy fields
- Useful after policy updates so dashboard/salary summaries match current rules

## 9. Notes
- Historical records created before policy updates may show old behavior until recalculated.
- Manual override logs are treated as admin-controlled records.
