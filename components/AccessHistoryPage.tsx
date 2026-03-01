import React, { useState, useMemo } from 'react';
import { useLanguage } from '../contexts/LanguageContext';

declare var jspdf: any;

// Icons for different actions
const LoginIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" /></svg>;
const AddIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>;
const DeleteIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>;
const DownloadIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M12 12v9m-4-4l4 4 4-4" /></svg>;
const EraserIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>;
const InfoIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;

interface AccessHistoryPageProps {
  logs: any[];
  users: any[];
  loading?: boolean;
}

const AccessHistoryPage: React.FC<AccessHistoryPageProps> = ({ logs, users, loading }) => {
  const { t } = useLanguage();
  const [userFilter, setUserFilter] = useState('todos');
  const [actionFilter, setActionFilter] = useState('todas');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const actionIcons: { [key: string]: { icon: React.ReactNode, color: string, label: string } } = {
    login: { icon: <LoginIcon />, color: 'bg-blue-100 text-blue-600', label: t('historyActionLogin') },
    agendamento: { icon: <AddIcon />, color: 'bg-green-100 text-green-600', label: t('historyActionScheduling') },
    exclusao: { icon: <DeleteIcon />, color: 'bg-red-100 text-red-600', label: t('historyActionDelete') },
    download: { icon: <DownloadIcon />, color: 'bg-purple-100 text-purple-600', label: t('historyActionDownload') },
    cadastro: { icon: <AddIcon />, color: 'bg-green-100 text-green-600', label: 'Cadastro' },
    edicao: { icon: <AddIcon />, color: 'bg-blue-100 text-blue-600', label: 'Edição' },
    ajuste_estoque: { icon: <AddIcon />, color: 'bg-yellow-100 text-yellow-600', label: 'Ajuste de Estoque' },
    registroPonto: { icon: <LoginIcon />, color: 'bg-cyan-100 text-cyan-600', label: 'Registro de Ponto' },
    logout: { icon: <LoginIcon />, color: 'bg-orange-100 text-orange-600', label: 'Logout' },
    default: { icon: '?', color: 'bg-gray-100 text-gray-600', label: t('historyActionOther') },
  };

  const getActionInfo = (action: string) => actionIcons[action] || actionIcons.default;
  const allActionTypes = [...new Set(Object.values(actionIcons).map(a => a.label))];

  const getUserName = (userId: number) => {
    return users.find(u => u.id === userId)?.name || t('historyUserUnknown');
  };

  const clearFilters = () => {
    setUserFilter('todos');
    setActionFilter('todas');
    setStartDate('');
    setEndDate('');
  };

  const filteredLogs = useMemo(() => {
    return logs
      .filter(log => {
        if (userFilter !== 'todos' && String(log.userId) !== userFilter) {
          return false;
        }
        if (actionFilter !== 'todas' && getActionInfo(log.action).label !== actionFilter) {
          return false;
        }

        // Fix Date Filtering logic with proper boundaries
        const logDate = new Date(log.timestamp);
        if (startDate) {
          const start = new Date(startDate + 'T00:00:00');
          if (logDate < start) return false;
        }
        if (endDate) {
          const end = new Date(endDate + 'T23:59:59');
          if (logDate > end) return false;
        }
        return true;
      })
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [logs, userFilter, actionFilter, startDate, endDate]);

  const handleDownload = () => {
    if (filteredLogs.length === 0) {
      alert(t('noLogsToDownload'));
      return;
    }

    const { jsPDF } = jspdf;
    const doc = new jsPDF();

    const tableColumns = [t('historyHeaderDate'), t('historyHeaderUser'), t('historyHeaderAction'), t('historyHeaderDetails')];
    const tableRows: string[][] = [];

    filteredLogs.forEach(log => {
      const actionInfo = getActionInfo(log.action);
      const formattedDate = new Date(log.timestamp).toLocaleString('pt-BR');
      const userName = getUserName(log.userId);

      const logData = [
        formattedDate,
        userName,
        actionInfo.label,
        log.details.replace(/\n/g, ' '),
      ];
      tableRows.push(logData);
    });

    doc.setFontSize(18);
    doc.text('Histórico de Acesso', 14, 22);

    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, 14, 30);

    (doc as any).autoTable({
      startY: 35,
      head: [tableColumns],
      body: tableRows,
      theme: 'striped',
      headStyles: { fillColor: [16, 185, 129] }, // Cor primária do Salão24h
    });

    const dateStr = new Date().toISOString().split('T')[0];
    doc.save(`historico_acesso_${dateStr}.pdf`);
  };

  return (
    <div className="mt-6">
      <div className="bg-light p-4 rounded-lg mb-6">
        <div className="flex flex-col sm:flex-row justify-between items-end gap-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 w-full flex-grow">
            <div>
              <label htmlFor="userFilter" className="block text-sm font-medium text-gray-700 font-inter">{t('historyFilterUser')}</label>
              <select id="userFilter" value={userFilter} onChange={e => setUserFilter(e.target.value)} className="mt-1 block w-full pl-3 pr-10 py-2 border-gray-300 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md shadow-sm">
                <option value="todos">{t('historyAllUsers')}</option>
                {users.map(user => (
                  <option key={user.id} value={user.id}>{user.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="actionFilter" className="block text-sm font-medium text-gray-700 font-inter">{t('historyFilterAction')}</label>
              <select id="actionFilter" value={actionFilter} onChange={e => setActionFilter(e.target.value)} className="mt-1 block w-full pl-3 pr-10 py-2 border-gray-300 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md shadow-sm">
                <option value="todas">{t('historyAllActions')}</option>
                {allActionTypes.map(action => (
                  <option key={action} value={action}>{action}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 font-inter">{t('historyLabelStartDate')}</label>
              <input type="date" id="startDate" value={startDate} onChange={e => setStartDate(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm" />
            </div>
            <div>
              <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 font-inter">{t('historyLabelEndDate')}</label>
              <input type="date" id="endDate" value={endDate} onChange={e => setEndDate(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm" />
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={clearFilters}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-gray-600 bg-white hover:bg-gray-50 flex items-center justify-center transition-all duration-200 text-sm font-medium h-10"
              title="Limpar Filtros"
            >
              <EraserIcon />
              <span className="ml-2 hidden lg:inline">Limpar</span>
            </button>
            <button
              onClick={handleDownload}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-white bg-primary hover:bg-primary-dark flex items-center justify-center transition-all duration-200 h-10"
              title={t('downloadHistory')}
              aria-label={t('downloadHistory')}
            >
              <DownloadIcon />
            </button>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {loading ? (
          <div className="flex justify-center py-10">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : filteredLogs.length > 0 ? (
          filteredLogs.map(log => {
            const actionInfo = getActionInfo(log.action);
            const formattedDate = new Date(log.timestamp).toLocaleString('pt-BR', {
              day: '2-digit', month: '2-digit', year: 'numeric',
              hour: '2-digit', minute: '2-digit'
            });

            return (
              <div key={log.id} className="flex items-start space-x-4 p-4 bg-white rounded-xl shadow-sm border border-gray-100 hover:border-primary/40 transition-all duration-300 group">
                <span className={`flex-shrink-0 flex items-center justify-center h-10 w-10 rounded-full ${actionInfo.color} transition-transform group-hover:scale-110`}>
                  {actionInfo.icon}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start">
                    <p className="text-sm text-gray-800 leading-tight">
                      <span className="font-bold text-secondary">{log.userName || getUserName(log.userId)}</span> {log.details}
                    </p>
                    <span className="text-[10px] bg-gray-50 px-2 py-1 rounded-full text-gray-500 uppercase font-semibold tracking-wider border border-gray-100 flex-shrink-0 ml-2">
                      {actionInfo.label}
                    </span>
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center gap-3">
                      <p className="text-xs text-gray-400 flex items-center">
                        <svg className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor font-inter"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        {formattedDate}
                      </p>
                    </div>
                    {(log.ip || log.userAgent) && (
                      <button
                        className="text-gray-400 hover:text-primary transition-colors p-1"
                        title={`IP: ${log.ip || 'N/A'}\nDispositivo: ${log.userAgent || 'N/A'}`}
                      >
                        <InfoIcon />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center py-16 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
            <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            <p className="text-gray-500 font-medium">{t('historyNoLogs')}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AccessHistoryPage;