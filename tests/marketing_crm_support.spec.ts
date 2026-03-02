import { test, expect } from './fixtures';

test.describe('Marketing, CRM & Support Modules', () => {

    test.describe('Marketing & CRM', () => {
        test('should create a marketing campaign', async ({ authenticatedApiContext }) => {
            const response = await authenticatedApiContext.post('/api/marketing/campaigns', {
                data: {
                    name: 'Promoção Verão',
                    type: 'whatsapp',
                    message: 'Confira nossas ofertas!',
                    targets: ['leads', 'clients'],
                },
            });

            const body = await response.json();
            expect(response.ok(), `Marketing campaign creation failed: ${JSON.stringify(body)}`).toBeTruthy();
        });

        test('should move lead in Kanban', async ({ authenticatedApiContext }) => {
            // Use ID 1 as seeded
            const response = await authenticatedApiContext.patch('/api/crm/leads/1/stage', {
                data: { stageId: 'closed-won' },
            });

            const body = await response.json();
            expect(response.ok(), `Lead move failed: ${JSON.stringify(body)}`).toBeTruthy();
        });

        test('should register acquisition channel', async ({ authenticatedApiContext }) => {
            const response = await authenticatedApiContext.post('/api/marketing/channels', {
                data: { name: 'Instagram Ads', cost: 100 },
            });

            const body = await response.json();
            expect(response.ok(), `Acquisition channel registration failed: ${JSON.stringify(body)}`).toBeTruthy();
        });
    });

    test.describe('TimeClock (Ponto)', () => {
        test('should register entry and exit', async ({ authenticatedApiContext }) => {
            // Punch In (Assume professionalId 1 is Wagner)
            const punchIn = await authenticatedApiContext.post('/api/time-clock/punch', {
                data: { type: 'in', professionalId: 1, time: '08:00' },
            });
            const bodyPunchIn = await punchIn.json();
            expect(punchIn.ok(), `Punch In failed: ${JSON.stringify(bodyPunchIn)}`).toBeTruthy();

            // Punch Out
            const punchOut = await authenticatedApiContext.post('/api/time-clock/punch', {
                data: { type: 'out', professionalId: 1, time: '18:00' },
            });
            const bodyPunchOut = await punchOut.json();
            expect(punchOut.ok(), `Punch Out failed: ${JSON.stringify(bodyPunchOut)}`).toBeTruthy();
        });

        test('should register absence justification', async ({ authenticatedApiContext }) => {
            // First punch to have a record
            const punch = await authenticatedApiContext.post('/api/time-clock/punch', {
                data: { type: 'in', professionalId: 1, time: '09:00' },
            });
            const punchBody = await punch.json();
            const recordId = punchBody.id;

            const response = await authenticatedApiContext.post('/api/time-clock/justify', {
                data: {
                    recordId: recordId,
                    type: 'absence',
                    reason: 'Atestado Médico',
                    attachment: 'http://bucket.com/atestado.pdf',
                },
            });
            const body = await response.json();
            expect(response.ok(), `Justification failed: ${JSON.stringify(body)}`).toBeTruthy();
        });
    });

    test.describe('Support', () => {
        test('should open a support ticket', async ({ authenticatedApiContext }) => {
            const response = await authenticatedApiContext.post('/api/support', {
                data: {
                    subject: 'Erro ao emitir relatório',
                    message: 'Não consigo baixar o PDF de faturamento mensal',
                    department: 'Financeiro',
                    priority: 'Alta',
                },
            });

            const body = await response.json();
            expect(response.ok(), `Support ticket creation failed: ${JSON.stringify(body)}`).toBeTruthy();
            const data = body.data;
            expect(data.status).toBe('Em Aberto');
        });
    });
});
