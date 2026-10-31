import { test } from 'node:test';
import assert from 'node:assert/strict';
import { selectDashboardActivities, recentDashboardActivities } from '../../js/utils/dashboard-activities.js';
test('My Activity consistently selects only the viewer across supported owner fields', () => {
    const rows = [{ userId: 'self', task: 'One' }, { user_id: 'self', task: 'Two' }, { staffId: 'self', task: 'Three' }, { userId: 'other', task: 'Other staff' }, { task: 'Unattributed' }];
    assert.deepEqual(selectDashboardActivities(rows, 'my', 'self').map(row => row.task), ['One', 'Two', 'Three']);
    assert.deepEqual(selectDashboardActivities(rows, undefined, 'self').map(row => row.task), ['One', 'Two', 'Three']);
    assert.equal(selectDashboardActivities(rows, 'team', 'self'), rows);
    assert.deepEqual(selectDashboardActivities(rows, 'my', ''), []);
});

test('Recent Activity uses recorded changes and completed work without repeating open task plans', () => {
    const rows = [
        { userId: 'self', _displayDesc: 'Open task', date: '2026-10-30', _taskStatus: 'in-process' },
        { userId: 'self', _displayDesc: 'Completed task', date: '2026-10-20', _taskStatus: 'completed', completedDate: '2026-10-30T10:00:00Z' },
        { userId: 'self', _displayDesc: 'Changed task', taskUpdates: [{ action: 'postpone', timestamp: '2026-10-30T11:00:00Z' }] },
        { userId: 'self', _displayDesc: 'Bad date', _taskStatus: 'completed', date: 'invalid' }
    ];
    const recent = recentDashboardActivities([...rows, rows[1]]);
    assert.deepEqual(recent.map(row => row._displayDesc), ['Changed task', 'Completed task']);
    assert.equal(recent[0].changeLabel, 'Postponed a task');
    assert.equal(recent[1].dateLabel, '');
    assert.equal(recentDashboardActivities([{ _taskStatus: 'completed', date: '2026-10-30' }])[0].dateLabel, 'Record date · ');
    assert.deepEqual(recentDashboardActivities(rows, 'date-asc').map(row => row._displayDesc), ['Completed task', 'Changed task']);
    assert.equal(recentDashboardActivities(Array.from({ length: 8 }, (_, index) => ({ _displayDesc: String(index), _taskStatus: 'completed', date: '2026-10-30' }))).length, 5);
});
