import { test, expect, generateRandomEmail, generateRandomPhone } from './fixtures';

test.describe('People Management Module (CRUD)', () => {

    test.describe('Clients (Clientes)', () => {
        let clientId: string;
        const clientEmail = generateRandomEmail();

        test('should create a new client', async ({ authenticatedApiContext }) => {
            const response = await authenticatedApiContext.post('/api/clients', {
                data: {
                    name: 'Cliente Teste Playwright',
                    email: clientEmail,
                    phone: generateRandomPhone(),
                    document: '12345678901',
                },
            });

            const body = await response.json();
            expect(response.ok(), `Create client failed: ${JSON.stringify(body)}`).toBeTruthy();
            const data = body.data;
            expect(data.name).toBe('Cliente Teste Playwright');
            clientId = data.id;
        });

        test('should list clients and find the created one', async ({ authenticatedApiContext }) => {
            const response = await authenticatedApiContext.get('/api/clients');
            const body = await response.json();
            expect(response.ok(), `List clients failed: ${JSON.stringify(body)}`).toBeTruthy();

            const clients = body.data;
            const found = clients.find((c: any) => c.email === clientEmail);
            expect(found, `Client with email ${clientEmail} not found in list`).toBeDefined();
        });

        test('should update a client', async ({ authenticatedApiContext }) => {
            const response = await authenticatedApiContext.put(`/api/clients/${clientId}`, {
                data: {
                    name: 'Cliente Teste Playwright Atualizado',
                },
            });

            const body = await response.json();
            expect(response.ok(), `Update client failed: ${JSON.stringify(body)}`).toBeTruthy();
            const data = body.data;
            expect(data.name).toBe('Cliente Teste Playwright Atualizado');
        });

        test('should delete a client', async ({ authenticatedApiContext }) => {
            const response = await authenticatedApiContext.delete(`/api/clients/${clientId}`);
            const body = await response.json();
            expect([200, 204], `Delete client failed: ${JSON.stringify(body)}`).toContain(response.status());

            // Note: Since it's a soft delete (status inactive), getById might still return it 
            // depending on implementation. Standard says 404 is expected for "deleted" items.
            // But let's verify if the status is inactive if we can.
            const checkResponse = await authenticatedApiContext.get(`/api/clients/${clientId}`);
            if (checkResponse.ok()) {
                const checkBody = await checkResponse.json();
                expect(checkBody.data.status).toBe('inactive');
            } else {
                expect(checkResponse.status()).toBe(404);
            }
        });
    });

    test.describe('Professionals (Profissionais)', () => {
        let profId: string;
        const profEmail = generateRandomEmail();

        test('should create a new professional', async ({ authenticatedApiContext }) => {
            const response = await authenticatedApiContext.post('/api/professionals', {
                data: {
                    name: 'Profissional Teste',
                    email: profEmail,
                    phone: generateRandomPhone(),
                    specialty: 'Cabelereiro',
                    commission: 30,
                },
            });

            const body = await response.json();
            expect(response.ok(), `Create professional failed: ${JSON.stringify(body)}`).toBeTruthy();
            profId = body.data.id;
        });

        test('should search and filter professionals', async ({ authenticatedApiContext }) => {
            const response = await authenticatedApiContext.get('/api/professionals', {
                params: { search: 'Profissional Teste' }
            });
            const body = await response.json();
            expect(response.ok(), `Search professionals failed: ${JSON.stringify(body)}`).toBeTruthy();
            const profs = body.data;
            expect(profs.length).toBeGreaterThan(0);
        });

        test('should delete a professional', async ({ authenticatedApiContext }) => {
            const response = await authenticatedApiContext.delete(`/api/professionals/${profId}`);
            const body = await response.json();
            expect([200, 204], `Delete professional failed: ${JSON.stringify(body)}`).toContain(response.status());

            // Verify soft-delete
            const checkResponse = await authenticatedApiContext.get(`/api/professionals/${profId}`);
            if (checkResponse.ok()) {
                const checkBody = await checkResponse.json();
                expect(checkBody.data.is_archived).toBeTruthy();
            } else {
                expect(checkResponse.status()).toBe(404);
            }
        });
    });

    test.describe('Users (Usuários)', () => {
        let userId: string;
        const userEmail = generateRandomEmail();

        test('should create a new user', async ({ authenticatedApiContext }) => {
            const response = await authenticatedApiContext.post('/api/users', {
                data: {
                    name: 'Usuario Sistema',
                    email: userEmail,
                    password: 'password123',
                    role: 'recepcao',
                },
            });

            const body = await response.json();
            expect(response.ok(), `Create user failed: ${JSON.stringify(body)}`).toBeTruthy();
            userId = body.data.id;
        });

        test('should update user permissions', async ({ authenticatedApiContext }) => {
            const response = await authenticatedApiContext.put(`/api/users/${userId}`, {
                data: {
                    role: 'admin',
                },
            });

            const body = await response.json();
            expect(response.ok(), `Update user failed: ${JSON.stringify(body)}`).toBeTruthy();
            expect(body.data.role).toBe('admin');
        });
    });
});
