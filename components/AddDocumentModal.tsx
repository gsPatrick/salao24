
import React, { useState, useEffect, useRef } from 'react';
import { useLanguage } from '../contexts/LanguageContext';

interface AddDocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (document: { title: string; content: string; logo: string | null }) => void;
  documentType: 'Contrato' | 'Termo';
  documentToEdit?: { title: string; content: string; logo: string | null } | null;
}

const contractTemplate = `[LOGO DA EMPRESA]
[Nome da Empresa]
[CNPJ / CPF]
[Endereço completo]
[Telefone / E-mail]

CONTRATO DE [TIPO DE SERVIÇO] Nº [XXXXXX]

Pelo presente instrumento particular, as partes abaixo identificadas:

CONTRATANTE: [Nome completo / Razão Social], inscrito(a) no CPF/CNPJ sob o nº [XXX.XXX.XXX-XX], com endereço em [endereço completo].

CONTRATADA: [Nome completo / Razão Social], inscrita no CPF/CNPJ sob o nº [XXX.XXX.XXX-XX], com sede em [endereço completo].

Têm entre si, justas e contratadas, as seguintes cláusulas:

---

### CLÁUSULA 1 – DO OBJETO
[Descreva claramente o serviço, produto ou finalidade do contrato.]

### CLÁUSULA 2 – DAS OBRIGAÇÕES
[Defina o que cada parte se compromete a fazer.]

### CLÁUSULA 3 – DO PRAZO
[Defina a duração do contrato.]

### CLÁUSULA 4 – DO VALOR E FORMA DE PAGAMENTO
[Descreva valores (ex: R$ 1.250,00), formas e datas de pagamento.]

### CLÁUSULA 5 – DA RESCISÃO
[Explique condições de cancelamento e penalidades.]

### CLÁUSULA 6 – DA CONFIDENCIALIDADE
[Inclua cláusula de sigilo, se aplicável.]

### CLÁUSULA 7 – DO FORO
[Fórum da cidade onde eventuais disputas serão tratadas.]

---

E, por estarem de acordo, as partes assinam o presente contrato de forma digital, com validade jurídica conforme a Lei nº 14.063/2020.

---

📍 **Local e data:** [Cidade], [Data completa].

🖋️ **Assinatura Digital Contratante:**  
[Espaço para assinatura digital ou campo dinâmico]

🖋️ **Assinatura Digital Contratada:**  
[Espaço para assinatura digital ou campo dinâmico]

---

📎 **Personalizações possíveis:**
- Inserir **logo da empresa** no topo.  
- Aplicar **cores corporativas**.  
- Adicionar **QR Code** para verificação de autenticidade.  
- Campos dinâmicos com dados do cliente.  
- Assinatura digital integrada (por exemplo, via **Clicksign**, **DocuSign**, **Autentique**, etc.).`;

const termTemplate = `[LOGO DA EMPRESA]
TERMO DE CONSENTIMENTO PARA USO DE IMAGEM
TERMO DE RESPONSABILIDADE PELO USO DE EQUIPAMENTOS
Eu, [NOME COMPLETO], portador(a) do CPF nº [XXX.XXX.XXX-XX], residente em [ENDEREÇO COMPLETO],
declaro que li, compreendi e concordo com os termos descritos a seguir:

📍 Local e Data: [Cidade], [Data automática]

🖋️ Assinatura Digital: ____________________________
[Nome completo do signatário]`;


const AddDocumentModal: React.FC<AddDocumentModalProps> = ({ isOpen, onClose, onSave, documentType, documentToEdit }) => {
  const { t } = useLanguage();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [logo, setLogo] = useState<string | null>(null);
  const [isExiting, setIsExiting] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      if (documentToEdit) {
        setTitle(documentToEdit.title);
        setContent(documentToEdit.content);
        setLogo(documentToEdit.logo || null);
      } else {
        setTitle('');
        setLogo(null);
        if (documentType === 'Contrato') {
          setContent(contractTemplate);
        } else if (documentType === 'Termo') {
          setContent(termTemplate);
        } else {
          setContent('');
        }
      }
    }
  }, [isOpen, documentType, documentToEdit]);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => {
      onClose();
      setIsExiting(false);
    }, 300);
  };
  
  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setLogo(event.target?.result as string);
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !content) {
        alert(t('fillAllFields'));
        return;
    }
    onSave({ title, content, logo });
    handleClose();
  };

  if (!isOpen && !isExiting) return null;

  const modalTitle = documentToEdit
    ? t('editDocumentTitle', { type: documentType })
    : t('addDocumentTitle', { type: documentType });


  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-opacity duration-300 ${isOpen ? 'opacity-100 bg-gray-500 bg-opacity-75' : 'opacity-0'}`}>
      <div className={`bg-white rounded-lg shadow-xl transform transition-all duration-300 w-full max-w-2xl ${isOpen && !isExiting ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}`}>
        <form onSubmit={handleSubmit}>
          <div className="p-6">
            <h3 className="text-xl font-bold text-secondary">{modalTitle}</h3>
            <div className="mt-4 space-y-4 max-h-[70vh] overflow-y-auto pr-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">{t('addDocumentLogoLabel')}</label>
                <div className="mt-1 flex items-center space-x-4">
                    {logo ? (
                        <img src={logo} alt="Logo preview" className="h-16 w-16 object-contain rounded-md bg-gray-100 p-1 border"/>
                    ) : (
                        <div className="h-16 w-16 bg-gray-100 rounded-md flex items-center justify-center text-gray-400 border">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                        </div>
                    )}
                    <input type="file" accept="image/*" onChange={handleLogoChange} ref={logoInputRef} className="hidden" />
                    <button type="button" onClick={() => logoInputRef.current?.click()} className="px-4 py-2 bg-white text-gray-700 border rounded-md text-sm font-medium hover:bg-gray-50">
                        {logo ? t('addDocumentChangeLogo') : t('addDocumentAttachLogo')}
                    </button>
                    {logo && (
                        <button type="button" onClick={() => setLogo(null)} className="text-sm text-red-600 hover:underline">
                            {t('remove')}
                        </button>
                    )}
                </div>
                <p className="mt-2 text-xs text-gray-500">{t('addDocumentLogoDescription')}</p>
              </div>
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700">{t('addDocumentTitleLabel')}</label>
                <input type="text" id="title" value={title} onChange={(e) => setTitle(e.target.value)} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"/>
              </div>
              <div>
                <label htmlFor="content" className="block text-sm font-medium text-gray-700">{t('addDocumentContentLabel')}</label>
                <textarea id="content" value={content} onChange={(e) => setContent(e.target.value)} required rows={8} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"/>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-6 py-3 flex flex-row-reverse rounded-b-lg">
            <button type="submit" className="inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-primary text-base font-medium text-white hover:bg-primary-dark sm:ml-3 sm:w-auto sm:text-sm">
              {t('save')}
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

export default AddDocumentModal;
