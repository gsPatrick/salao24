
import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';

interface AcquisitionChannelsChartProps {
  clients: any[];
  startDate: Date;
  endDate: Date;
}

const ChartIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
  </svg>
);


const AcquisitionChannelsChart: React.FC<AcquisitionChannelsChartProps> = ({ clients, startDate, endDate }) => {
  const { t } = useLanguage();

  const filteredClients = clients.filter(client => {
    if (!client.registrationDate) return false;
    const registrationDate = new Date(client.registrationDate);

    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    return registrationDate >= start && registrationDate <= end;
  });

  const channelData: { [key: string]: number } = {};
  filteredClients.forEach(client => {
    const channel = client.howTheyFoundUs || 'Outros';
    channelData[channel] = (channelData[channel] || 0) + 1;
  });

  const totalClients = filteredClients.length;

  const chartData = Object.entries(channelData)
    .filter(([, value]) => value > 0)
    .map(([name, count]) => ({
      name,
      count,
      percentage: totalClients > 0 ? (count / totalClients) * 100 : 0,
    }))
    .sort((a, b) => b.count - a.count);

  const colors = ['#10b981', '#34d399', '#6ee7b7', '#a7f3d0', '#059669', '#047857'];
  const radius = 80;
  const circumference = 2 * Math.PI * radius;
  let accumulatedOffset = 0;

  return (
    <div className="bg-white p-6 rounded-2xl shadow-lg h-full">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-secondary flex items-center">
              <span className="text-2xl mr-2">📈</span>
              {t('acquisitionChannelsTitle')}
            </h2>
          </div>
          <p className="text-sm text-gray-500">{t('acquisitionChannelsSubtitle')}</p>
        </div>
      </div>

      {totalClients > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
          {/* Donut Chart */}
          <div className="relative w-48 h-48 sm:w-56 sm:h-56 mx-auto">
            <svg className="w-full h-full" viewBox="0 0 200 200">
              <circle cx="100" cy="100" r={radius} fill="transparent" stroke="#e5e7eb" strokeWidth="25"></circle>
              {chartData.map((segment, index) => {
                const offset = circumference - (accumulatedOffset / 100) * circumference;
                accumulatedOffset += segment.percentage;
                return (
                  <circle
                    key={index}
                    cx="100"
                    cy="100"
                    r={radius}
                    fill="transparent"
                    stroke={colors[index % colors.length]}
                    strokeWidth="25"
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    transform="rotate(-90 100 100)"
                  />
                );
              })}
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="text-3xl font-extrabold text-secondary">{totalClients}</span>
              <span className="text-sm text-gray-500 font-semibold">{t('new')}<br />{t('clients')}</span>
            </div>
          </div>

          {/* Legend */}
          <div className="w-full">
            <ul className="space-y-3">
              {chartData.map((item, index) => (
                <li key={item.name} className="flex items-center text-sm">
                  <span className="w-4 h-4 rounded-full mr-3" style={{ backgroundColor: colors[index % colors.length] }}></span>
                  <span className="font-semibold text-secondary flex-1">{item.name}</span>
                  <span className="text-gray-600 font-medium w-16 text-right">{item.percentage.toFixed(1)}%</span>
                  <span className="text-gray-500 w-12 text-right">({item.count})</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      ) : (
        <div className="flex flex-col justify-center items-center h-48 text-center">
          <ChartIcon />
          <p className="text-gray-600 mt-4 font-semibold">{t('noNewClientsPeriod')}</p>
          <p className="text-sm text-gray-500">{t('adjustDateFilter')}</p>
        </div>
      )}
    </div>
  );
};

export default AcquisitionChannelsChart;
