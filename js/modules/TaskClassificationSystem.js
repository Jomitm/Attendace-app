import { AppDB } from './db.js';
import { AppConfig } from '../config.js';

export class TaskClassificationSystem {
    constructor() {
        this.classificationCache = new Map();
        this.userPreferences = new Map();
        this.classificationRules = this.initializeClassificationRules();
    }
    
    initializeClassificationRules() {
        return {
            SIZE_CATEGORIES: {
                SINGLE_ACTION: {
                    label: 'Quick Action',
                    description: 'Simple task, 15 minutes or less',
                    icon: 'fa-bolt',
                    color: '#10b981',
                    weight: 0.8
                },
                QUICK_TASK: {
                    label: 'Quick Task',
                    description: 'Short task, up to 1 hour',
                    icon: 'fa-check',
                    color: '#3b82f6',
                    weight: 1.0
                },
                SMALL_TASK: {
                    label: 'Small Task',
                    description: 'Smaller project, 1-4 hours',
                    icon: 'fa-clipboard-list',
                    color: '#8b5cf6',
                    weight: 1.2
                },
                MEDIUM_TASK: {
                    label: 'Medium Task',
                    description: 'Moderate project, 4-8 hours',
                    icon: 'fa-clock',
                    color: '#f59e0b',
                    weight: 1.5
                },
                LARGE_TASK: {
                    label: 'Large Task',
                    description: 'Major project, 8-24 hours',
                    icon: 'fa-calendar',
                    color: '#ef4444',
                    weight: 1.8
                },
                MAJOR_PROJECT: {
                    label: 'Major Project',
                    description: 'Extensive work, 1+ days',
                    icon: 'fa-project-diagram',
                    color: '#dc2626',
                    weight: 2.0
                }
            },
            
            PURPOSE_CATEGORIES: {
                ROUTINE: {
                    label: 'Routine',
                    description: 'Regular maintenance or routine work',
                    icon: 'fa-arrow-rotate-right',
                    color: '#059669'
                },
                IMPROVEMENT: {
                    label: 'Improvement',
                    description: 'Enhancement or improvement work',
                    icon: 'fa-arrow-up-right-dots',
                    color: '#2563eb'
                },
                INVESTIGATION: {
                    label: 'Investigation',
                    description: 'Research or diagnostic work',
                    icon: 'fa-magnifying-glass',
                    color: '#7c3aed'
                },
                CREATION: {
                    label: 'Creation',
                    description: 'Building something new',
                    icon: 'fa-plus',
                    color: '#eab308'
                },
                COORDINATION: {
                    label: 'Coordination',
                    description: 'Team coordination or meetings',
                    icon: 'fa-users',
                    color: '#14b8a6'
                },
                EMERGENCY: {
                    label: 'Emergency',
                    description: 'Urgent, time-sensitive work',
                    icon: 'fa-triangle-exclamation',
                    color: '#dc2626'
                }
            },
            
            PRIORITY_LEVELS: {
                URGENT: {
                    label: 'Urgent',
                    description: 'Must do immediately',
                    color: '#dc2626',
                    weight: 2.0
                },
                IMPORTANT: {
                    label: 'Important',
                    description: 'High priority but can wait',
                    color: '#ea580c',
                    weight: 1.5
                },
                STANDARD: {
                    label: 'Standard',
                    description: 'Regular work priority',
                    color: '#ca8a04',
                    weight: 1.0
                },
                FLEXIBLE: {
                    label: 'Flexible',
                    description: 'Can be adjusted based on schedule',
                    color: '#16a34a',
                    weight: 0.5
                }
            }
        };
    }
    
    // Get all classification options for UI
    getClassificationOptions() {
        return {
            sizes: Object.values(this.classificationRules.SIZE_CATEGORIES),
            purposes: Object.values(this.classificationRules.PURPOSE_CATEGORIES),
            priorities: Object.values(this.classificationRules.PRIORITY_LEVELS)
        };
    }
    
    // Get size categories specifically for task sizing
    getSizeCategories() {
        return Object.values(this.classificationRules.SIZE_CATEGORIES);
    }
    
    // Get purpose categories specifically for task type
    getPurposeCategories() {
        return Object.values(this.classificationRules.PURPOSE_CATEGORIES);
    }
    
    // Get priority levels specifically for task urgency
    getPriorityLevels() {
        return Object.values(this.classificationRules.PRIORITY_LEVELS);
    }
}
