import React from 'react';
import { NumericFormat, NumericFormatProps } from 'react-number-format';

interface CurrencyInputProps extends Omit<NumericFormatProps, 'onValueChange'> {
    value: string | number;
    onChange: (value: string) => void;
    label?: string;
    error?: string;
    className?: string;
    placeholder?: string;
    disabled?: boolean;
    name?: string;
}

const CurrencyInput: React.FC<CurrencyInputProps> = ({
    value,
    onChange,
    label,
    error,
    className = '',
    placeholder = 'R$ ',
    disabled = false,
    name,
    ...props
}) => {
    return (
        <div className="w-full">
            <NumericFormat
                {...props}
                name={name}
                value={value}
                onValueChange={(values) => onChange(values.value)}
                thousandSeparator="."
                decimalSeparator=","
                prefix="R$ "
                decimalScale={2}
                fixedDecimalScale={false}
                isNumericString={true}
                allowDecimalSeparator={true}
                disabled={disabled}
                placeholder={placeholder}
                className={`w-full p-2 border rounded shadow-sm focus:ring-primary focus:border-primary transition-colors disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed ${error ? 'border-red-500' : 'border-gray-300'
                    } ${className}`}
            />
            {label && (
                <p className="text-[10px] text-gray-400 mt-1 ml-1 uppercase font-bold tracking-wider">
                    {label}
                </p>
            )}
            {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
        </div>
    );
};

export default CurrencyInput;
