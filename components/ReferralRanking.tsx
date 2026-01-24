import React, { useMemo, useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';

// Client interface - data comes via props from parent component
interface Client {
  id: number;
  name: string;
  photo: string;
  indicatedBy?: string;
  history: any[];
  [key: string]: any;
}

interface ReferralRankingProps {
  clients: Client[];
}

interface ReferrerStats {
  referrerId: number;
  referrerName: string;
  referrerPhoto: string;
  referrals: {
    indicatedClientName: string;
    indicatedClientId: number;
    converted: boolean;
  }[];
  totalReferrals: number;
  totalConversions: number;
}

// FIX: Changed to a named export to resolve module resolution errors.
export const ReferralRanking: React.FC<ReferralRankingProps> = ({ clients }) => {
  const { t } = useLanguage();
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const birthdayProfessionals = [
    // Dados fictícios removidos - lista vazia para Painel de Controle
  ];

  const ranking = useMemo(() => {
    const referrers: { [key: string]: ReferrerStats } = {};

    clients.forEach(indicatedClient => {
      if (indicatedClient.indicatedBy) {
        const referrerClient = clients.find(c => c.name === indicatedClient.indicatedBy);

        if (referrerClient) {
          if (!referrers[referrerClient.name]) {
            referrers[referrerClient.name] = {
              referrerId: referrerClient.id,
              referrerName: referrerClient.name,
              referrerPhoto: referrerClient.photo,
              referrals: [],
              totalReferrals: 0,
              totalConversions: 0,
            };
          }

          const converted = indicatedClient.history.length > 0;

          referrers[referrerClient.name].referrals.push({
            indicatedClientName: indicatedClient.name,
            indicatedClientId: indicatedClient.id,
            converted,
          });

          referrers[referrerClient.name].totalReferrals++;
          if (converted) {
            referrers[referrerClient.name].totalConversions++;
          }
        }
      }
    });

    return Object.values(referrers)
      .sort((a, b) => {
        if (b.totalConversions !== a.totalConversions) {
          return b.totalConversions - a.totalConversions;
        }
        return b.totalReferrals - a.totalReferrals;
      })
      .slice(0, 10);
  }, [clients]);

  const medals = ['🥇', '🥈', '🥉'];

  const toggleExpand = (id: number) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <div className="bg-white p-6 rounded-2xl shadow-lg h-full space-y-6">
      <div>
        <h2 className="text-xl font-bold text-secondary mb-4 flex items-center">
          <span className="text-2xl mr-2">🏆</span>
          {t('referralRankingTitle')}
        </h2>
        {ranking.length > 0 ? (
          <ol className="space-y-4">
            {ranking.map((referrer, index) => (
              <li key={referrer.referrerId} className="bg-light p-3 rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center justify-center w-8 text-lg font-bold text-gray-500">
                    {index < 3 ? (
                      <span className="text-2xl">{medals[index]}</span>
                    ) : (
                      <span>{index + 1}.</span>
                    )}
                  </div>
                  <img src={referrer.referrerPhoto} alt={referrer.referrerName} className="w-12 h-12 rounded-full" />
                  <div className="flex-1">
                    <p className="font-bold text-gray-800">{referrer.referrerName}</p>
                    <p className="text-sm text-primary font-semibold">
                      {t('referralRankingStats', { conversions: referrer.totalConversions, referrals: referrer.totalReferrals })}
                    </p>
                  </div>
                  <button
                    onClick={() => toggleExpand(referrer.referrerId)}
                    className="text-sm font-semibold text-primary hover:underline"
                  >
                    {expandedId === referrer.referrerId ? t('referralRankingHide') : t('referralRankingDetails')}
                  </button>
                </div>
                {expandedId === referrer.referrerId && (
                  <div className="mt-3 pl-14 animate-fade-in">
                    <h4 className="text-sm font-semibold text-gray-600 mb-2">{t('referralRankingReferredClients')}:</h4>
                    <ul className="space-y-1 text-sm">
                      {referrer.referrals.map(ref => (
                        <li key={ref.indicatedClientId} className="flex items-center text-gray-700">
                          {ref.converted ? (
                            <span className="text-green-500 mr-2" title={t('referralRankingConverted')}>✅</span>
                          ) : (
                            <span className="text-yellow-500 mr-2" title={t('referralRankingNotConverted')}>⏳</span>
                          )}
                          {ref.indicatedClientName}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </li>
            ))}
          </ol>
        ) : (
          <p className="text-gray-500 text-center pt-8">{t('noReferralData')}</p>
        )}
      </div>

      <div className="border-t border-gray-200 pt-4">
        <h3 className="text-lg font-bold text-secondary mb-1 flex items-center">
          <span className="text-xl mr-2">🎂</span>
          {t('referralBirthdaysTitle')}
        </h3>
        <p className="text-sm text-gray-600 mb-4">{t('referralBirthdaysSubtitle')}</p>
        <ul className="space-y-3">
          {birthdayProfessionals.map(pro => (
            <li key={pro.id} className="flex items-center justify-between bg-light p-3 rounded-lg">
              <div className="flex items-center gap-3">
                <img
                  src={pro.photo}
                  alt={pro.name}
                  className="w-10 h-10 rounded-full object-cover"
                />
                <div>
                  <p className="font-semibold text-gray-800">{pro.name}</p>
                  <p className="text-xs text-gray-500">{pro.role}</p>
                </div>
              </div>
              <span className="text-sm font-semibold text-primary">
                {pro.birthday}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};