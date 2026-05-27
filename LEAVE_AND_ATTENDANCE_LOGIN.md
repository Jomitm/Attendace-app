# Leave, Attendance, and Login - Working Understanding

This document summarizes the current app behavior by combining policy notes and implementation logic.

## 1) Attendance Sheet Understanding
- Attendance records are stored with check-in/check-out time, duration, attendance type, and location fields.
- Common status values include: `Present`, `Present (Late Waived)`, `Late`, `Half Day`, `Absent`, plus leave/holiday labels.
- Admin/attendance-admin users can review, add, edit, and delete manual attendance records from attendance sheet tools.
- Attendance sheet and payroll depend on the same attendance logs, so policy recalculation is used after rule changes.

## 2) Core Attendance Policy Rules
Based on `ATTENDANCE_POLICY_MANUAL.md`:

- Standard shift: `9:00 AM - 5:00 PM`
- Grace/late threshold starts after `9:15 AM`
- Working days: Monday-Saturday
- Weekly off: 2nd and 4th Saturday, and Sunday

Status outcomes:
- On/before `9:15 AM`: `Present`
- `9:16 AM-10:15 AM`:
  - Worked >= 8h -> `Present (Late Waived)`
  - Worked < 8h -> `Late`
- `10:16 AM-12:00 PM`:
  - Worked >= 4h -> `Half Day`
  - Worked < 4h -> `Absent`
- Afternoon entry is hours-based:
  - < 4h -> `Absent`
  - >= 4h and < 8h -> `Half Day`
  - >= 8h -> `Present`

Day credit mapping:
- `Present` / `Present (Late Waived)` / `Late` -> `1.0`
- `Half Day` -> `0.5`
- `Absent` -> `0.0`

Late deduction:
- Every 3 late marks = 0.5 day deduction
- Extra work can offset penalty: every 4 extra hours offsets 0.5 day
- Effective late deduction cannot go below 0

## 3) Salary Linkage (Current Logic)
- Daily rate = `Base Salary / 22`
- Deduction days = `Unpaid Leave Days + Effective Late Deduction Days`
- Attendance deduction = `Daily Rate * Deduction Days`
- Final payroll applies TDS after attendance adjustment

## 4) Leave Policy Understanding (Current Defaults + Flow)
Default leave policy (fallback) in app logic includes:
- `Annual Leave`: 10
- `Casual Leave`: 6
- `Medical Leave`: 6
- `Maternity Leave`: 180 (paid)
- `Paternity Leave`: 10 (paid)
- `Study Leave`: 5 (unpaid, approval required)
- `Compassionate Leave`: 3
- `Retreat Leave`: 10
- `Staff Development Leave`: policy-driven (approval required)

Operational behavior:
- Leave requests are created by users and move through `Pending`, `Approved`, or `Rejected`.
- On approval, attendance entries are generated automatically for the approved leave window.
- If approval is reversed or changed, linked generated attendance leave logs are removed/regenerated accordingly.
- Short leave has hour-based checks (warning above 2h request and warning when monthly usage exceeds 4h).

## 5) Login and Attendance Capture Behavior
- Login form requires credentials and location capture.
- If location cannot be captured, login is blocked with a location-enabled retry message.
- On successful login, user last login location is saved.
- Check-in requires valid location coordinates.
- Check-out also records location and session details.

Missed checkout handling:
- If user had an open previous-day session, app closes it automatically as `Half Day` (4h fixed) when needed.
- User is prompted after next login/check-in to submit missed-checkout reason for admin review.

## 6) Admin Utilities
- `Policy Test` page can simulate attendance outcome and penalty logic.
- `Recalculate Existing Logs` updates historical records to align with current policy rules.

## 7) Practical Notes
- Policy values can come from dynamic settings (`settings/policies`) and fallback defaults are used if unavailable.
- Historical records may not reflect new rules until recalculation is run.
- Manual logs are admin-controlled override records.
