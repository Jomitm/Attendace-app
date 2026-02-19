/**
 * App Configuration
 * Centralizes business logic and constants.
 */
(function () {
    window.AppConfig = {
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
            const d = new Date(date);
            const dateNum = d.getDate();
            const n = Math.ceil(dateNum / 7);
            // Return true if 2nd or 4th saturday
            return (n === 2 || n === 4);
        },

        // Penalties
        LATE_GRACE_COUNT: 3, // Number of lates before deduction
        LATE_DEDUCTION_PER_BLOCK: 0.5, // Every 3 late marks = 0.5 day deduction
        EXTRA_HOURS_FOR_HALF_DAY_OFFSET: 4 // 4 extra hours waives 0.5 day late penalty
    };

    console.log("App Config Loaded");
})();
