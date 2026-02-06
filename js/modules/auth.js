/**
 * Auth Module
 * Handles User Authentication and Session Management
 * (Converted to IIFE for file:// support)
 */
(function () {
    class Auth {
        constructor() {
            this.currentUser = null;
            this.sessionKey = 'crwi_session_user';
        }

        async init() {
            // Depend on AppDB
            await window.AppDB.init();

            const storedId = localStorage.getItem(this.sessionKey);
            if (storedId) {
                this.currentUser = await window.AppDB.get('users', storedId);
            }

            // Seed mock users if empty (First Run)
            const users = await window.AppDB.getAll('users');
            if (users.length === 0) {
                await this.seedUsers();
            }
        }

        async seedUsers() {
            const mockUsers = [
                {
                    id: 'admin01',
                    username: 'Admin',
                    password: 'Admin',
                    name: 'Sr. Mary (Admin)',
                    role: 'Administrator',
                    email: 'admin@crwi.org',
                    phone: '+91 98765 00000',
                    dept: 'Administration',
                    joinDate: '2023-01-01',
                    avatar: 'https://ui-avatars.com/api/?name=Admin&background=E11D48&color=fff',
                    status: 'out',
                    lastCheckIn: null
                },
                {
                    id: 'staff01',
                    username: 'Jomit',
                    password: '123',
                    name: 'Jomit',
                    role: 'Web Developer',
                    email: 'jomit@crwi.org',
                    phone: '+91 98765 43210',
                    dept: 'IT Department',
                    joinDate: '2024-01-01',
                    avatar: 'https://ui-avatars.com/api/?name=Jomit&background=0D8ABC&color=fff',
                    status: 'out',
                    lastCheckIn: null,
                    baseSalary: 50000
                }
            ];

            for (const u of mockUsers) {
                await window.AppDB.put('users', u);
            }
            console.log('Database seeded with mock users.');
        }

        async login(username, password) {
            const users = await window.AppDB.getAll('users');
            const cleanUser = username.trim().toLowerCase();
            const cleanPass = password.trim();

            console.log("Attempting Login:", { cleanUser, passwordProvided: cleanPass ? 'YES' : 'NO' });
            console.log("Available Users (Names only):", users.map(u => `${u.username} (${u.role})`));

            const user = users.find(u =>
                (u.username.toLowerCase().trim() === cleanUser || u.email.toLowerCase().trim() === cleanUser) &&
                u.password.trim() === cleanPass
            );

            if (user) {
                this.currentUser = user;
                localStorage.setItem(this.sessionKey, user.id);
                return true;
            } else {
                // Debugging help for 'Invalid Credentials'
                const userMatch = users.find(u => u.username.toLowerCase().trim() === cleanUser || u.email.toLowerCase().trim() === cleanUser);
                if (userMatch) {
                    console.warn(`User found '${userMatch.username}', but password mismatch.`);
                    console.warn(`Input Pass: "${cleanPass}", Stored Pass: "${userMatch.password}"`);
                } else {
                    console.warn(`User '${cleanUser}' not found.`);
                }
            }
            return false;
        }

        logout() {
            this.currentUser = null;
            localStorage.removeItem(this.sessionKey);
            window.location.reload();
        }

        getUser() {
            return this.currentUser;
        }

        async updateUser(userData) {
            // Find existing to preserve fields like avatar if not provided
            const existing = await window.AppDB.get('users', userData.id);
            if (!existing) return false;

            const updated = { ...existing, ...userData };

            // Sync Role & isAdmin Status
            // If checking the box or selecting the role, ensure both flags match
            const wantsAdmin = (userData.isAdmin === true || userData.isAdmin === 'true' || userData.role === 'Administrator');

            if (wantsAdmin) {
                updated.isAdmin = true;
                updated.role = 'Administrator';
                console.log(`Auth: Promoting user ${updated.id} to Administrator (Input was: isAdmin=${userData.isAdmin}, role=${userData.role})`);
            } else {
                // If explicitly demoting OR changing role away from Admin
                // We check if the INTENT was to change role or just update other details.
                // But if 'isAdmin' is explicitly passed as false, we must respect it.
                if (userData.isAdmin === false || userData.isAdmin === 'false') {
                    updated.isAdmin = false;
                    // If they were Admin and now demoted, default to Employee unless another role specified
                    if (updated.role === 'Administrator' && userData.role === 'Administrator') {
                        updated.role = 'Employee';
                    } else if (userData.role && userData.role !== 'Administrator') {
                        updated.role = userData.role;
                    } else if (updated.role === 'Administrator') {
                        updated.role = 'Employee';
                    }
                    console.log(`Auth: Demoting/Updating user ${updated.id} to ${updated.role} (Input was: isAdmin=${userData.isAdmin}, role=${userData.role})`);
                } else if (userData.role && userData.role !== 'Administrator') {
                    // Just a role change for a non-admin, or changing away from admin without touching checkbox (shouldn't happen in UI but good safety)
                    updated.isAdmin = false;
                    updated.role = userData.role;
                    console.log(`Auth: Role change for user ${updated.id} to ${updated.role}`);
                }
            }

            // Only regenerate default avatar if name changed AND no new avatar provided
            if (userData.name && userData.name !== existing.name && !userData.avatar) {
                updated.avatar = `https://ui-avatars.com/api/?name=${userData.name}&background=random&color=fff`;
            }

            await window.AppDB.put('users', updated);

            // If current user is the one being updated, refresh memory state
            if (this.currentUser && this.currentUser.id === updated.id) {
                this.currentUser = updated;
            }
            return true;
        }

        async resetData() {
            if (confirm('Are you sure you want to RESET ALL DATA? This will clear logs and users.')) {
                await window.AppDB.clear('users');
                await window.AppDB.clear('attendance');
                localStorage.clear();
                alert('Data reset. Reloading...');
                window.location.reload();
            }
        }
    }

    // Export to Window
    window.AppAuth = new Auth();
})();
