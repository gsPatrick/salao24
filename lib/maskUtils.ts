
export const formatPhone = (value: string) => {
    const cleanValue = value.replace(/\D/g, '');
    if (cleanValue.length <= 10) {
        return cleanValue.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
    }
    return cleanValue.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3').slice(0, 15);
};

export const formatCEP = (value: string) => {
    return value.replace(/\D/g, '').replace(/(\d{5})(\d{3})/, '$1-$2').slice(0, 9);
};

export const formatCPF = (value: string) => {
    return value.replace(/\D/g, '')
        .replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
        .slice(0, 14);
};

export const formatCNPJ = (value: string) => {
    return value.replace(/\D/g, '')
        .replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5')
        .slice(0, 18);
};

export const formatCPFOrCNPJ = (value: string) => {
    const clean = value.replace(/\D/g, '');
    if (clean.length <= 11) return formatCPF(value);
    return formatCNPJ(value);
};

export const cleanMask = (value: string) => {
    return value.replace(/\D/g, '');
};
