
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useLanguage } from '../contexts/LanguageContext';

// --- Interfaces ---
interface PermissionDetails {
  create: boolean;
  view: boolean;
  delete: boolean;
  export: boolean;
}

import { SystemUser as User } from '../contexts/DataContext';
import { uploadAPI } from '../lib/api';

// --- Interfaces ---
interface PermissionDetails {
  create: boolean;
  view: boolean;
  delete: boolean;
  export: boolean;
}

// User interface removed

interface Professional {
  id: number;
  name: string;
  email: string;
  photo: string;
  occupation: string;
}


interface UserManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (userData: any) => void;
  userToEdit: User | null;
  professionals: Professional[];
  users: User[];
}

const initialFormData = {
  name: '',
  email: '',
  role: 'Profissional' as User['role'],
};

const EyeIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
  </svg>
);

const EyeOffIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.542-7 1.274 4.057-5.064 7-9.542-7 .847 0 1.673.124 2.468.352M10.582 10.582a3 3 0 114.243 4.243M1 1l22 22" />
  </svg>
);


// --- Component ---
const UserManagementModal: React.FC<UserManagementModalProps> = ({ isOpen, onClose, onSave, userToEdit, professionals, users }) => {
  const { t } = useLanguage();
  const [formData, setFormData] = useState(initialFormData);
  const [permissions, setPermissions] = useState<{ [key: string]: PermissionDetails }>({});
  const [isExiting, setIsExiting] = useState(false);
  const [linkedProfessionalId, setLinkedProfessionalId] = useState<string>('');

  const [photo, setPhoto] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const availableProfessionals = useMemo(() => {
    if (!professionals || !users) return [];
    const existingUserEmails = users.map(u => u.email);
    return professionals.filter(p =>
      !existingUserEmails.includes(p.email) || (userToEdit && p.email === userToEdit.email)
    );
  }, [professionals, users, userToEdit]);

  const permissionsList = useMemo(() => [
    {
      category: t('permCategoryGeneral'),
      items: [
        { id: 'dashboard', label: t('permItemDashboard') },
        { id: 'minhaAgenda', label: t('permItemMyAgenda') },
        { id: 'chat', label: t('permItemChat') },
      ]
    },
    {
      category: t('permCategoryClients'),
      items: [
        { id: 'clientes', label: t('permItemClients') },
        { id: 'crm', label: t('permItemCRM') },
        { id: 'avaliacoes', label: t('permItemReviews') },
      ]
    },
    {
      category: t('permCategoryMarketing'),
      items: [
        { id: 'marketing', label: t('permItemMarketing') },
        { id: 'canais', label: t('permItemChannels') },
        { id: 'malaDireta', label: t('permItemDirectMail') },
        { id: 'automacoes', label: t('permItemAutomations') },
      ]
    },
    {
      category: t('permCategoryAI'),
      items: [
        { id: 'dashboardIA', label: t('permItemAIDashboard') },
        { id: 'chatIA', label: t('permItemAIChat') },
        { id: 'configIA', label: t('permItemAIConfig') },
      ]
    },
    {
      category: t('permCategoryAdmin'),
      items: [
        { id: 'agenda', label: t('permItemGeneralAgenda') },
        { id: 'contratos', label: t('permItemContracts') },
        { id: 'servicos', label: t('permItemServices') },
        { id: 'estoque', label: t('permItemStock') },
        { id: 'registroPonto', label: t('permItemTimeClock') },
      ]
    },
    {
      category: t('permCategoryManagement'),
      items: [
        { id: 'financeiro', label: t('permItemFinancial') },
        { id: 'relatorio', label: t('permItemReports') },
        { id: 'profissionais', label: t('permItemProfessionals') },
        { id: 'usuarios', label: t('permItemUsers') },
        { id: 'unidades', label: t('permItemUnits') },
        { id: 'auditoria', label: t('permItemAudits') },
        { id: 'assinatura', label: t('permItemSubscription') },
        { id: 'configuracoes', label: t('permItemSettings') },
        { id: 'suporte', label: t('permItemSupport') },
        { id: 'traducoes', label: t('permItemTranslations') },
      ]
    }
  ], [t]);

  const permissionActions: (keyof PermissionDetails)[] = ['view', 'create', 'delete', 'export'];
  const actionLabels: { [key in keyof PermissionDetails]: string } = {
    create: t('permActionCreate'),
    view: t('permActionView'),
    delete: t('permActionDelete'),
    export: t('permActionExport'),
  };

  const fullAccess = { create: true, view: true, delete: true, export: true };
  const readOnly = { create: false, view: true, delete: false, export: false };
  const noAccess = { create: false, view: false, delete: false, export: false };

  const rolePermissions: any = {
    Administrador: {
      dashboard: fullAccess, agenda: fullAccess, minhaAgenda: fullAccess, clientes: fullAccess, crm: fullAccess,
      contratos: fullAccess, financeiro: fullAccess, estoque: fullAccess, servicos: fullAccess, profissionais: fullAccess,
      configuracoes: fullAccess, usuarios: fullAccess, registroPonto: fullAccess, relatorio: fullAccess,
      chat: fullAccess, avaliacoes: fullAccess, marketing: fullAccess, canais: fullAccess, malaDireta: fullAccess, automacoes: fullAccess,
      dashboardIA: fullAccess, chatIA: fullAccess, configIA: fullAccess,
      unidades: fullAccess, auditoria: fullAccess, assinatura: fullAccess, suporte: fullAccess, traducoes: fullAccess
    },
    Gerente: {
      dashboard: fullAccess, agenda: fullAccess, minhaAgenda: fullAccess, clientes: fullAccess, crm: fullAccess,
      contratos: fullAccess, financeiro: readOnly, estoque: fullAccess, servicos: fullAccess, profissionais: fullAccess,
      configuracoes: noAccess, usuarios: noAccess, registroPonto: fullAccess, relatorio: fullAccess,
      chat: fullAccess, avaliacoes: fullAccess, marketing: fullAccess, canais: fullAccess, malaDireta: fullAccess, automacoes: fullAccess,
      dashboardIA: fullAccess, chatIA: fullAccess, configIA: noAccess,
      unidades: noAccess, auditoria: readOnly, assinatura: noAccess, suporte: fullAccess, traducoes: noAccess
    },
    Profissional: {
      dashboard: noAccess, agenda: noAccess, minhaAgenda: fullAccess, clientes: fullAccess, crm: noAccess,
      contratos: noAccess, financeiro: noAccess, estoque: noAccess, servicos: noAccess, profissionais: noAccess,
      configuracoes: noAccess, usuarios: noAccess, registroPonto: fullAccess, relatorio: noAccess,
      chat: fullAccess, avaliacoes: readOnly, marketing: noAccess, canais: noAccess, malaDireta: noAccess, automacoes: noAccess,
      dashboardIA: noAccess, chatIA: noAccess, configIA: noAccess,
      unidades: noAccess, auditoria: noAccess, assinatura: noAccess, suporte: noAccess, traducoes: noAccess
    },
    Concierge: {
      dashboard: readOnly, agenda: fullAccess, minhaAgenda: noAccess, clientes: fullAccess, crm: readOnly,
      contratos: noAccess, financeiro: noAccess, estoque: noAccess, servicos: noAccess, profissionais: noAccess,
      configuracoes: noAccess, usuarios: noAccess, registroPonto: fullAccess, relatorio: noAccess,
      chat: fullAccess, avaliacoes: readOnly, marketing: noAccess, canais: noAccess, malaDireta: noAccess, automacoes: noAccess,
      dashboardIA: noAccess, chatIA: noAccess, configIA: noAccess,
      unidades: noAccess, auditoria: noAccess, assinatura: noAccess, suporte: fullAccess, traducoes: noAccess
    }
  };
  // Compatibility aliases for legacy roles
  rolePermissions['admin' as any] = rolePermissions.Administrador;
  rolePermissions['gerente' as any] = rolePermissions.Gerente;
  rolePermissions['recepcao' as any] = rolePermissions.Concierge;
  rolePermissions['profissional' as any] = rolePermissions.Profissional;


  useEffect(() => {
    if (isOpen) {
      if (userToEdit) {
        setFormData({
          name: userToEdit.name,
          email: userToEdit.email,
          role: userToEdit.role,
        });
        setPhoto(userToEdit.avatarUrl);
        setPermissions(userToEdit.permissions || rolePermissions[userToEdit.role] || {});

        const linkedProf = professionals.find(p => p.email === userToEdit.email);
        setLinkedProfessionalId(linkedProf ? String(linkedProf.id) : '');

      } else {
        setFormData(initialFormData);
        setPhoto(null);
        setPermissions(rolePermissions.Profissional);
        setLinkedProfessionalId('');
      }
      setPhotoFile(null);
      setPassword('');
      setConfirmPassword('');
      setPasswordError('');
      setIsUploading(false);
    }
  }, [isOpen, userToEdit, professionals]);

  // Update permissions when role changes, but not if a professional is linked
  useEffect(() => {
    if (isOpen && !linkedProfessionalId) {
      setPermissions(rolePermissions[formData.role] || {});
    }
  }, [formData.role, isOpen, linkedProfessionalId]);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => {
      onClose();
      setIsExiting(false);
    }, 300);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name === 'role' && linkedProfessionalId) {
      return; // Prevent role change when linked
    }
    setFormData(prev => ({ ...prev, [name]: value as any }));
  };

  const handleLinkProfessional = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const profId = e.target.value;
    setLinkedProfessionalId(profId);

    if (profId) {
      const selectedProf = professionals.find(p => String(p.id) === profId);
      if (selectedProf) {
        setFormData(prev => ({
          ...prev,
          name: selectedProf.name,
          email: selectedProf.email,
          role: 'Profissional'
        }));
        setPermissions(rolePermissions.Profissional);
        setPhoto(selectedProf.photo);
        setPhotoFile(null); // Reset manual upload if linked
      }
    } else {
      setFormData(prev => ({ ...prev, name: '', email: '' }));
      setPhoto(null);
      setPhotoFile(null);
    }
  };

  const handlePermissionChange = (permId: string, action: keyof PermissionDetails, checked: boolean) => {
    setPermissions(prev => ({
      ...prev,
      [permId]: {
        ...(prev[permId] || { create: false, view: false, delete: false, export: false }),
        [action]: checked,
      },
    }));
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setPhotoFile(file);

      const reader = new FileReader();
      reader.onload = (event) => {
        setPhoto(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');

    if (!userToEdit && !password) {
      setPasswordError(t('passwordRequiredForNew'));
      return;
    }

    if (password) {
      if (password !== confirmPassword) {
        setPasswordError(t('passwordsDoNotMatch'));
        return;
      }
      if (password.length < 6) {
        setPasswordError(t('passwordMinLength'));
        return;
      }
    }

    setIsUploading(true);

    let avatarUrl = photo;

    // Upload photo if a new file was selected
    if (photoFile) {
      try {
        const uploadResponse = await uploadAPI.upload(photoFile, 'user');
        if (uploadResponse && uploadResponse.url) {
          avatarUrl = uploadResponse.url;
        }
      } catch (error) {
        console.error("Error uploading avatar:", error);
        // Optionally show an error, but for now we might proceed or stop
        alert(t('errorUploadingAvatar') || "Erro ao fazer upload da avatar");
        setIsUploading(false);
        return;
      }
    } else if (!photo && userToEdit?.avatarUrl) {
      // If photo was cleared (not implemented UI wise but good logical check)
      // or we keep existing logic: if photo is null, send null? 
      // Logic above says: avatarUrl: photo || userToEdit?.avatarUrl
      // So if photo is null, we keep old.
      avatarUrl = userToEdit.avatarUrl;
    }

    const userData: any = {
      id: userToEdit?.id,
      name: formData.name,
      email: formData.email,
      role: formData.role,
      permissions,
      avatarUrl: avatarUrl || userToEdit?.avatarUrl,
    };

    if (password) {
      userData.password = password;
    }

    await onSave(userData); // onSave might be async now or we just wait for it to return if it returns promise
    setIsUploading(false);
    handleClose();
  };

  const handleRowMasterChange = (permId: string, checked: boolean) => {
    setPermissions((prev) => ({
      ...prev,
      [permId]: {
        create: checked,
        view: checked,
        delete: checked,
        export: checked,
      },
    }));
  };

  const handleColumnMasterChange = (action: keyof PermissionDetails, checked: boolean) => {
    setPermissions((prev) => {
      const newPermissions = { ...prev };
      permissionsList.flatMap(g => g.items).forEach(perm => {
        newPermissions[perm.id] = {
          ...(newPermissions[perm.id] || { create: false, view: false, delete: false, export: false }),
          [action]: checked,
        };
      });
      return newPermissions;
    });
  };

  if (!isOpen && !isExiting) return null;

  const title = userToEdit ? t('userModalTitleEdit') : t('userModalTitleAdd');

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-opacity duration-300 ${isOpen ? 'opacity-100 bg-gray-500 bg-opacity-75' : 'opacity-0'}`}>
      <div className={`bg-white rounded-lg shadow-xl transform transition-all duration-300 w-full max-w-2xl ${isOpen && !isExiting ? 'scale-100' : 'scale-95'}`}>
        <form onSubmit={handleSubmit}>
          <div className="p-6">
            <h3 className="text-xl font-bold text-secondary">{title}</h3>
            <div className="mt-4 space-y-4 max-h-[70vh] overflow-y-auto pr-4">
              <div>
                <label htmlFor="link-professional" className="block text-sm font-medium text-gray-700">{t('userModalLinkProfessional')}</label>
                <select
                  id="link-professional"
                  value={linkedProfessionalId}
                  onChange={handleLinkProfessional}
                  className="mt-1 block w-full pl-3 pr-10 py-2 border-gray-300 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md"
                >
                  <option value="">{t('userModalLinkManual')}</option>
                  {availableProfessionals.map(prof => (
                    <option key={prof.id} value={prof.id}>{prof.name}</option>
                  ))}
                </select>
                <p className="mt-1 text-xs text-gray-500">
                  {t('userModalLinkDesc')}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">{t('userModalLabelPhoto')}</label>
                <div className="mt-1 flex items-center space-x-5">
                  <span className="inline-block h-16 w-16 rounded-full overflow-hidden bg-gray-100">
                    {photo ? (
                      <img className="h-full w-full text-gray-300 object-cover" src={photo} alt={t('userAvatar')} />
                    ) : (
                      <svg className="h-full w-full text-gray-300" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M24 20.993V24H0v-2.997A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8.999a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                    )}
                  </span>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={!!linkedProfessionalId}
                    className="px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  >
                    {t('userModalButtonUpload')}
                  </button>
                  <input ref={fileInputRef} type="file" onChange={handlePhotoChange} accept="image/*" className="hidden" />
                </div>
              </div>
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">{t('userModalLabelFullName')}</label>
                <input type="text" id="name" name="name" value={formData.name} onChange={handleChange} required disabled={!!linkedProfessionalId} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary disabled:bg-gray-100 disabled:text-gray-500" />
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">{t('userModalLabelEmail')}</label>
                <input type="email" id="email" name="email" value={formData.email} onChange={handleChange} required disabled={!!linkedProfessionalId} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary disabled:bg-gray-100 disabled:text-gray-500" />
              </div>

              <hr className="my-4" />

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  {t('userModalLabelPassword')} {userToEdit ? `(${t('userModalLabelPasswordEdit')})` : ''}
                </label>
                <div className="mt-1 relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    name="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required={!userToEdit}
                    minLength={6}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    aria-label={showPassword ? t('loginHidePassword') : t('loginShowPassword')}
                  >
                    {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                  </button>
                </div>
              </div>
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">{t('userModalLabelConfirmPassword')}</label>
                <div className="mt-1 relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    id="confirmPassword"
                    name="confirmPassword"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required={!userToEdit || !!password}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    aria-label={showConfirmPassword ? t('loginHidePassword') : t('loginShowPassword')}
                  >
                    {showConfirmPassword ? <EyeOffIcon /> : <EyeIcon />}
                  </button>
                </div>
                {passwordError && <p className="text-sm text-red-600 mt-1">{passwordError}</p>}
              </div>

              <hr className="my-4" />

              {userToEdit && (
                <div>
                  <label htmlFor="role" className="block text-sm font-medium text-gray-700">{t('userModalLabelRole')}</label>
                  <select id="role" name="role" value={formData.role} onChange={handleChange} required disabled={!!linkedProfessionalId} className="mt-1 block w-full pl-3 pr-10 py-2 border-gray-300 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md disabled:bg-gray-100 disabled:text-gray-500">
                    <option value="Administrador">{t('roleAdmin')}</option>
                    <option value="Gerente">{t('roleManager')}</option>
                    <option value="Profissional">{t('roleProfessional')}</option>
                    <option value="Concierge">{t('roleConcierge')}</option>
                  </select>
                </div>
              )}

              <div className="mt-4 pt-4 border-t">
                <h4 className="text-md font-medium text-gray-800">{t('userModalSectionPermissions')}</h4>
                <p className="text-sm text-gray-500 mb-4">{t('userModalDescPermissions')}</p>

                <div className="overflow-x-auto border rounded-lg">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('permission')}</th>
                        {permissionActions.map((action) => {
                          const allColumnChecked = permissionsList.flatMap(g => g.items).every(perm => permissions[perm.id]?.[action]);
                          const someColumnChecked = permissionsList.flatMap(g => g.items).some(perm => permissions[perm.id]?.[action]);
                          return (
                            <th key={action} className="py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                              <div className="flex flex-col items-center">
                                <span>{actionLabels[action]}</span>
                                <input
                                  type="checkbox"
                                  ref={el => el && (el.indeterminate = someColumnChecked && !allColumnChecked)}
                                  checked={allColumnChecked}
                                  onChange={(e) => handleColumnMasterChange(action, e.target.checked)}
                                  className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded mt-1"
                                />
                              </div>
                            </th>
                          );
                        })}
                        <th className="py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">{t('all')}</th>
                      </tr>
                    </thead>
                    {permissionsList.map((group) => (
                      <tbody key={group.category} className="bg-white divide-y divide-gray-200">
                        <tr className="bg-light">
                          <td colSpan={6} className="px-4 py-2 text-sm font-semibold text-gray-800">
                            {group.category}
                          </td>
                        </tr>
                        {group.items.map((perm) => {
                          const permDetails = permissions[perm.id] || { create: false, view: false, delete: false, export: false };
                          const allRowChecked = permissionActions.every(action => permDetails[action]);
                          const someRowChecked = permissionActions.some(action => permDetails[action]);
                          return (
                            <tr key={perm.id}>
                              <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">{perm.label}</td>
                              {permissionActions.map((action) => (
                                <td key={action} className="py-3 whitespace-nowrap text-center">
                                  <input
                                    type="checkbox"
                                    checked={!!permDetails[action]}
                                    onChange={(e) => handlePermissionChange(perm.id, action, e.target.checked)}
                                    className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                                  />
                                </td>
                              ))}
                              <td className="py-3 whitespace-nowrap text-center">
                                <input
                                  type="checkbox"
                                  ref={el => el && (el.indeterminate = someRowChecked && !allRowChecked)}
                                  checked={allRowChecked}
                                  onChange={(e) => handleRowMasterChange(perm.id, e.target.checked)}
                                  className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                                />
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    ))}
                  </table>
                </div>
              </div>

            </div>
          </div>
          <div className="bg-gray-50 px-6 py-3 flex flex-row-reverse rounded-b-lg">
            <button type="submit" disabled={isUploading} className={`inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-primary text-base font-medium text-white hover:bg-primary-dark sm:ml-3 sm:w-auto sm:text-sm ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}>
              {isUploading ? 'Salvando...' : t('save')}
            </button>
            <button type="button" onClick={handleClose} className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 sm:mt-0 sm:w-auto sm:text-sm">
              {t('cancel')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UserManagementModal;
