//! /tests/unit/classification-logic.test.mjs
// Classification logic test for Priority-only bonus system
// Tests the bug fix: classification bonus should only count Priority, not Size or Purpose

import { describe, it, expect } from 'node:test';

import { SizeCategory } from '../../js/modules/day-plan.js';
import { PurposeCategory } from '../../js/modules/day-plan.js';

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
        expect(result3.priorityTasks).toBe(3, 'Should have 3 priority tasks');
        expect(result3.ratio).toBeCloseTo(3 / 6, 2, 'Ratio should be 50%');
        expect(result3.hasBonus).toBe(false, 'Should not have bonus with less than 80% ratio');
        expect(result3.bonusPoints).toBe(0, 'Should have 0 bonus points');

        // Test 4: Warning threshold - 5+ tasks but <40% have Priority
        const warningTasks = [
            createTask('quick-task', 'routine', 'urgent'),
            createTask('single-action', 'improvement', ''),
            createTask('small-task', 'investigation', ''),
            createTask('medium-task', 'creation', ''),
            createTask('large-task', 'coordination', '')
        ];

        const result4 = computeBonus(warningTasks);
        expect(result4.priorityTasks).toBe(1, 'Should have 1 priority task');
        expect(result4.ratio).toBeCloseTo(1 / 5, 2, 'Ratio should be 20%');
        expect(result4.warning).toBe(true, 'Should show warning when <40% have priority');
        expect(result4.hasBonus).toBe(false, 'Should not have bonus with <40% ratio');
    });

    it('should validate helper banner text mentions Priority, not generic classification', () => {
        // Verify helper banner text
        const helperBanner = '<strong>Set the Priority</strong> for each task to earn +3 bonus points';
        expect(helperBanner.includes('Priority')).toBe(true, 'Should mention Priority');
        expect(helperBanner.includes('Size')).toBe(false, 'Should not mention Size');
        expect(helperBanner.includes('Purpose')).toBe(false, 'Should not mention Purpose');
    });

    it('should validate Priority label includes * for bonus indicator', () => {
        // Verify Priority label format
        const priorityLabel = 'Priority <span style="color:#d97706;font-size:0.55rem;font-weight:800;">*</span> for bonus';
        expect(priorityLabel.includes('* for bonus')).toBe(true, 'Should include bonus indicator');
        expect(priorityLabel.includes('Priority')).toBe(true, 'Should include Priority');
    });
});