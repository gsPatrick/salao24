
// Report generators that accept data as arguments instead of importing mock data directly.

// Helper
const formatCurrency = (value: number) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export const generateMyAgendaReport = (t: (key: string) => string, appointments: any[], professionals: any[]) => {
    // This previously used hardcoded data. We can try to generate it from appointments.
    // For now, let's keep it somewhat static if we don't have user-specific agenda logic,
    // or better, filter appointments for the "current user" if we had that context here.
    // Since this is a general report function, let's just return a summary of ALL appointments for checking purposes.

    const totalAppts = appointments.length;
    // Calculate estimated revenue based on service price if available, or mock it
    const revenue = appointments.reduce((acc, curr) => acc + (parseFloat(curr.price) || 0), 0);

    return {
        summary: {
            [t('reportSummaryTotalAppointments')]: totalAppts,
            [t('reportSummaryGeneratedRevenue')]: formatCurrency(revenue),
            [t('reportSummaryMostPerformedService')]: 'N/A', // Complex to calculate without more logic
            [t('reportSummaryAverageRating')]: '5.0'
        },
        details: appointments.slice(0, 10).map(appt => ({
            [t('reportHeaderDate')]: appt.date,
            [t('reportHeaderClient')]: appt.clientName || 'Cliente',
            [t('reportHeaderService')]: appt.service,
            [t('reportHeaderValue')]: formatCurrency(parseFloat(appt.price) || 0),
            [t('reportHeaderStatus')]: appt.status
        }))
    };
};

export const generateSchedulingReport = (t: (key: string) => string, appointments: any[]) => {
    const total = appointments.length;
    const canceled = appointments.filter(a => a.status === 'Cancelado').length;
    const noShow = appointments.filter(a => a.status === 'No-show' || a.status === 'no_show').length;
    const completed = appointments.filter(a => a.status === 'Atendido' || a.status === 'completed').length;

    return {
        summary: {
            [t('reportSummaryTotalBookings')]: total,
            [t('reportSummaryOccupancyRate')]: total > 0 ? 'N/A' : '0%', // Requires capacity calculation
            [t('reportSummaryCancellations')]: canceled,
            [t('reportSummaryNoShows')]: noShow,
        },
        details: appointments.slice(0, 50).map(appt => ({
            [t('reportHeaderDate')]: appt.date,
            [t('reportHeaderTime')]: appt.time,
            [t('reportHeaderClient')]: appt.clientName,
            [t('reportHeaderProfessional')]: appt.professionalName,
            [t('reportHeaderService')]: appt.service,
            [t('reportHeaderStatus')]: appt.status
        }))
    };
};

export const generateClientReport = (t: (key: string) => string, clients: any[]) => {
    return {
        summary: {
            [t('reportSummaryTotalClients')]: clients.length,
            [t('reportSummaryNewClientsMonth')]: 0, // Need registration date to calc
            [t('reportSummaryBirthdaysMonth')]: 0, // Need birthdate to calc
            [t('reportSummaryAverageFrequency')]: 'N/A',
        },
        details: clients.map(c => ({
            [t('reportHeaderName')]: c.name,
            [t('reportHeaderLastVisit')]: c.lastVisit ? new Date(c.lastVisit).toLocaleDateString('pt-BR') : 'N/A',
            [t('reportHeaderTotalVisits')]: c.totalVisits || 0,
            [t('reportHeaderHowTheyFoundUs')]: c.howTheyFoundUs || 'N/A',
        }))
    };
};

export const generateCrmReport = (t: (key: string) => string, clients: any[]) => {
    // Mock logic for CRM based on generic client data
    const active = clients.length;
    return {
        summary: {
            [t('reportSummaryActiveClients')]: active,
            [t('reportSummaryInactiveClients')]: 0,
            [t('reportSummaryRetentionRate')]: '100%',
        },
        details: clients.slice(0, 10).map(c => ({
            [t('reportHeaderClient')]: c.name,
            [t('reportHeaderStatus')]: 'Ativo',
            [t('reportHeaderLastVisit')]: c.lastVisit || '--',
            [t('reportHeaderSuggestedAction')]: 'Manter engajamento'
        }))
    };
};

export const generateTimeClockReport = (t: (key: string) => string) => {
    // No real data for time clock yet
    return {
        summary: {
            [t('reportSummaryTotalHoursWorked')]: 0,
            [t('reportSummaryTotalOvertime')]: 0,
            [t('reportSummaryTotalAbsences')]: 0,
            [t('reportSummaryTotalLates')]: 0,
        },
        details: []
    };
};

export const generateFinancialReport = (t: (key: string) => string, transactions: any[]) => {
    const totalReceitas = transactions
        .filter(t => t.type === 'receita')
        .reduce((sum, t) => sum + Number(t.amount), 0);
    const totalDespesas = transactions
        .filter(t => t.type === 'despesa')
        .reduce((sum, t) => sum + Number(t.amount), 0);

    return {
        summary: {
            [t('reportSummaryRevenueRealized')]: totalReceitas,
            [t('reportSummaryExpenseRealized')]: totalDespesas,
            [t('reportSummaryProfitLoss')]: totalReceitas - totalDespesas,
            [t('reportSummaryReceivables')]: 0,
        },
        details: transactions.map(tr => ({
            [t('reportHeaderDate')]: new Date(tr.date).toLocaleDateString('pt-BR'),
            [t('reportHeaderDescription')]: tr.description,
            [t('reportHeaderType')]: tr.type,
            [t('reportHeaderStatus')]: tr.status,
            [t('reportHeaderValue')]: formatCurrency(Number(tr.amount) * (tr.type === 'despesa' ? -1 : 1)),
        }))
    };
};

export const generateContractReport = (t: (key: string) => string, clients: any[]) => {
    // Assuming clients structure has documents/contracts
    return {
        summary: {
            [t('reportSummaryTotalDocuments')]: 0,
            [t('reportSummarySigned')]: 0,
            [t('reportSummaryPending')]: 0,
            [t('reportSummarySignatureRate')]: '0%',
        },
        details: []
    };
};

export const generateReferralReport = (t: (key: string) => string) => {
    return {
        summary: {
            [t('reportSummaryTotalReferrals')]: 0,
            [t('reportSummaryTopReferrer')]: 'N/A',
            [t('reportSummaryConvertedReferrals')]: 0,
        },
        details: []
    };
};

export const generateConversionRateReport = (t: (key: string) => string) => {
    return {
        summary: {
            [t('reportSummaryOverallConversionRate')]: '0%',
            [t('reportSummaryBestConversionChannel')]: 'N/A',
        },
        details: []
    };
};

export const generateSalesReport = (t: (key: string) => string) => {
    return {
        summary: {
            [t('reportSummaryTotalSales')]: 0,
            [t('reportSummaryBestSellingService')]: 'N/A',
            [t('reportSummaryTopPerformingProfessional')]: 'N/A',
            [t('reportSummaryAverageTicket')]: 0
        },
        details: []
    };
};

export const generatePaymentReport = (t: (key: string) => string) => {
    return {
        summary: {
            [t('reportSummaryTotalReceivedOnline')]: 0,
            [t('reportSummaryPixPayments')]: 0,
            [t('reportSummaryCardPayments')]: 0,
            [t('reportSummaryAverageFee')]: '0%'
        },
        details: []
    };
};

export const generateMarketingReport = (t: (key: string) => string) => {
    return {
        summary: {
            [t('reportSummaryTotalInvestment')]: 0,
            [t('reportSummaryNewClientsAcquired')]: 0,
            [t('reportSummaryCostPerClient')]: 0,
            [t('reportSummaryROI')]: '0%'
        },
        details: []
    };
};

export const generateServiceReport = (t: (key: string) => string, appointments: any[], services: any[], clients: any[], professionals: any[]) => {
    const openServices = appointments.filter(a => a.status === 'Agendado' || a.status === 'Em Espera');
    const closedServices = appointments.filter(a => a.status === 'Atendido' || a.status === 'completed');

    const details = [...openServices, ...closedServices].map(appt => {
        // In valid DataContext, we already have names in appointment usually, or we find them.
        // Assuming appointment objects have names or IDs.
        const clientName = appt.clientName || clients.find(c => c.id === appt.clientId)?.name || 'N/A';
        const professionalName = appt.professionalName || professionals.find(p => p.id === appt.professionalId)?.name || 'N/A';
        const serviceName = appt.service || 'N/A';
        const servicePrice = appt.price || services.find(s => s.name === serviceName)?.price || '0';

        return {
            [t('reportHeaderClient')]: clientName,
            [t('reportHeaderProfessional')]: professionalName,
            [t('reportHeaderDate')]: new Date(appt.date).toLocaleDateString('pt-BR'),
            [t('reportHeaderStatus')]: appt.status,
            [t('reportHeaderValue')]: formatCurrency(Number(servicePrice))
        };
    });

    return {
        summary: {
            [t('reportSummaryOpenServices')]: openServices.length,
            [t('reportSummaryClosedServices')]: closedServices.length,
        },
        details
    };
};
