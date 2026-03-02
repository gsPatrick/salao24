import { test, expect } from './fixtures';

test.describe('Inventory & Agenda Modules', () => {

    test.describe('Inventory (Estoque)', () => {
        let productId: string;

        test('should add new product to inventory', async ({ authenticatedApiContext }) => {
            const response = await authenticatedApiContext.post('/api/stock/products', {
                data: {
                    name: 'Shampoo Playwright',
                    barcode: `SKU-${Date.now()}`,
                    price: 45.00,
                    stock_quantity: 10,
                    min_stock_quantity: 5,
                    category: 'Consumíveis'
                },
            });

            const body = await response.json();
            expect(response.ok(), `Add product failed: ${JSON.stringify(body)}`).toBeTruthy();
            productId = body.data.id;
        });

        test('should register stock out (baixa de estoque)', async ({ authenticatedApiContext }) => {
            // Re-use adjust stock endpoint since individual stock-out might not exist
            const response = await authenticatedApiContext.post(`/api/stock/adjust`, {
                data: {
                    productId: productId,
                    type: 'out',
                    quantity: 2,
                    reason: 'Venda Playwright'
                },
            });

            const body = await response.json();
            expect(response.ok(), `Stock adjust failed: ${JSON.stringify(body)}`).toBeTruthy();
            expect(body.data.product.stock_quantity).toBe(8);
        });

        test('should trigger low stock alert', async ({ authenticatedApiContext }) => {
            // Current stock is 8, min is 5. Remove 4 to go below 5.
            await authenticatedApiContext.post(`/api/stock/adjust`, {
                data: {
                    productId: productId,
                    type: 'out',
                    quantity: 4,
                    reason: 'Baixa para Alerta'
                },
            });

            const response = await authenticatedApiContext.get(`/api/stock/products`);
            const body = await response.json();
            expect(response.ok(), `Get products failed: ${JSON.stringify(body)}`).toBeTruthy();

            const product = body.data.find((p: any) => p.id === productId);
            expect(product.stock_quantity).toBeLessThanOrEqual(product.min_stock_quantity);
        });
    });

    test.describe('Agenda (Agendamento)', () => {
        test.describe.configure({ mode: 'serial' });
        let appointmentId: string;
        let profId: string;
        let clientId: string;
        let serviceId: string;

        test.beforeAll(async ({ authenticatedApiContext }) => {
            // Fetch a real professional
            const profResponse = await authenticatedApiContext.get('/api/professionals');
            const profs = (await profResponse.json()).data;
            profId = profs[0]?.id;

            // Fetch a real client
            const clientResponse = await authenticatedApiContext.get('/api/clients');
            const clients = (await clientResponse.json()).data;
            clientId = clients[0]?.id;

            // Fetch a real service
            const serviceResponse = await authenticatedApiContext.get('/api/services');
            const services = (await serviceResponse.json()).data;
            serviceId = services[0]?.id;

            if (!profId || !clientId || !serviceId) {
                throw new Error(`Prerequisites not met: profId=${profId}, clientId=${clientId}, serviceId=${serviceId}. Check if seed data exists.`);
            }
        });

        test('should create a new appointment', async ({ authenticatedApiContext }) => {
            const futureYear = 2030 + Math.floor(Math.random() * 5);
            const randomHour = 8 + Math.floor(Math.random() * 10);
            const dateStr = `${futureYear}-12-25`;
            const timeStr = `${randomHour.toString().padStart(2, '0')}:00`;

            const response = await authenticatedApiContext.post('/api/appointments', {
                data: {
                    client_id: clientId,
                    professional_id: profId,
                    date: dateStr,
                    time: timeStr,
                    service_id: serviceId,
                    status: 'agendado',
                },
            });

            const body = await response.json();
            expect(response.ok(), `Create appointment failed: ${JSON.stringify(body)}`).toBeTruthy();
            appointmentId = body.data.id;
        });

        test('should update appointment status', async ({ authenticatedApiContext }) => {
            expect(appointmentId, "appointmentId should be defined from creation test").toBeDefined();
            const response = await authenticatedApiContext.patch(`/api/appointments/${appointmentId}/status`, {
                data: { status: 'concluido' },
            });

            const body = await response.json();
            expect(response.ok(), `Update appointment failed: ${JSON.stringify(body)}`).toBeTruthy();
            expect(body.data.status).toBe('concluido');
        });

        test('should cancel appointment', async ({ authenticatedApiContext }) => {
            expect(appointmentId, "appointmentId should be defined from creation test").toBeDefined();
            const response = await authenticatedApiContext.patch(`/api/appointments/${appointmentId}/status`, {
                data: { status: 'cancelado' },
            });

            const body = await response.json();
            expect(response.ok(), `Cancel appointment failed: ${JSON.stringify(body)}`).toBeTruthy();
        });
    });
});
