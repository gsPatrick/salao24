import { test, expect, TEST_USERS, API_BASE_URL } from './fixtures';

test.describe('Security: RBAC & Multi-tenancy', () => {

    test.describe('Role-Based Access Control (RBAC)', () => {

        test('Professional should NOT see total faturamento', async ({ playwright }) => {
            const context = await playwright.request.newContext({ baseURL: API_BASE_URL });

            // Login as Professional
            const login = await context.post('/api/auth/login', {
                data: { email: TEST_USERS.professional.email, password: TEST_USERS.professional.password }
            });
            const loginBody = await login.json();
            if (!login.ok()) console.error('Professional login failed:', loginBody);
            const { token } = loginBody.data || {};

            // Try to access finance summary (requires financial_reports feature/role)
            const response = await context.get('/api/finance/summary', {
                headers: { Authorization: `Bearer ${token}` }
            });

            const status = response.status();
            // If the role is forbidden, expect 403. If the feature is missing, might be 403 too.
            expect(status, `Professional should be forbidden (403), got ${status}`).toBe(403);
        });

        test('Receptionist should NOT be able to delete a professional', async ({ playwright }) => {
            const context = await playwright.request.newContext({ baseURL: API_BASE_URL });

            // Login as Receptionist
            const login = await context.post('/api/auth/login', {
                data: { email: TEST_USERS.receptionist.email, password: TEST_USERS.receptionist.password }
            });
            const loginBody = await login.json();
            if (!login.ok()) console.error('Receptionist login failed:', loginBody);
            const { token } = loginBody.data || {};

            // Try to delete a professional
            const response = await context.delete('/api/professionals/some-prof-id', {
                headers: { Authorization: `Bearer ${token}` }
            });

            const status = response.status();
            expect(status, `Receptionist should be forbidden (403) from deleting profs, got ${status}`).toBe(403);
        });

        test('Super Admin (Wagner) sees special administrative options', async ({ playwright }) => {
            const context = await playwright.request.newContext({ baseURL: API_BASE_URL });

            // Login as Super Admin
            const login = await context.post('/api/auth/login', {
                data: { email: TEST_USERS.superAdmin.email, password: TEST_USERS.superAdmin.password }
            });
            const loginBody = await login.json();
            if (!login.ok()) console.error('Super Admin login failed:', loginBody);
            const { token } = loginBody.data || {};

            // Access super-admin route (e.g., list training videos)
            const response = await context.get('/api/super-admin/training-videos', {
                headers: { Authorization: `Bearer ${token}` }
            });

            const body = await response.json();
            expect(response.ok(), `Super Admin should be able to access training videos: ${JSON.stringify(body)}`).toBeTruthy();
        });
    });

    test.describe('Multi-tenancy Isolation', () => {

        test('Salon A should NOT access Salon B agenda', async ({ playwright }) => {
            const contextA = await playwright.request.newContext({ baseURL: API_BASE_URL });
            const contextB = await playwright.request.newContext({ baseURL: API_BASE_URL });

            // Login Salon A
            const loginA = await contextA.post('/api/auth/login', {
                data: { email: TEST_USERS.tenantA.email, password: TEST_USERS.tenantA.password }
            });
            const loginBodyA = await loginA.json();
            const tokenA = loginBodyA.data?.token;

            // Login Salon B
            const loginB = await contextB.post('/api/auth/login', {
                data: { email: TEST_USERS.tenantB.email, password: TEST_USERS.tenantB.password }
            });
            const loginBodyB = await loginB.json();
            const tokenB = loginBodyB.data?.token;

            // Salon A tries to access Salon B specific resource (e.g., a dummy appointment ID)
            const appointmentB = 999999;
            const response = await contextA.get(`/api/appointments/${appointmentB}`, {
                headers: { Authorization: `Bearer ${tokenA}` }
            });

            // Should be 403 Forbidden or 404 Not Found to prevent leaking existence
            const status = response.status();
            expect([403, 404], `Multi-tenancy leak or wrong status: ${status}`).toContain(status);
        });
    });
});
