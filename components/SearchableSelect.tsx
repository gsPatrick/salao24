import React, { useState, useRef, useEffect } from 'react';

export interface SearchableSelectProps {
    label?: string;
    name: string;
    value: string;
    onChange: (e: { target: { name: string; value: string } }) => void;
    options: { value: string; label: string }[];
    placeholder?: string;
    required?: boolean;
    error?: string;
    className?: string;
}

export const SearchableSelect: React.FC<SearchableSelectProps> = ({
    label,
    name,
    value,
    onChange,
    options,
    placeholder = 'Selecione...',
    required,
    error,
    className = ''
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState('');
    const wrapperRef = useRef<HTMLDivElement>(null);

    // Find current label
    const selectedOption = options.find((opt) => opt.value === value);
    const displayValue = selectedOption ? selectedOption.label : '';

    const [openUpward, setOpenUpward] = useState(false);

    useEffect(() => {
        if (isOpen && wrapperRef.current) {
            const rect = wrapperRef.current.getBoundingClientRect();
            const spaceBelow = window.innerHeight - rect.bottom;
            const dropdownHeight = 250; // Approximated max-h-60
            if (spaceBelow < dropdownHeight && rect.top > dropdownHeight) {
                setOpenUpward(true);
            } else {
                setOpenUpward(false);
            }
        }
    }, [isOpen]);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [wrapperRef]);

    const filteredOptions = options.filter(opt =>
        opt.label.toLowerCase().includes(search.toLowerCase())
    );

    const handleSelect = (selectedValue: string) => {
        onChange({ target: { name, value: selectedValue } });
        setIsOpen(false);
        setSearch('');
    };

    return (
        <div className={`relative ${className} ${isOpen ? 'z-[9999]' : 'z-10'}`} ref={wrapperRef}>
            {label && (
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    {label} {required && <span className="text-red-500">*</span>}
                </label>
            )}

            <div
                className={`w-full p-2 bg-white border rounded-md shadow-sm flex justify-between items-center cursor-pointer ${error ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-primary focus:border-primary'} ${isOpen ? 'ring-2 ring-primary/20 border-primary' : ''}`}
                onClick={() => {
                    setIsOpen(!isOpen);
                    if (!isOpen) setSearch('');
                }}
            >
                <span className={displayValue ? "text-gray-900 truncate" : "text-gray-400"}>
                    {displayValue || placeholder}
                </span>
                <svg className={`w-5 h-5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
            </div>

            {isOpen && (
                <div className={`absolute z-[9999] w-full bg-white border border-gray-200 rounded-lg shadow-xl max-h-60 overflow-hidden flex flex-col transition-all duration-200 ease-out origin-top ${openUpward ? 'bottom-full mb-1' : 'top-full mt-1'}`}>
                    <div className="p-2 border-b border-gray-100 bg-gray-50/50">
                        <input
                            type="text"
                            autoFocus
                            className="w-full p-2 text-sm border border-gray-200 rounded-md outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                            placeholder="Pesquisar..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            onClick={(e) => e.stopPropagation()}
                        />
                    </div>
                    <div className="overflow-y-auto flex-1 p-1">
                        {filteredOptions.length > 0 ? (
                            filteredOptions.map((opt) => (
                                <div
                                    key={opt.value}
                                    className={`px-3 py-2 text-sm cursor-pointer rounded-md ${opt.value === value ? 'bg-primary/10 text-primary font-medium' : 'hover:bg-gray-100 text-gray-700'}`}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleSelect(opt.value);
                                    }}
                                >
                                    {opt.label}
                                </div>
                            ))
                        ) : (
                            <div className="px-3 py-4 text-sm text-center text-gray-500">
                                Nenhum resultado encontrado
                            </div>
                        )}
                    </div>
                </div>
            )}

            <input type="hidden" name={name} value={value} />

            {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
        </div>
    );
};
