import React from 'react';
import { getImageUrl } from '../lib/api';

interface UserAvatarProps {
    src?: string | null;
    alt?: string;
    className?: string;
    size?: 'sm' | 'md' | 'lg' | 'xl';
}

const UserAvatar: React.FC<UserAvatarProps> = ({ src, alt = 'Avatar', className = '', size = 'md' }) => {
    const sizeClasses = {
        sm: 'w-8 h-8',
        md: 'w-10 h-10',
        lg: 'w-12 h-12',
        xl: 'w-20 h-20'
    };

    const isPlaceholder = !src || src.includes('pravatar') || src.includes('pixabay.com/photo/2015/10/05/22/37/blank-profile-picture');

    if (isPlaceholder) {
        return (
            <div className={`${sizeClasses[size]} rounded-full bg-gray-200 flex items-center justify-center text-gray-400 ${className}`}>
                <svg xmlns="http://www.w3.org/2000/svg" className="w-3/5 h-3/5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
            </div>
        );
    }

    return (
        <img
            src={getImageUrl(src)}
            alt={alt}
            className={`${sizeClasses[size]} rounded-full object-cover ${className}`}
        />
    );
};

export default UserAvatar;
