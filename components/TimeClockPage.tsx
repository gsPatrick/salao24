

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { timeClockAPI, professionalsAPI } from '../lib/api'; // Import API



// --- Interfaces ---
interface User {
    name: string;
    email: string;
    avatarUrl: string;
    role?: 'admin' | 'gerente' | 'concierge' | 'profissional';
}

interface TimeClockPageProps {
    onBack?: () => void;
    currentUser: User | null;
    professional: any | null;
    isIndividualPlan?: boolean;
}

interface LogEntry {
    time: string;
    action: string;
    photo?: string;
    observation?: string;
}

interface Punch {
    time: string;
    type: 'entrada' | 'saida_pausa' | 'retorno_pausa' | 'saida';
    photo?: string;
}

interface HistoryLog {
    id?: number; // Add ID for approvals
    professionalId: number;
    date: string; // YYYY-MM-DD
    punches: Punch[];
    justification?: {
        reason: string;
        file?: string;
        status?: 'pending' | 'approved' | 'rejected';
    };
    overtimeJustification?: {
        justification: string;
        status: 'pending' | 'approved' | 'rejected';
    };
}


// --- Icons ---
const ClockInIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" /></svg>;
const ClockOutIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" /></svg>;
const CoffeeIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const ReturnIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;

// --- Geolocation ---
const COMPANY_LOCATION = { latitude: -8.1182, longitude: -34.9034 }; // Exemplo: Boa Viagem, Recife
const ALLOWED_RADIUS_METERS = 200;

// Haversine formula to calculate distance
function getDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
    const R = 6371e3; // metres
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
        Math.cos(φ1) * Math.cos(φ2) *
        Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // in metres
}

const OvertimeJustificationModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onSave: (date: string, justification: string) => void;
    data: { log: HistoryLog; balance: number } | null;
    t: (key: string, options?: any) => string;
    minutesToHoursString: (minutes: number) => string;
}> = ({ isOpen, onClose, onSave, data, t, minutesToHoursString }) => {
    const [justification, setJustification] = useState('');
    const [isExiting, setIsExiting] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setJustification('');
        }
    }, [isOpen]);

    const handleClose = () => {
        setIsExiting(true);
        setTimeout(() => {
            onClose();
            setIsExiting(false);
        }, 300);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (data?.log && justification.trim()) {
            onSave(data.log.date, justification.trim());
        }
    };

    if (!isOpen && !isExiting) return null;
    if (!data) return null;

    const animationClass = isOpen && !isExiting ? 'animate-bounce-in' : 'opacity-0 scale-95';
    const formattedDate = new Date(data.log.date + 'T00:00:00').toLocaleDateString('pt-BR');

    return (
        <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-opacity duration-300 ${isOpen ? 'opacity-100 bg-gray-500 bg-opacity-75' : 'opacity-0'}`} onClick={handleClose}>
            <div className={`bg-white rounded-lg shadow-xl transform transition-all max-w-lg w-full ${animationClass}`} onClick={e => e.stopPropagation()}>
                <form onSubmit={handleSubmit}>
                    <div className="p-6">
                        <h3 className="text-xl font-bold text-secondary">{t('overtimeJustificationTitle')}</h3>
                        <p className="text-sm text-gray-500 mt-2 mb-4">
                            {t('overtimeJustificationFor', { overtime: minutesToHoursString(data.balance), date: formattedDate })}
                        </p>
                        <div className="space-y-4">
                            <div>
                                <label htmlFor="overtime-justification" className="block text-sm font-medium text-gray-700">{t('justificationLabel')}</label>
                                <textarea
                                    id="overtime-justification"
                                    value={justification}
                                    onChange={e => setJustification(e.target.value)}
                                    required
                                    rows={4}
                                    placeholder={t('justificationPlaceholder')}
                                    className="mt-1 w-full p-2 border border-gray-300 rounded-md shadow-sm"
                                    autoFocus
                                />
                            </div>
                        </div>
                    </div>
                    <div className="bg-gray-50 px-6 py-3 flex flex-row-reverse rounded-b-lg">
                        <button type="submit" className="px-4 py-2 bg-primary text-white rounded-md">{t('save')}</button>
                        <button type="button" onClick={handleClose} className="px-4 py-2 bg-white text-gray-700 border rounded-md mr-2">{t('cancel')}</button>
                    </div>
                </form>
            </div>
        </div>
    );
};


const TimeClockPage: React.FC<TimeClockPageProps> = ({ onBack, currentUser, professional, isIndividualPlan }) => {
    const { t } = useLanguage();
    const [status, setStatus] = useState<'not_clocked_in' | 'clocked_in' | 'on_break' | 'clocked_out'>('not_clocked_in');
    const [log, setLog] = useState<LogEntry[]>([]);
    const [confirmation, setConfirmation] = useState<string | null>(null);
    const [showObservation, setShowObservation] = useState(false);
    const [observationText, setObservationText] = useState('');
    const [showCamera, setShowCamera] = useState(false);
    const [nextAction, setNextAction] = useState<((photo: string) => void) | null>(null);

    const [isLoadingLocation, setIsLoadingLocation] = useState(false);
    const [locationError, setLocationError] = useState<string | null>(null);
    const [isJustificationOpen, setIsJustificationOpen] = useState(false);
    const [justificationDate, setJustificationDate] = useState(new Date().toISOString().split('T')[0]);
    const [justificationReason, setJustificationReason] = useState('');
    const [justificationFile, setJustificationFile] = useState<File | null>(null);

    const [allHistory, setAllHistory] = useState<HistoryLog[]>([]); // Initialize empty, fetch later
    const [professionalsList, setProfessionalsList] = useState<any[]>([]);

    const [isOvertimeModalOpen, setIsOvertimeModalOpen] = useState(false);
    const [logToJustify, setLogToJustify] = useState<{ log: HistoryLog; balance: number } | null>(null);
    const [viewPhoto, setViewPhoto] = useState<string | null>(null);

    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const isManager = currentUser?.role === 'admin' || currentUser?.role === 'Gerente' || currentUser?.role === 'gerente' || currentUser?.role === 'Administrador';
    const [activeTab, setActiveTab] = useState('myPunches');
    const [selectedProfessionalId, setSelectedProfessionalId] = useState<string>(professional?.id.toString() || '');

    // Fetch History
    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const history = await timeClockAPI.getHistory({ professionalId: isManager && activeTab === 'teamManagement' ? selectedProfessionalId : undefined });
                // We need to map the backend response to HistoryLog format if it differs slightly
                // Assuming backend returns array of TimeRecord which matches structure roughly
                // Map backend time_record to HistoryLog
                const mappedHistory: HistoryLog[] = history.map((record: any) => ({
                    id: record.id,
                    professionalId: record.professional_id,
                    date: record.date,
                    punches: record.punches || [],
                    justification: record.justification,
                    overtimeJustification: record.overtime_justification,
                }));
                setAllHistory(mappedHistory);

                if (isManager) {
                    const pros = await professionalsAPI.list();
                    setProfessionalsList(Array.isArray(pros) ? pros : (pros.data || [])); // Ensure array
                }
            } catch (error) {
                console.error('Error fetching data:', error);
            }
        };

        if (professional || isManager) {
            fetchHistory();
        }
    }, [professional, isManager, activeTab, selectedProfessionalId]);


    const timeStringToMinutes = (time: string) => {
        const [hours, minutes] = time.split(':').map(Number);
        return hours * 60 + minutes;
    };

    const minutesToHoursString = useCallback((totalMinutes: number, showSign: boolean = true) => {
        if (totalMinutes === 0 && !showSign) return `0${t('hoursShort')} 00${t('minutesShort')}`;
        const sign = totalMinutes >= 0 ? '+' : '-';
        const absMinutes = Math.abs(totalMinutes);
        const hours = Math.floor(absMinutes / 60);
        const minutes = absMinutes % 60;

        if (showSign) {
            return `${sign}${hours}${t('hoursShort')} ${minutes.toString().padStart(2, '0')}${t('minutesShort')}`;
        }
        return `${hours}${t('hoursShort')} ${minutes.toString().padStart(2, '0')}${t('minutesShort')}`;
    }, [t]);

    const calculateTimeBalance = useCallback((historyLogs: HistoryLog[]) => {
        const STANDARD_WORK_MINUTES = 8 * 60;
        let totalBalance = 0;

        historyLogs.forEach(dayLog => {
            if (dayLog.punches && dayLog.punches.length >= 4) {
                const entrada = dayLog.punches.find(p => p.type === 'entrada');
                const saidaPausa = dayLog.punches.find(p => p.type === 'saida_pausa');
                const retornoPausa = dayLog.punches.find(p => p.type === 'retorno_pausa');
                const saida = dayLog.punches.find(p => p.type === 'saida');

                if (entrada && saidaPausa && retornoPausa && saida) {
                    const morningMinutes = timeStringToMinutes(saidaPausa.time) - timeStringToMinutes(entrada.time);
                    const afternoonMinutes = timeStringToMinutes(saida.time) - timeStringToMinutes(retornoPausa.time);
                    const workedMinutes = morningMinutes + afternoonMinutes;
                    totalBalance += workedMinutes - STANDARD_WORK_MINUTES;
                }
            }
        });
        return totalBalance;
    }, []);

    const userHistory = useMemo(() => {
        if (!professional) return [];
        return allHistory.filter(log => log.professionalId === professional.id);
    }, [allHistory, professional]);
    const userTimeBalance = useMemo(() => calculateTimeBalance(userHistory), [userHistory, calculateTimeBalance]);

    // Determine status from last punch of today
    useEffect(() => {
        const todayStr = new Date().toISOString().split('T')[0];
        const todayLog = userHistory.find(h => h.date === todayStr);

        if (todayLog && todayLog.punches.length > 0) {
            const lastPunch = todayLog.punches[todayLog.punches.length - 1];
            if (lastPunch.type === 'entrada') setStatus('clocked_in');
            else if (lastPunch.type === 'saida_pausa') setStatus('on_break');
            else if (lastPunch.type === 'retorno_pausa') setStatus('clocked_in');
            else if (lastPunch.type === 'saida') setStatus('clocked_out');
        } else {
            setStatus('not_clocked_in');
        }
    }, [userHistory]);


    const selectedProfessionalHistory = useMemo(() => {
        if (!selectedProfessionalId) return [];
        return allHistory.filter(log => log.professionalId.toString() === selectedProfessionalId);
    }, [allHistory, selectedProfessionalId]);

    const selectedProfessionalTimeBalance = useMemo(() => calculateTimeBalance(selectedProfessionalHistory), [selectedProfessionalHistory, calculateTimeBalance]);

    useEffect(() => {
        if (confirmation || locationError) {
            const timer = setTimeout(() => {
                setConfirmation(null);
                setLocationError(null);
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [confirmation, locationError]);

    useEffect(() => {
        return () => {
            stopCamera();
        };
    }, []);

    const checkWorkHours = (action: 'in' | 'out') => {
        const isOvertimeAllowed = professional?.allowOvertime ?? true;

        if (isOvertimeAllowed || !professional || !professional.startTime || !professional.endTime) {
            return { success: true, message: '' };
        }

        const now = new Date();
        const currentTimeInMinutes = now.getHours() * 60 + now.getMinutes();

        const [startH, startM] = professional.startTime.split(':').map(Number);
        const startTimeInMinutes = startH * 60 + startM;

        const [endH, endM] = professional.endTime.split(':').map(Number);
        const endTimeInMinutes = endH * 60 + endM;

        const CLOCK_IN_GRACE_MINUTES = 15;
        const CLOCK_OUT_GRACE_MINUTES = 30;

        if (action === 'in') {
            if (currentTimeInMinutes < startTimeInMinutes - CLOCK_IN_GRACE_MINUTES) {
                const allowedTime = new Date();
                allowedTime.setHours(startH, startM - CLOCK_IN_GRACE_MINUTES);
                return { success: false, message: t('timeClockErrorTooEarly', { time: allowedTime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) }) };
            }
        }

        if (action === 'out') {
            if (currentTimeInMinutes < endTimeInMinutes) {
                return { success: true, message: '' };
            }

            if (currentTimeInMinutes > endTimeInMinutes + CLOCK_OUT_GRACE_MINUTES) {
                return { success: false, message: t('timeClockErrorOvertime', { time: professional.endTime }) };
            }
        }

        return { success: true, message: '' };
    };

    const handleActionWithLocationCheck = (actionType: 'in' | 'out' | 'break', actionCallback: (photo: string) => void) => {
        setLocationError(null);

        if (actionType === 'in' || actionType === 'out') {
            const workHoursCheck = checkWorkHours(actionType);
            if (!workHoursCheck.success) {
                setLocationError(workHoursCheck.message);
                return;
            }
        }

        // Get tenant configuration
        // @ts-ignore
        const tenantAddress = currentUser?.tenant?.address;
        const tenantLat = tenantAddress?.latitude ? parseFloat(tenantAddress.latitude) : null;
        const tenantLng = tenantAddress?.longitude ? parseFloat(tenantAddress.longitude) : null;

        // If no coordinates configured, allow punch but log warning (or block if desired)
        if (tenantLat === null || tenantLng === null || isNaN(tenantLat) || isNaN(tenantLng)) {
            console.warn('Tenant location not configured. Allowing punch.');
            // Optional: Block if strict mode
            // setLocationError("Localização da empresa não configurada. Contate o suporte."); return;
            handleActionWithPhoto(actionCallback);
            return;
        }

        setIsLoadingLocation(true);
        if (!navigator.geolocation) {
            setLocationError(t('timeClockErrorNoGeolocation'));
            setIsLoadingLocation(false);
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                const distance = getDistance(latitude, longitude, tenantLat, tenantLng);

                setIsLoadingLocation(false);
                if (distance <= ALLOWED_RADIUS_METERS) {
                    handleActionWithPhoto(actionCallback);
                } else {
                    setLocationError(`Você está a ${Math.round(distance)}m da empresa (limite: ${ALLOWED_RADIUS_METERS}m). Dirija-se ao local de trabalho.`);
                }
            },
            (error) => {
                let message = t('timeClockErrorLocationFailed');
                switch (error.code) {
                    case error.PERMISSION_DENIED: message += t('timeClockErrorPermissionDenied'); break;
                    case error.POSITION_UNAVAILABLE: message += t('timeClockErrorPositionUnavailable'); break;
                    case error.TIMEOUT: message += t('timeClockErrorTimeout'); break;
                    default: message += t('timeClockErrorUnknown'); break;
                }
                setLocationError(message);
                setIsLoadingLocation(false);
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );
    };


    const handleActionWithPhoto = (actionCallback: (photo: string) => void) => {
        setNextAction(() => actionCallback);
        setShowCamera(true);
        startCamera();
    };

    const startCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }
        } catch (err) {
            console.error("Erro ao acessar a câmera: ", err);
            setShowCamera(false);
            setNextAction(null);
            alert(t('timeClockErrorCameraAccess'));
            if (nextAction) {
                nextAction('');
            }
        }
    };

    const stopCamera = () => {
        if (videoRef.current?.srcObject) {
            (videoRef.current.srcObject as MediaStream).getTracks().forEach(track => track.stop());
            videoRef.current.srcObject = null;
        }
    };

    const handleCaptureAndProceed = () => {
        let photoDataUrl = '';
        if (videoRef.current && canvasRef.current) {
            const video = videoRef.current;
            const canvas = canvasRef.current;
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const context = canvas.getContext('2d');
            if (context) {
                context.drawImage(video, 0, 0, canvas.width, video.videoHeight);
                photoDataUrl = canvas.toDataURL('image/png');
            }
        }

        if (nextAction) {
            nextAction(photoDataUrl);
        }

        stopCamera();
        setShowCamera(false);
        setNextAction(null);
    };

    const addLogEntry = (action: string, photo?: string, observation?: string) => {
        const time = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
        setLog(prev => [...prev, { time, action, photo, observation }]);
    };

    const handleClockIn = async (photo: string) => {
        try {
            await timeClockAPI.punch({ type: 'entrada', photo });
            const time = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
            setStatus('clocked_in');
            setConfirmation(t('timeClockSuccessClockIn', { time: time, name: currentUser?.name.split(' ')[0] || '' }));
            const history = await timeClockAPI.getHistory({ professionalId: professional?.id });
            const mappedHistory = history.map((record: any) => ({
                id: record.id,
                professionalId: record.professional_id,
                date: record.date,
                punches: record.punches || [],
                justification: record.justification,
                overtimeJustification: record.overtime_justification,
            }));
            setAllHistory(mappedHistory);
        } catch (error) {
            console.error('Clock in failed', error);
            setLocationError(t('timeClockErrorUnknown'));
        }
    };

    const handleClockOut = async (photo: string) => {
        try {
            await timeClockAPI.punch({ type: 'saida', photo });
            const time = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
            setStatus('clocked_out');
            setConfirmation(t('timeClockSuccessClockOut', { time: time }));

            const history = await timeClockAPI.getHistory({ professionalId: professional?.id });
            const mappedHistory = history.map((record: any) => ({
                id: record.id,
                professionalId: record.professional_id,
                date: record.date,
                punches: record.punches || [],
                justification: record.justification,
                overtimeJustification: record.overtime_justification,
            }));
            setAllHistory(mappedHistory);

            const todayStr = new Date().toISOString().split('T')[0];
            const todayLog = mappedHistory.find((h: HistoryLog) => h.date === todayStr);
            if (todayLog) {
                const balance = calculateTimeBalance([todayLog]);
                if (balance > 0 && !todayLog.overtimeJustification) {
                    setLogToJustify({ log: todayLog, balance });
                    setIsOvertimeModalOpen(true);
                } else {
                    setShowObservation(true);
                }
            }

        } catch (error) {
            console.error('Clock out failed', error);
            setLocationError(t('timeClockErrorUnknown'));
        }
    };

    const handleBreakStart = async (photo: string) => {
        try {
            await timeClockAPI.punch({ type: 'saida_pausa', photo });
            const time = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
            setStatus('on_break');
            setConfirmation(t('timeClockSuccessBreakStart', { time: time }));
            // Trigger refresh
            const history = await timeClockAPI.getHistory({ professionalId: professional?.id });
            const mappedHistory = history.map((record: any) => ({
                id: record.id,
                professionalId: record.professional_id,
                date: record.date,
                punches: record.punches || [],
                justification: record.justification,
                overtimeJustification: record.overtime_justification,
            }));
            setAllHistory(mappedHistory);
        } catch (error) {
            console.error('Break start failed', error);
        }
    };

    const handleBreakEnd = async (photo: string) => {
        try {
            await timeClockAPI.punch({ type: 'retorno_pausa', photo });
            const time = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
            setStatus('clocked_in');
            setConfirmation(t('timeClockSuccessBreakEnd', { time: time }));
            // Trigger refresh
            const history = await timeClockAPI.getHistory({ professionalId: professional?.id });
            const mappedHistory = history.map((record: any) => ({
                id: record.id,
                professionalId: record.professional_id,
                date: record.date,
                punches: record.punches || [],
                justification: record.justification,
                overtimeJustification: record.overtime_justification,
            }));
            setAllHistory(mappedHistory);
        } catch (error) {
            console.error('Break end failed', error);
        }
    };

    const handleSaveObservation = () => {
        if (observationText.trim()) {
            setLog(prev => {
                const lastLogIndex = prev.length - 1;
                if (lastLogIndex >= 0 && prev[lastLogIndex].action === t('timeClockLogClockOut')) {
                    const newLog = [...prev];
                    newLog[lastLogIndex] = { ...newLog[lastLogIndex], observation: observationText };
                    return newLog;
                }
                return prev;
            });
        }
        setShowObservation(false);
        setObservationText('');
    };

    const handleJustificationSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!justificationDate || !justificationReason || !professional) {
            alert(t('fillAllFields'));
            return;
        }

        try {
            // Use FormData for file upload
            const formData = new FormData();
            formData.append('date', justificationDate);
            formData.append('reason', justificationReason);
            if (justificationFile) {
                formData.append('file', justificationFile);
            }

            await timeClockAPI.justifyAbsence(formData);

            // Refresh history
            const history = await timeClockAPI.getHistory({ professionalId: professional?.id });
            const mappedHistory = history.map((record: any) => ({
                id: record.id,
                professionalId: record.professional_id,
                date: record.date,
                punches: record.punches || [],
                justification: record.justification,
                overtimeJustification: record.overtime_justification,
            }));
            setAllHistory(mappedHistory);

            setIsJustificationOpen(false);
            setJustificationDate(new Date().toISOString().split('T')[0]);
            setJustificationReason('');
            setJustificationFile(null);
            setConfirmation(t('justificationSentSuccess'));
        } catch (error) {
            console.error('Justification failed', error);
            alert('Falha ao enviar justificativa');
        }
    };

    const handleSaveOvertimeJustification = async (date: string, justification: string) => {
        try {
            await timeClockAPI.justifyOvertime({ date, justification });
            // Refresh history
            const history = await timeClockAPI.getHistory({ professionalId: professional?.id });
            const mappedHistory = history.map((record: any) => ({
                id: record.id,
                professionalId: record.professional_id,
                date: record.date,
                punches: record.punches || [],
                justification: record.justification,
                overtimeJustification: record.overtime_justification,
            }));
            setAllHistory(mappedHistory);
            setIsOvertimeModalOpen(false);
            setLogToJustify(null);
            setConfirmation(t('justificationSavedSuccess'));
        } catch (error) {
            console.error('Overtime justification failed', error);
            alert('Falha ao enviar justificativa');
        }
    };

    const handleAbsenceApproval = async (date: string, professionalId: number, status: 'approved' | 'rejected') => {
        try {
            const record = allHistory.find(h => h.date === date && h.professionalId === professionalId);
            if (!record?.id) return;

            await timeClockAPI.approve(record.id, { type: 'absence', status });

            setAllHistory(prev =>
                prev.map(dayLog =>
                    dayLog.date === date && dayLog.professionalId === professionalId
                        ? { ...dayLog, justification: { ...dayLog.justification!, status } }
                        : dayLog
                )
            );
            showNotification(status === 'approved' ? t('approvalSuccess') : t('rejectionSuccess'));
        } catch (error) {
            console.error('Approval failed', error);
        }
    };

    const handleOvertimeApproval = async (date: string, professionalId: number, status: 'approved' | 'rejected') => {
        try {
            const record = allHistory.find(h => h.date === date && h.professionalId === professionalId);
            if (!record?.id) return;

            await timeClockAPI.approve(record.id, { type: 'overtime', status });

            setAllHistory(prev =>
                prev.map(dayLog =>
                    dayLog.date === date && dayLog.professionalId === professionalId
                        ? { ...dayLog, overtimeJustification: { ...dayLog.overtimeJustification!, status } }
                        : dayLog
                )
            );
            showNotification(status === 'approved' ? t('approvalSuccess') : t('rejectionSuccess'));
        } catch (error) {
            console.error('Approval failed', error);
        }
    };

    const showNotification = (message: string) => {
        setConfirmation(message);
    };

    if (showCamera) {
        return (
            <div className="container mx-auto px-6 py-8 flex flex-col items-center justify-center h-full">
                <div className="w-full max-w-lg bg-white p-6 rounded-2xl shadow-lg text-center animate-fade-in">
                    <h2 className="text-xl font-bold text-secondary mb-4">{t('timeClockCameraTitle')}</h2>
                    <video ref={videoRef} autoPlay playsInline className="w-full rounded-md bg-gray-900 aspect-video object-cover mb-4"></video>
                    <canvas ref={canvasRef} className="hidden"></canvas>
                    <div className="flex justify-center gap-4">
                        <button type="button" onClick={handleCaptureAndProceed} className="px-6 py-3 bg-primary text-white font-semibold rounded-lg shadow-md">{t('capture')}</button>
                        <button type="button" onClick={() => { stopCamera(); setShowCamera(false); setNextAction(null); }} className="px-6 py-3 bg-gray-200 text-gray-800 font-semibold rounded-lg">{t('cancel')}</button>
                    </div>
                </div>
            </div>
        );
    }

    const dayNameKeys = ['daySunday', 'dayMonday', 'dayTuesday', 'dayWednesday', 'dayThursday', 'dayFriday', 'daySaturday'];

    const renderHistoryTable = (historyData: HistoryLog[], forManagement: boolean) => {
        const StatusBadge: React.FC<{ status?: 'pending' | 'approved' | 'rejected' }> = ({ status }) => {
            if (!status) return null;
            const styles = {
                pending: 'bg-yellow-100 text-yellow-800',
                approved: 'bg-green-100 text-green-800',
                rejected: 'bg-red-100 text-red-800',
            };
            const labels = {
                pending: t('statusPending'),
                approved: t('statusApproved'),
                rejected: t('statusRejected'),
            };
            return <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${styles[status]}`}>{labels[status]}</span>;
        };

        return (
            <div className="overflow-x-auto bg-white p-4 rounded-lg shadow-md">
                <table className="min-w-full divide-y divide-gray-200 text-sm">
                    {/* ... table header ... */}
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-4 py-3 text-left font-medium text-gray-500 uppercase">{t('date')}</th>
                            <th className="px-4 py-3 text-left font-medium text-gray-500 uppercase">{t('historyHeaderDay')}</th>
                            <th className="px-4 py-3 text-center font-medium text-gray-500 uppercase">{t('historyHeaderEntry')}</th>
                            <th className="px-4 py-3 text-center font-medium text-gray-500 uppercase">{t('historyHeaderBreakStart')}</th>
                            <th className="px-4 py-3 text-center font-medium text-gray-500 uppercase">{t('historyHeaderBreakEnd')}</th>
                            <th className="px-4 py-3 text-center font-medium text-gray-500 uppercase">{t('historyHeaderExit')}</th>
                            <th className="px-4 py-3 text-center font-medium text-gray-500 uppercase">{t('historyHeaderTotal')}</th>
                            <th className="px-4 py-3 text-center font-medium text-gray-500 uppercase">{t('historyHeaderBalance')}</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {historyData.map((dayLog) => {
                            // Render justification row
                            if (dayLog.justification) {
                                return (
                                    <tr key={dayLog.date} className="bg-yellow-50">
                                        <td className="px-4 py-3 text-gray-600">{new Date(dayLog.date + 'T00:00:00').toLocaleDateString('pt-BR')}</td>
                                        <td className="px-4 py-3 text-gray-600">{t(dayNameKeys[new Date(dayLog.date + 'T00:00:00').getDay()])}</td>
                                        <td colSpan={6} className="px-4 py-3">
                                            <div className="flex justify-between items-center">
                                                <div>
                                                    <p className="font-semibold text-yellow-800">{t('justifiedAbsence')}: <span className="font-normal">{dayLog.justification.reason}</span></p>
                                                    {dayLog.justification.file && <p className="text-xs text-gray-600 mt-1">{t('fileAttached')}: {dayLog.justification.file}</p>}
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <StatusBadge status={dayLog.justification.status} />
                                                    {forManagement && dayLog.justification.status === 'pending' && (
                                                        <>
                                                            <button onClick={() => handleAbsenceApproval(dayLog.date, dayLog.professionalId, 'approved')} className="text-xs bg-green-500 text-white font-bold py-1 px-2 rounded-md">{t('approve')}</button>
                                                            <button onClick={() => handleAbsenceApproval(dayLog.date, dayLog.professionalId, 'rejected')} className="text-xs bg-red-500 text-white font-bold py-1 px-2 rounded-md">{t('reject')}</button>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            }
                            // Render regular punch log row
                            const punches = {
                                entrada: dayLog.punches.find(p => p.type === 'entrada'),
                                saida_pausa: dayLog.punches.find(p => p.type === 'saida_pausa'),
                                retorno_pausa: dayLog.punches.find(p => p.type === 'retorno_pausa'),
                                saida: dayLog.punches.find(p => p.type === 'saida'),
                            };

                            const PunchCell = ({ punch }: { punch?: Punch }) => (
                                <div className="flex flex-col items-center gap-1">
                                    <span>{punch?.time || '-'}</span>
                                    {punch?.photo && (
                                        <button
                                            onClick={() => setViewPhoto(punch.photo!)}
                                            className="text-primary hover:text-primary-dark"
                                            title="Ver evidência fotográfica"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                                            </svg>
                                        </button>
                                    )}
                                </div>
                            );

                            let dailyWorkedMinutes = 0;
                            if (punches.entrada && punches.saida_pausa && punches.retorno_pausa && punches.saida) {
                                const morning = timeStringToMinutes(punches.saida_pausa.time) - timeStringToMinutes(punches.entrada.time);
                                const afternoon = timeStringToMinutes(punches.saida.time) - timeStringToMinutes(punches.retorno_pausa.time);
                                dailyWorkedMinutes = morning + afternoon;
                            }
                            const dailyBalanceMinutes = dailyWorkedMinutes > 0 ? dailyWorkedMinutes - (8 * 60) : 0;
                            return (
                                <tr key={dayLog.date}>
                                    <td className="px-4 py-3 text-gray-600">{new Date(dayLog.date + 'T00:00:00').toLocaleDateString('pt-BR')}</td>
                                    <td className="px-4 py-3 text-gray-600">{t(dayNameKeys[new Date(dayLog.date + 'T00:00:00').getDay()])}</td>
                                    <td className="px-4 py-3 text-center text-gray-600"><PunchCell punch={punches.entrada} /></td>
                                    <td className="px-4 py-3 text-center text-gray-600"><PunchCell punch={punches.saida_pausa} /></td>
                                    <td className="px-4 py-3 text-center text-gray-600"><PunchCell punch={punches.retorno_pausa} /></td>
                                    <td className="px-4 py-3 text-center text-gray-600"><PunchCell punch={punches.saida} /></td>
                                    <td className="px-4 py-3 text-center font-semibold text-gray-600">{dailyWorkedMinutes > 0 ? minutesToHoursString(dailyWorkedMinutes, false) : '--'}</td>
                                    <td className={`px-4 py-3 text-center font-semibold ${dailyBalanceMinutes >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                        {dailyWorkedMinutes > 0 ? minutesToHoursString(dailyBalanceMinutes) : '--'}
                                        {dailyBalanceMinutes > 0 && dayLog.overtimeJustification && (
                                            <div className="mt-1">
                                                <div className="cursor-help text-xs text-blue-600 flex items-center justify-center gap-1"
                                                    title={`${t('justificationLabel')}: ${dayLog.overtimeJustification.justification}`} >
                                                    <StatusBadge status={dayLog.overtimeJustification.status} />
                                                </div>
                                                {forManagement && dayLog.overtimeJustification.status === 'pending' && (
                                                    <div className="flex items-center justify-center gap-2 mt-1">
                                                        <button onClick={() => handleOvertimeApproval(dayLog.date, dayLog.professionalId, 'approved')} className="text-xs bg-green-500 text-white font-bold py-1 px-2 rounded-md">{t('approve')}</button>
                                                        <button onClick={() => handleOvertimeApproval(dayLog.date, dayLog.professionalId, 'rejected')} className="text-xs bg-red-500 text-white font-bold py-1 px-2 rounded-md">{t('reject')}</button>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                        {dailyBalanceMinutes > 0 && !dayLog.overtimeJustification && !forManagement && (
                                            <div className="mt-1">
                                                <button onClick={() => { setLogToJustify({ log: dayLog, balance: dailyBalanceMinutes }); setIsOvertimeModalOpen(true); }} className="text-xs text-primary hover:underline" >
                                                    {t('justifyOvertime')}
                                                </button>
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            )
                        })}
                    </tbody>
                </table>
            </div>
        )
    };

    const renderMyPunchesView = () => (
        <>
            <div className="max-w-2xl mx-auto bg-white p-8 rounded-2xl shadow-2xl">
                <div className="mb-8 text-center">
                    <h2 className="text-lg font-semibold text-gray-600">{t('timeBalance')}</h2>
                    <p className={`text-4xl font-bold ${userTimeBalance >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                        {minutesToHoursString(userTimeBalance)}
                    </p>
                    <p className="text-sm text-gray-500">{t('timeBalanceSubtitle')}</p>
                </div>

                <div className="text-center">
                    {confirmation && <div className="mb-6 p-4 bg-primary/10 text-primary font-semibold rounded-lg animate-fade-in">{confirmation}</div>}
                    {locationError && <div className="mb-6 p-4 bg-red-100 text-red-700 font-semibold rounded-lg animate-fade-in">{locationError}</div>}

                    {isLoadingLocation && (
                        <div className="flex items-center justify-center p-4">
                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                            <span className="text-gray-600 font-semibold">{t('timeClockCheckingLocation')}</span>
                        </div>
                    )}

                    {!isLoadingLocation && status === 'not_clocked_in' && (
                        <div className="animate-fade-in">
                            <h1 className="text-2xl font-bold text-secondary">{t('timeClockHello', { name: currentUser?.name.split(' ')[0] || '' })}</h1>
                            <p className="text-gray-600 mt-2 mb-8">{t('timeClockPrompt')}</p>
                            <div className="relative group w-full max-w-xs mx-auto">
                                <button onClick={() => handleActionWithLocationCheck('in', handleClockIn)} disabled={isIndividualPlan} className="w-full flex items-center justify-center p-4 bg-primary text-white font-bold rounded-xl shadow-lg transition-transform transform hover:scale-105 disabled:bg-gray-400 disabled:cursor-not-allowed disabled:scale-100">
                                    <ClockInIcon /> 📍 {t('timeClockClockIn')}
                                </button>
                                {isIndividualPlan && <div className="absolute bottom-full mb-2 w-max max-w-xs bg-gray-800 text-white text-xs rounded py-2 px-3 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none -translate-x-1/2 left-1/2 z-10">{t('settingsUserTooltipIndividualPlan')}<div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-x-4 border-x-transparent border-t-4 border-t-gray-800"></div></div>}
                            </div>
                        </div>
                    )}

                    {!isLoadingLocation && status === 'clocked_in' && <div className="space-y-4 animate-fade-in"><h1 className="text-2xl font-bold text-secondary">{t('timeClockWorking')}</h1><div className="flex flex-col sm:flex-row gap-4 justify-center"><button onClick={() => handleActionWithLocationCheck('out', handleClockOut)} className="flex-1 flex items-center justify-center p-4 bg-red-500 text-white font-bold rounded-xl shadow-lg transition-transform transform hover:scale-105"><ClockOutIcon /> 🚪 {t('timeClockLogClockOut')}</button><button onClick={() => handleActionWithLocationCheck('break', handleBreakStart)} className="flex-1 flex items-center justify-center p-4 bg-yellow-500 text-white font-bold rounded-xl shadow-lg transition-transform transform hover:scale-105"><CoffeeIcon /> 🍽 {t('timeClockBreak')}</button></div></div>}
                    {!isLoadingLocation && status === 'on_break' && <div className="animate-fade-in"><h1 className="text-2xl font-bold text-secondary">{t('timeClockOnBreak')}</h1><p className="text-gray-600 mt-2 mb-8">{t('timeClockReminderBreakEnd')}</p><button onClick={() => handleActionWithLocationCheck('break', handleBreakEnd)} className="w-full max-w-xs mx-auto flex items-center justify-center p-4 bg-blue-500 text-white font-bold rounded-xl shadow-lg transition-transform transform hover:scale-105"><ReturnIcon /> ⏳ {t('timeClockReturnFromBreak')}</button></div>}
                    {!isLoadingLocation && status === 'clocked_out' && <div className="animate-fade-in"><h1 className="text-2xl font-bold text-secondary">{t('timeClockEndOfShift')}</h1><p className="text-gray-600 mt-2 mb-8">{t('timeClockSeeYouNextTime')}</p>{showObservation && <div className="my-6 p-4 bg-light rounded-lg animate-fade-in text-left"><label htmlFor="observation" className="font-semibold text-gray-700">{t('timeClockAddObservation')}</label><textarea id="observation" value={observationText} onChange={e => setObservationText(e.target.value)} rows={3} className="w-full mt-2 p-2 border rounded-md"></textarea><div className="flex gap-4 mt-3"><button onClick={handleSaveObservation} className="px-4 py-2 bg-primary text-white rounded-md">{t('save')}</button><button onClick={() => setShowObservation(false)} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md">{t('no')}</button></div></div>}</div>}
                </div>
            </div>

            <div className="max-w-4xl mx-auto mt-10">
                <div className="border-t pt-6">
                    <button onClick={() => setIsJustificationOpen(!isJustificationOpen)} className="w-full text-left font-bold text-xl text-secondary flex justify-between items-center p-3 bg-light rounded-t-lg">
                        <span>{t('justifyAbsenceTitle')}</span>
                        <span className="text-2xl">{isJustificationOpen ? '−' : '+'}</span>
                    </button>
                    {isJustificationOpen && <form onSubmit={handleJustificationSubmit} className="p-4 border border-t-0 rounded-b-lg space-y-4 animate-fade-in bg-white shadow-inner"><div><label htmlFor="justification-date" className="block text-sm font-medium text-gray-700">{t('justificationDateLabel')}</label><input type="date" id="justification-date" value={justificationDate} onChange={e => setJustificationDate(e.target.value)} required className="mt-1 w-full p-2 border rounded-md" /></div><div><label htmlFor="justification-reason" className="block text-sm font-medium text-gray-700">{t('justificationReasonLabel')}</label><textarea id="justification-reason" value={justificationReason} onChange={e => setJustificationReason(e.target.value)} required rows={3} className="mt-1 w-full p-2 border rounded-md"></textarea></div><div><label htmlFor="justification-file" className="block text-sm font-medium text-gray-700">{t('justificationAttachLabel')}</label><input type="file" id="justification-file" onChange={e => setJustificationFile(e.target.files ? e.target.files[0] : null)} className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20" /></div><button type="submit" className="px-6 py-2 bg-primary text-white font-semibold rounded-lg">{t('justificationSubmitButton')}</button></form>}
                </div>
                <div className="mt-8">
                    <h2 className="text-2xl font-bold text-secondary mb-4">{t('timeClockHistoryTitle')}</h2>
                    {renderHistoryTable(userHistory, false)}
                </div>
            </div>
        </>
    );

    const renderTeamManagementView = () => (
        <div className="space-y-8">
            <div className="bg-white p-6 rounded-2xl shadow-lg">
                <h2 className="text-xl font-bold text-secondary">{t('managementPanel')}</h2>
                <div className="mt-4">
                    <label htmlFor="professional-select" className="block text-sm font-medium text-gray-700">{t('selectProfessional')}</label>
                    <select id="professional-select" value={selectedProfessionalId} onChange={e => setSelectedProfessionalId(e.target.value)} className="mt-1 block w-full max-w-xs p-2 border border-gray-300 rounded-md shadow-sm">
                        <option value="" disabled>{t('select')}...</option>
                        {professionalsList.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                </div>
            </div>

            {selectedProfessionalId ? (
                <div className="animate-fade-in space-y-8">
                    <div className="text-center bg-white p-6 rounded-2xl shadow-lg">
                        <h3 className="text-lg font-semibold text-gray-600">{t('timeBalance')}</h3>
                        <p className={`text-3xl font-bold ${selectedProfessionalTimeBalance >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                            {minutesToHoursString(selectedProfessionalTimeBalance)}
                        </p>
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-secondary mb-4">{t('timeClockHistoryTitle')}</h3>
                        {renderHistoryTable(selectedProfessionalHistory, true)}
                    </div>
                </div>
            ) : <p className="text-center text-gray-500 py-8">{t('selectProfessionalMessage')}</p>}
        </div>
    );

    return (
        <div className="container mx-auto px-6 py-8">
            {onBack && <button onClick={onBack} className="mb-8 flex items-center text-primary hover:text-primary-dark font-semibold">&larr; {t('back')}</button>}

            {isManager && !isIndividualPlan && (
                <div className="mb-6 border-b border-gray-200">
                    <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                        <button onClick={() => setActiveTab('myPunches')} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'myPunches' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
                            {t('myPunches')}
                        </button>
                        <button onClick={() => setActiveTab('teamManagement')} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'teamManagement' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
                            {t('teamManagement')}
                        </button>
                    </nav>
                </div>
            )}

            {isManager && !isIndividualPlan ? (
                activeTab === 'myPunches' ? renderMyPunchesView() : renderTeamManagementView()
            ) : (
                renderMyPunchesView()
            )}

            <OvertimeJustificationModal isOpen={isOvertimeModalOpen} onClose={() => setIsOvertimeModalOpen(false)} onSave={handleSaveOvertimeJustification} data={logToJustify} t={t} minutesToHoursString={minutesToHoursString} />

            {/* Photo Viewer Modal */}
            {viewPhoto && (
                <div className="fixed inset-0 z-[100] bg-black bg-opacity-75 flex items-center justify-center p-4 animate-fade-in" onClick={() => setViewPhoto(null)}>
                    <div className="bg-white p-2 rounded-2xl max-w-2xl w-full relative animate-bounce-in shadow-2xl" onClick={e => e.stopPropagation()}>
                        <button
                            onClick={() => setViewPhoto(null)}
                            className="absolute -top-4 -right-4 bg-primary text-white p-2 rounded-full shadow-lg hover:bg-primary-dark transition-colors"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                        <img src={viewPhoto} alt="Evidência fotográfica" className="w-full h-auto rounded-xl shadow-inner" />
                        <div className="p-4 text-center">
                            <p className="text-secondary font-bold">Evidência Fotográfica do Ponto</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TimeClockPage;
