// Password-only edits must not trigger unrelated Firestore profile writes.
export function staffProfileSnapshot(entries) {
    return JSON.stringify([...entries].filter(([name]) => name !== 'password'));
}

export async function saveStaffAccountChanges({ auth, userData, privateData, newPassword, profileChanged }) {
    const result = { profileSaved: false, passwordSaved: false, error: '' };
    const password = String(newPassword || '').trim();
    if (password && (password.length < 6 || password.length > 4096)) {
        return { ...result, error: 'Password must be between 6 and 4096 characters.' };
    }
    try {
        // Finish profile writes before touching credentials, so a rejected
        // profile edit cannot silently change the staff member's password.
        if (profileChanged) {
            if (!await auth.updateUser(userData, privateData)) throw new Error('User not found.');
            result.profileSaved = true;
        }
        if (password) {
            const saved = await auth.setPassword(userData.id, password);
            if (saved !== true) throw new Error(saved?.error || 'Could not change the password.');
            result.passwordSaved = true;
        }
    } catch (error) {
        result.error = (result.profileSaved ? 'Staff details were saved. Password change failed: ' : '')
            + (error.message || String(error));
    }
    return result;
}
