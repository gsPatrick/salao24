import { test as base, expect, APIRequestContext } from '@playwright/test';

// Test user accounts for different roles
export const TEST_USERS = {
    admin: {
        email: 'admin@salao24h.com',
        password: 'admin',
        role: 'admin',
    },
    gerente: {
        email: 'gerente@salao24h.com',
        password: '123',
        role: 'gerente',
    },
    receptionist: {
        email: 'concierge@salao24h.com',
        password: '123',
        role: 'recepcao',
    },
    superAdmin: {
        email: 'admin@salao24h.com',
        password: 'admin',
        role: 'admin',
        name: 'Wagner',
    },
    professional: {
        email: 'fernanda@salao24h.com',
        password: '123',
        role: 'profissional',
    },
    // Different tenants for multi-tenancy tests
    tenantA: {
        email: 'fernanda@salao24h.com',
        password: '123',
        tenantId: 'tenant-a-id',
    },
    tenantB: {
        email: 'maria@salao24h.com',
        password: '123',
        tenantId: 'tenant-b-id',
    },
};

// API Base URL
export const API_BASE_URL = 'https://salao-api.rdwhjt.easypanel.host';

// Extended test fixture with API context
type TestFixtures = {
    apiContext: APIRequestContext;
    authenticatedApiContext: APIRequestContext;
};

export const test = base.extend<TestFixtures>({
    apiContext: async ({ playwright }, use) => {
        const context = await playwright.request.newContext({
            baseURL: API_BASE_URL,
        });
        await use(context);
        await context.dispose();
    },
    authenticatedApiContext: async ({ playwright }, use) => {
        const context = await playwright.request.newContext({
            baseURL: API_BASE_URL,
            extraHTTPHeaders: {
                'Content-Type': 'application/json',
            },
        });
        // Login to get token
        const response = await context.post('/api/auth/login', {
            data: {
                email: TEST_USERS.gerente.email,
                password: TEST_USERS.gerente.password,
            },
        });
        if (response.ok()) {
            const body = await response.json();
            const token = body.data?.token;
            await context.dispose();
            // Create new context with auth header
            const authContext = await playwright.request.newContext({
                baseURL: API_BASE_URL,
                extraHTTPHeaders: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
            });
            await use(authContext);
            await authContext.dispose();
        } else {
            await use(context);
            await context.dispose();
        }
    },
});

export { expect };

// Helper function to login via API
export async function loginViaApi(
    apiContext: APIRequestContext,
    email: string,
    password: string
): Promise<{ token: string; user: any }> {
    const response = await apiContext.post('/api/auth/login', {
        data: { email, password },
    });
    expect(response.ok()).toBeTruthy();
    const body = await response.json();
    return body.data;
}

// Helper to create random data
export function generateRandomEmail(): string {
    return `test-${Date.now()}-${Math.random().toString(36).substring(7)}@test.com`;
}

export function generateRandomPhone(): string {
    return `5581${Math.floor(900000000 + Math.random() * 99999999)}`;
}
