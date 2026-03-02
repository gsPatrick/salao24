import { test, expect } from './fixtures';

test.describe('Financial Module', () => {
    test.describe.configure({ mode: 'serial' });


    test('should record a revenue (receita)', async ({ authenticatedApiContext }) => {
        const response = await authenticatedApiContext.post('/api/finance/transactions', {
            data: {
                type: 'income',
                amount: 150.00,
                description: 'Venda de Serviço Playwright E2E',
                category: 'Serviços',
                date: new Date().toISOString(),
                status: 'paid',
            },
        });

        const body = await response.json();
        expect(response.ok(), `Financial Transaction creation failed: ${JSON.stringify(body)}`).toBeTruthy();
        const data = body.data;
        expect(data.type).toBe('income');
        expect(Number(data.amount)).toBe(150.00);
    });

    test('should record an expense (despesa)', async ({ authenticatedApiContext }) => {
        const response = await authenticatedApiContext.post('/api/finance/transactions', {
            data: {
                type: 'expense',
                amount: 50.00,
                description: 'Compra de Insumos Playwright E2E',
                category: 'Produtos',
                date: new Date().toISOString(),
                status: 'paid',
            },
        });

        const body = await response.json();
        expect(response.ok(), `Financial Transaction creation failed: ${JSON.stringify(body)}`).toBeTruthy();
        const data = body.data;
        expect(Number(data.amount)).toBe(50.00);
        expect(data.type).toBe('expense');
    });

    test('should handle pending payment', async ({ authenticatedApiContext }) => {
        const response = await authenticatedApiContext.post('/api/finance/transactions', {
            data: {
                type: 'income',
                amount: 200.00,
                description: 'Venda a Prazo',
                status: 'pendente',
                date: new Date().toISOString(),
            },
        });

        const body = await response.json();
        expect(response.ok(), `Pending payment failed: ${JSON.stringify(body)}`).toBeTruthy();
        const data = body.data;
        expect(data.status).toBe('pendente');
    });

    test('should verify calculations (Balance vs Transactions)', async ({ authenticatedApiContext }) => {
        // Get summary/balance
        const summaryResponse = await authenticatedApiContext.get('/api/finance/summary');
        const bodyBefore = await summaryResponse.json();
        expect(summaryResponse.ok(), `Finance summary failed: ${JSON.stringify(bodyBefore)}`).toBeTruthy();
        const beforeSummary = bodyBefore.data;

        const randomAmount = Math.floor(Math.random() * 1000) + 100;

        // Add a revenue
        const createResponse = await authenticatedApiContext.post('/api/finance/transactions', {
            data: {
                description: `Receita Teste E2E ${randomAmount}`,
                type: 'receita',
                amount: randomAmount,
                status: 'pago',
                date: new Date().toISOString().split('T')[0]
            }
        });
        const createBody = await createResponse.json();
        expect(createResponse.ok(), `Create transaction failed: ${JSON.stringify(createBody)}`).toBeTruthy();

        // Get summary again
        const afterResponse = await authenticatedApiContext.get('/api/finance/summary');
        const afterSummary = (await afterResponse.json()).data;

        // Verify balance increased by at least our amount (allowing for concurrent tests if any, 
        // though with serial it should be exact)
        const delta = Number(afterSummary.saldo) - Number(beforeSummary.saldo);
        expect(delta, `Balance should have increased by ${randomAmount}, but changed by ${delta}`).toBe(randomAmount);
    });

    test('should filter by date range', async ({ authenticatedApiContext }) => {
        const today = new Date().toISOString().split('T')[0];
        const response = await authenticatedApiContext.get('/api/finance/transactions', {
            params: {
                startDate: today,
                endDate: today,
            },
        });

        expect(response.ok()).toBeTruthy();
    });
});
