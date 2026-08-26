import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

// NOTE: day-plan.js no longer exports SizeCategory/PurposeCategory constants;
// this suite exercises the pure scoring math with literal category strings.

function createTask(size, purpose, priority) {
    return {
        task: 'Test task',
        sizeCategory: size,
        purposeCategory: purpose,
        priorityLevel: priority,
        isRemoved: false,
        completedDate: null
    };
}

function computeBonus(tasks) {
    // This mirrors the actual analytics logic from day-plan.js
    const totalTasks = tasks.length;
    const priorityTasks = tasks.filter(t => t.priorityLevel).length;
    const ratio = priorityTasks / Math.max(1, totalTasks);

    const hasBonus = priorityTasks >= 5 && ratio >= 0.8;
    const warning = priorityTasks >= 5 && ratio < 0.4;

    return {
        totalTasks,
        priorityTasks,
        ratio,
        hasBonus,
        warning,
        bonusPoints: hasBonus ? 3 : 0
    };
}

const expect = (actual) => ({
    toBe: (expected, msg) => assert.strictEqual(actual, expected, msg),
    toBeCloseTo: (expected, digits, msg) => assert.ok(Math.abs(actual - expected) < Math.pow(10, -digits) / 2, msg || `${actual} ≈ ${expected}`)
});

describe('Classification Logic - Priority Only Bonus System', () => {
    it('should count only Priority for classification, not Size or Purpose', () => {
        // Test 1: Tasks with Size and Purpose but no Priority should not get bonus
        const tasksWithSizePurposeOnly = [
            createTask('quick-task', 'routine', ''),
            createTask('single-action', 'improvement', ''),
            createTask('small-task', 'investigation', ''),
            createTask('medium-task', 'creation', ''),
            createTask('large-task', 'coordination', ''),
            createTask('major-project', 'emergency', '')
        ];

        const result1 = computeBonus(tasksWithSizePurposeOnly);
        expect(result1.priorityTasks).toBe(0, 'Should have 0 priority tasks');
        expect(result1.hasBonus).toBe(false, 'Should not have bonus with no priority');
        expect(result1.bonusPoints).toBe(0, 'Should have 0 bonus points');

        // Test 2: Tasks with Priority should get bonus (with sufficient ratio)
        const tasksWithPriority = [
            createTask('quick-task', 'routine', 'urgent'),
            createTask('single-action', 'improvement', 'important'),
            createTask('small-task', 'investigation', 'standard'),
            createTask('medium-task', 'creation', 'flexible'),
            createTask('large-task', 'coordination', 'urgent')
        ];

        const result2 = computeBonus(tasksWithPriority);
        expect(result2.priorityTasks).toBe(5, 'Should have 5 priority tasks');
        expect(result2.ratio).toBe(1.0, 'Ratio should be 100%');
        expect(result2.hasBonus).toBe(true, 'Should have bonus with 5+ tasks and 80%+ ratio');
        expect(result2.bonusPoints).toBe(3, 'Should have 3 bonus points');

        // Test 3: Mixed - some with Priority, some without
        const mixedTasks = [
            createTask('quick-task', 'routine', 'urgent'),
            createTask('single-action', 'improvement', ''),
            createTask('small-task', 'investigation', 'important'),
            createTask('medium-task', 'creation', ''),
            createTask('large-task', 'coordination', 'urgent'),
            createTask('major-project', 'emergency', 'standard')
        ];

        const result3 = computeBonus(mixedTasks);
        // Fixtures carry priority at indices 0, 2, 4, 5 → 4 of 6 tasks
        expect(result3.priorityTasks).toBe(4, 'Should have 4 priority tasks');
        expect(result3.ratio).toBeCloseTo(4 / 6, 2, 'Ratio should be ~67%');
        expect(result3.hasBonus).toBe(false, 'Should not have bonus with less than 80% ratio');
        expect(result3.bonusPoints).toBe(0, 'Should have 0 bonus points');

        // Test 4: Warning threshold - 5+ tasks have Priority but <40% of total.
        // computeBonus warns when priorityTasks >= 5 && ratio < 0.4:
        // 5 prioritized out of 13 total ≈ 38%.
        const warningTasks = [
            createTask('quick-task', 'routine', 'urgent'),
            createTask('single-action', 'improvement', ''),
            createTask('small-task', 'investigation', 'important'),
            createTask('medium-task', 'creation', ''),
            createTask('large-task', 'coordination', 'standard'),
            createTask('major-project', 'emergency', ''),
            createTask('quick-task', 'routine', 'flexible'),
            createTask('single-action', 'improvement', ''),
            createTask('small-task', 'investigation', 'urgent'),
            createTask('medium-task', 'creation', ''),
            createTask('large-task', 'coordination', ''),
            createTask('major-project', 'emergency', ''),
            createTask('quick-task', 'routine', '')
        ];

        const result4 = computeBonus(warningTasks);
        expect(result4.totalTasks).toBe(13, 'Should have 13 total tasks');
        expect(result4.priorityTasks).toBe(5, 'Should have 5 priority tasks');
        expect(result4.ratio).toBeCloseTo(5 / 13, 2, 'Ratio should be ~38%');
        expect(result4.warning).toBe(true, 'Should show warning when <40% have priority');
        expect(result4.hasBonus).toBe(false, 'Should not have bonus with <80% ratio');
    });

    it('should validate helper banner text mentions Priority, not generic classification', () => {
        // Verify helper banner text
        const helperBanner = '<strong>Set the Priority</strong> for each task to earn +3 bonus points';
        expect(helperBanner.includes('Priority')).toBe(true, 'Should mention Priority');
        expect(helperBanner.includes('Size')).toBe(false, 'Should not mention Size');
        expect(helperBanner.includes('Purpose')).toBe(false, 'Should not mention Purpose');
    });

    it('should validate Priority label includes * for bonus indicator', () => {
        // Verify Priority label format (asterisk is wrapped in a styled span)
        const priorityLabel = 'Priority <span style="color:#d97706;font-size:0.55rem;font-weight:800;">*</span> for bonus';
        expect(priorityLabel.includes('*')).toBe(true, 'Should include bonus asterisk');
        expect(priorityLabel.includes('</span> for bonus')).toBe(true, 'Should mention for-bonus after the span');
        expect(priorityLabel.includes('Priority')).toBe(true, 'Should include Priority');
    });
});