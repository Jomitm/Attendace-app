/**
 * App Configuration
 * Centralizes business logic and constants.
 */
export const AppConfig = {
    // Attendance Timings (HH:mm 24-hour format)
    WORK_START_TIME: "09:00",
    LATE_CUTOFF_TIME: "09:15",
    WORK_END_TIME: "17:00", // 5:00 PM

    // Derived Minutes for easy calculation
    // 9:15 AM = 9 * 60 + 15 = 555
    LATE_CUTOFF_MINUTES: 555,
    MINOR_LATE_END_MINUTES: 615, // 10:15
    LATE_END_MINUTES: 720, // 12:00
    POST_NOON_END_MINUTES: 810, // 13:30
    AFTERNOON_START_MINUTES: 720, // 12:00 PM

    // 5:00 PM = 17 * 60 = 1020
    EARLY_DEPARTURE_MINUTES: 1020,

    // Financial Year
    FY_START_MONTH: 3, // April (0-indexed 3)

    // Holiday Rules
    // Saturdays: 1st, 3rd, 5th are working. 2nd, 4th are holidays.
    IS_SATURDAY_OFF: (date) => {
        // Read LOCAL day-of-month. 'YYYY-MM-DD' strings must NOT go through
        // new Date(string) (parses as UTC and shifts the day for positive UTC
        // offsets) — split the string instead.
        let d;
        if (typeof date === 'string') {
            const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(date.trim());
            d = m ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])) : new Date(date);
        } else {
            d = date instanceof Date ? date : new Date(date);
        }
        if (!(d instanceof Date) || Number.isNaN(d.getTime())) return false;
        const dateNum = d.getDate();
        const n = Math.ceil(dateNum / 7);
        // Return true if 2nd or 4th saturday
        return (n === 2 || n === 4);
    },

    // Penalties
    LATE_GRACE_COUNT: 3, // Number of lates before deduction
    LATE_DEDUCTION_PER_BLOCK: 0.5, // Every 3 late marks = 0.5 day deduction
    EXTRA_HOURS_FOR_HALF_DAY_OFFSET: 4, // 4 extra hours waives 0.5 day late penalty

    // Read optimization controls
    READ_CACHE_TTLS: {
        users: 600000,
        settings: 600000,
        minutes: 60000,
        attendanceSummary: 60000,
        staffMessages: 60000,
        dailySummaryReadMs: 120000,
        staffActivitiesReadMs: 120000,
        workPlansAllReadMs: 300000,
        workPlanReadMs: 300000
    },
    READ_OPT_FLAGS: {
        FF_READ_OPT_DB_QUERIES: true,
        FF_READ_OPT_TARGETED_REALTIME: true,
        FF_READ_OPT_ANALYTICS_CACHE: true,
        FF_SHARED_DAILY_SUMMARY: true,
        FF_SUMMARY_LOCKING: true,
        ENABLE_SIMULATION_MODULE: false,
        ENABLE_READ_TELEMETRY: true,
        ENABLE_PRESENCE_HEARTBEAT: false
    },
    SUMMARY_POLICY: {
        STALENESS_MS: 24 * 60 * 60 * 1000,
        TEAM_ACTIVITY_LIMIT: 15,
        LOCK_TTL_MS: 90000,
        SCHEMA_VERSION: 6,
        GENERATE_ON_FIRST_CHECKIN: true,
        RECOMPUTE_CUTOFF_HOUR_IST: 17,
        FALLBACK_TO_PREVIOUS_DAY: true
    },
    HERO_POLICY: {
        SCHEMA_VERSION: 6,
        WINDOW_DAYS: 7,
        FALLBACK_LOOKBACK_DAYS: 90,
        WEIGHTS: {
            completionRate: 0.20,
            absoluteVolume: 0.30,
            executionQuality: 0.20,
            missPenalty: 0.10,
            postponedPenalty: 0.02,
            planningBreadth: 0.15
        },
        EXPECTED_WEEKLY_TASKS: 5,
        ATTENDANCE_MODIFIER: {
            base: 0.9,
            maxBonus: 0.15,
            consistencyImpact: 0.65,
            effortImpact: 0.35
        },
        CAPS: {
            hours: 40,
            qualityChars: 500
        },
        DEFAULT_ACTIVITY_SCORE: 70,
        MIN_EVIDENCE: {
            minDays: 3,
            minDurationMs: 14400000,
            minPlannedTasks: 3
        }
    },
    SIMULATION_POLICY: {
        LEGACY_DUMMY_CLEANUP: {
            ENABLED: true,
            FLAG_KEY: 'legacy_dummy_cleanup_v1',
            TARGET_USER_IDS: ['sim_punctual', 'sim_admin_new'],
            TARGET_USERNAMES: ['jomit_p', 'maria'],
            AUDIT_COLLECTION: 'system_audit_logs'
        }
    },
    DASHBOARD: {
        TITLE: 'Attendance Command Center',
        MAX_REFRESHES: 3,
        WORKLOG_PAGE_SIZE: 25,
        OVERDUE_PREVIEW_COUNT: 3,
        LEAVE_REQUESTS_LIMIT: 5,
        LEAVE_HISTORY_LIMIT: 8,
        ACTIVITY_MONTHS_BACK: 8,
        HERO_VERSION_BADGE: 'v6'
    },
    DASHBOARD_CUSTOMIZATION: {
        DOC_PATH: 'settings/dashboard_customization',
        SCHEMA_VERSION: 1
    },
    KANBAN: {
        DEFAULT_COLUMNS: [
            { key: 'to-be-started', label: 'To Be Started', icon: 'fa-circle-dot' },
            { key: 'in-process', label: 'In Progress', icon: 'fa-spinner' },
            { key: 'completed', label: 'Completed', icon: 'fa-circle-check' },
            { key: 'overdue', label: 'Overdue', icon: 'fa-circle-exclamation' },
            { key: 'postponed', label: 'Postponed', icon: 'fa-clock' },
            { key: 'not-completed', label: 'Not Completed', icon: 'fa-circle-xmark' }
        ],
        ENABLE_DRAG_DROP: true,
        MAX_CARDS_PER_COLUMN: 50,
        DEFAULT_RANGE_DAYS: 7
    },
    DEMO_USER_USERNAME: 'demo',
    isDemoUser(user) {
        if (!user) return false;
        const username = String(user.username || '').toLowerCase().trim();
        return username === this.DEMO_USER_USERNAME;
    },
    // Points awarded to a task that was postponed, based on how much work had
    // already been done before it was moved. Consumed by rating.js calculateTaskPoints.
    POSTPONE_WORK_STATUS_POINTS: {
        not_started: 0,
        work_started: 3,
        in_progress: 5
    },
    // When logging in while another session token exists, only prompt the user to
    // "sign in here / sign out the other device" if that session started recently.
    // Uses activeSessionStartedAt (written at login) so no extra Firestore reads/writes
    // are introduced. A stale token from a long-closed tab is taken over silently.
    SESSION_TAKEOVER_PROMPT_WINDOW_MS: 24 * 60 * 60 * 1000,
    // Developer/owner accounts exempt from the takeover prompt and single-session
    // auto-checkout. They may log in on any device and share one session token
    // across devices without being asked or kicked. List by login username.
    OWNER_USERNAMES: ['jomit']
};
