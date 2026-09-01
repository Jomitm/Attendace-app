/**
 * Auth Pages Component
 * Handles rendering of login and authentication-related screens.
 */

export function renderLogin() {
    let noticeHtml = '';
    try {
        const notice = sessionStorage.getItem('crwi_auth_notice');
        if (notice) {
            const escaped = String(notice).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
            noticeHtml = `<div class="auth-notice" style="margin-bottom:1.5rem; padding:0.75rem 1rem; border-radius:0.5rem; background:#fef2f2; color:#b91c1c; font-size:0.9rem; border:1px solid #fecaca;">${escaped}</div>`;
            sessionStorage.removeItem('crwi_auth_notice');
        }
    } catch { /* ignore */ }
    return `
        <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; padding: 2rem;">
            <div class="card" style="width: 100%; max-width: 400px; text-align: center;">
                <div class="logo-circle" style="width: 60px; height: 60px; margin: 0 auto 1.5rem auto;">
                    <img src="https://ui-avatars.com/api/?name=CRWI&background=random" alt="Logo">
                </div>
                <h2 style="margin-bottom: 0.5rem;">CRWI Attendance</h2>
                ${noticeHtml}
                <p class="text-muted" style="margin-bottom: 2rem;">Please sign in to continue</p>
                
                <form id="login-form" style="display: flex; flex-direction: column; gap: 1rem; text-align: left;">
                    <div>
                        <label style="font-size: 0.9rem; font-weight: 500; margin-bottom: 0.5rem; display: block;">Login ID / Email</label>
                        <input type="text" name="username" placeholder="Enter Login ID" required style="width: 100%; padding: 0.75rem; border: 1px solid #d1d5db; border-radius: 0.5rem;">
                    </div>
                    <div>
                        <label style="font-size: 0.9rem; font-weight: 500; margin-bottom: 0.5rem; display: block;">Password</label>
                        <input type="password" name="password" placeholder="Enter Password" required style="width: 100%; padding: 0.75rem; border: 1px solid #d1d5db; border-radius: 0.5rem;">
                    </div>
                    
                    <button type="submit" class="action-btn" style="margin-top: 1rem; width: 100%;">Sign In</button>
                </form>
                
                <p style="margin-top: 2rem; font-size: 0.85rem; color: #6b7280;">
                    Contact Admin for login credentials.
                </p>
            </div>
        </div>
     `;
}

export function renderOwnerLogin() {
    let noticeHtml = '';
    try {
        const notice = sessionStorage.getItem('crwi_auth_notice');
        if (notice) {
            const escaped = String(notice).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
            noticeHtml = `<div class="auth-notice" style="margin-bottom:1.5rem; padding:0.75rem 1rem; border-radius:0.5rem; background:#fef2f2; color:#b91c1c; font-size:0.9rem; border:1px solid #fecaca;">${escaped}</div>`;
            sessionStorage.removeItem('crwi_auth_notice');
        }
    } catch { /* ignore */ }
    return `
        <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; padding: 2rem;">
            <div class="card owner-login-card" style="width: 100%; max-width: 400px; text-align: center;">
                <div class="owner-login-banner">OWNER CONSOLE</div>
                <div class="logo-circle" style="width: 60px; height: 60px; margin: 0 auto 1.5rem auto;">
                    <img src="https://ui-avatars.com/api/?name=CRWI&background=4f46e5" alt="Logo">
                </div>
                <h2 style="margin-bottom: 0.5rem;">Owner Access</h2>
                ${noticeHtml}
                <p class="text-muted" style="margin-bottom: 2rem;">Restricted portal — owner credentials only</p>

                <form id="owner-login-form" style="display: flex; flex-direction: column; gap: 1rem; text-align: left;">
                    <div>
                        <label style="font-size: 0.9rem; font-weight: 500; margin-bottom: 0.5rem; display: block;">Owner Login ID</label>
                        <input type="text" name="username" placeholder="owner" required style="width: 100%; padding: 0.75rem; border: 1px solid #d1d5db; border-radius: 0.5rem;">
                    </div>
                    <div>
                        <label style="font-size: 0.9rem; font-weight: 500; margin-bottom: 0.5rem; display: block;">Password</label>
                        <input type="password" name="password" placeholder="Leave empty for first login" style="width: 100%; padding: 0.75rem; border: 1px solid #d1d5db; border-radius: 0.5rem;">
                    </div>

                    <button type="submit" class="action-btn owner-login-btn" style="margin-top: 1rem; width: 100%;">Sign In as Owner</button>
                </form>

                <p style="margin-top: 2rem; font-size: 0.8rem; color: #9ca3af;">
                    Staff? Return to the <a href="#dashboard" style="color:#4f46e5;">main login</a>.
                </p>
            </div>
        </div>
     `;
}

export function renderOwnerPasswordSetup(username = '') {
    let noticeHtml = '';
    try {
        const notice = sessionStorage.getItem('crwi_auth_notice');
        if (notice) {
            const escaped = String(notice).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
            noticeHtml = `<div class="auth-notice" style="margin-bottom:1.5rem; padding:0.75rem 1rem; border-radius:0.5rem; background:#fef2f2; color:#b91c1c; font-size:0.9rem; border:1px solid #fecaca;">${escaped}</div>`;
            sessionStorage.removeItem('crwi_auth_notice');
        }
    } catch { /* ignore */ }
    return `
        <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; padding: 2rem;">
            <div class="card owner-login-card" style="width: 100%; max-width: 400px; text-align: center;">
                <div class="owner-login-banner">OWNER CONSOLE</div>
                <div class="logo-circle" style="width: 60px; height: 60px; margin: 0 auto 1.5rem auto;">
                    <img src="https://ui-avatars.com/api/?name=CRWI&background=4f46e5" alt="Logo">
                </div>
                <h2 style="margin-bottom: 0.5rem;">Set Your Password</h2>
                ${noticeHtml}
                <p class="text-muted" style="margin-bottom: 2rem;">First-time login — please create a password for your account.</p>

                <form id="owner-password-setup-form" style="display: flex; flex-direction: column; gap: 1rem; text-align: left;">
                    <input type="hidden" name="username" value="${String(username).replace(/"/g, '&quot;')}">
                    <div>
                        <label style="font-size: 0.9rem; font-weight: 500; margin-bottom: 0.5rem; display: block;">New Password</label>
                        <input type="password" name="newPassword" placeholder="At least 4 characters" required minlength="4" style="width: 100%; padding: 0.75rem; border: 1px solid #d1d5db; border-radius: 0.5rem;">
                    </div>
                    <div>
                        <label style="font-size: 0.9rem; font-weight: 500; margin-bottom: 0.5rem; display: block;">Confirm Password</label>
                        <input type="password" name="confirmPassword" placeholder="Re-enter password" required minlength="4" style="width: 100%; padding: 0.75rem; border: 1px solid #d1d5db; border-radius: 0.5rem;">
                    </div>

                    <button type="submit" class="action-btn owner-login-btn" style="margin-top: 1rem; width: 100%;">Set Password & Sign In</button>
                </form>

                <p style="margin-top: 2rem; font-size: 0.8rem; color: #9ca3af;">
                    Staff? Return to the <a href="#dashboard" style="color:#4f46e5;">main login</a>.
                </p>
            </div>
        </div>
     `;
}
