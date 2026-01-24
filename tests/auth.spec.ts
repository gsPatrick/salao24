import { test, expect, TEST_USERS, API_BASE_URL } from './fixtures';

test.describe('Authentication Module', () => {

    test.describe('Login', () => {
        test('should login successfully with valid credentials', async ({ apiContext }) => {
            const response = await apiContext.post('/api/auth/login', {
                data: {
                    email: TEST_USERS.admin.email,
                    password: TEST_USERS.admin.password,
                },
            });

            expect(response.ok()).toBeTruthy();
            const body = await response.json();
            const data = body.data;
            expect(data.token).toBeDefined();
            expect(data.user).toBeDefined();
            expect(data.user.email).toBe(TEST_USERS.admin.email);
        });

        test('should fail login with invalid password', async ({ apiContext }) => {
            const response = await apiContext.post('/api/auth/login', {
                data: {
                    email: TEST_USERS.admin.email,
                    password: 'wrongpassword',
                },
            });

            expect(response.ok()).toBeFalsy();
            expect(response.status()).toBe(401);
        });

        test('should fail login with non-existent user', async ({ apiContext }) => {
            const response = await apiContext.post('/api/auth/login', {
                data: {
                    email: 'nonexistent@test.com',
                    password: 'anypassword',
                },
            });

            expect(response.ok()).toBeFalsy();
            expect([401, 404]).toContain(response.status());
        });
    });

    test.describe('Logout', () => {
        test('should logout successfully', async ({ apiContext }) => {
            // First login
            const loginResponse = await apiContext.post('/api/auth/login', {
                data: {
                    email: TEST_USERS.admin.email,
                    password: TEST_USERS.admin.password,
                },
            });
            const body = await loginResponse.json();
            const token = body.data?.token;

            // Then logout
            const logoutResponse = await apiContext.post('/api/auth/logout', {
                headers: { Authorization: `Bearer ${token}` },
            });

            // Accept 200 or 204 as success
            expect([200, 204]).toContain(logoutResponse.status());
        });
    });

    test.describe('Session Persistence (F5)', () => {
        test('should maintain session after "refresh" (using stored token)', async ({ apiContext }) => {
            // Login
            const loginResponse = await apiContext.post('/api/auth/login', {
                data: {
                    email: TEST_USERS.admin.email,
                    password: TEST_USERS.admin.password,
                },
            });
            const body = await loginResponse.json();
            const token = body.data?.token;

            // Simulate F5 by making a new request with the token
            const profileResponse = await apiContext.get('/api/auth/me', {
                headers: { Authorization: `Bearer ${token}` },
            });

            expect(profileResponse.ok()).toBeTruthy();
            const profileBody = await profileResponse.json();
            const user = profileBody.data || profileBody; // /api/auth/me might return user directly or inside data
            expect(user.email).toBe(TEST_USERS.admin.email);
        });
    });

    test.describe('Password Recovery', () => {
        test('should send password recovery email for existing user', async ({ apiContext }) => {
            const response = await apiContext.post('/api/auth/forgot-password', {
                data: {
                    email: TEST_USERS.admin.email,
                },
            });

            // Should return success even if email not sent (for security)
            expect([200, 202]).toContain(response.status());
        });

        test('should not reveal if email exists (security)', async ({ apiContext }) => {
            const response = await apiContext.post('/api/auth/forgot-password', {
                data: {
                    email: 'nonexistent-user-12345@test.com',
                },
            });

            // Should return same status as existing user
            expect([200, 202]).toContain(response.status());
        });
    });

    test.describe('Protected Routes', () => {
        test('should reject requests without token', async ({ apiContext }) => {
            const response = await apiContext.get('/api/clients');
            expect([401, 403]).toContain(response.status());
        });

        test('should reject requests with invalid token', async ({ apiContext }) => {
            const response = await apiContext.get('/api/clients', {
                headers: { Authorization: 'Bearer invalid-token-12345' },
            });
            expect([401, 403]).toContain(response.status());
        });
    });
});
