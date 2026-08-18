import React from 'react';
import { CharacterId } from '../types';

interface CharacterAvatarProps {
  id: CharacterId;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  className?: string;
  showBadge?: boolean;
}

export const CharacterAvatar: React.FC<CharacterAvatarProps> = ({
  id,
  size = 'md',
  className = '',
  showBadge = false,
}) => {
  const sizeClasses = {
    xs: 'w-6 h-6',
    sm: 'w-8 h-8',
    md: 'w-11 h-11',
    lg: 'w-16 h-16',
    xl: 'w-24 h-24',
    '2xl': 'w-32 h-32',
  }[size];

  const renderVector = () => {
    switch (id) {
      case 'modi':
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-sm" fill="none">
            {/* Background disc */}
            <circle cx="50" cy="50" r="48" fill="#FFF7ED" stroke="#F97316" strokeWidth="3" />
            {/* Saffron Kurta / Nehru Jacket */}
            <path d="M22 88 C25 65, 75 65, 78 88 Z" fill="#F97316" />
            <path d="M43 65 L43 90 M57 65 L57 90" stroke="#C2410C" strokeWidth="2" />
            <path d="M47 68 L53 68 M47 76 L53 76 M47 84 L53 84" stroke="#FFF" strokeWidth="2" strokeLinecap="round" />
            
            {/* Neck */}
            <rect x="42" y="52" width="16" height="15" fill="#FED7AA" />
            
            {/* Face */}
            <ellipse cx="50" cy="42" rx="22" ry="24" fill="#FED7AA" />
            
            {/* White Beard and Hair */}
            <path d="M28 36 C28 20, 72 20, 72 36 C72 45, 75 52, 70 56 C65 62, 58 72, 50 72 C42 72, 35 62, 30 56 C25 52, 28 45, 28 36 Z" fill="#F1F5F9" opacity="0.95" />
            <ellipse cx="50" cy="40" rx="17" ry="19" fill="#FED7AA" />
            
            {/* White Hair on top */}
            <path d="M30 32 C32 20, 68 20, 70 32 C68 26, 32 26, 30 32 Z" fill="#E2E8F0" />
            
            {/* White Mustache */}
            <path d="M38 48 C44 48, 48 53, 50 56 C52 53, 56 48, 62 48 C66 48, 62 55, 50 59 C38 55, 34 48, 38 48 Z" fill="#E2E8F0" />
            
            {/* Glasses */}
            <rect x="34" y="36" width="12" height="9" rx="3" fill="#E0F2FE" fillOpacity="0.6" stroke="#475569" strokeWidth="1.8" />
            <rect x="54" y="36" width="12" height="9" rx="3" fill="#E0F2FE" fillOpacity="0.6" stroke="#475569" strokeWidth="1.8" />
            <path d="M46 40 L54 40" stroke="#475569" strokeWidth="1.8" />
            
            {/* Eyes */}
            <circle cx="40" cy="40" r="1.5" fill="#1E293B" />
            <circle cx="60" cy="40" r="1.5" fill="#1E293B" />
            
            {/* Smile / Tilak */}
            <path d="M48 24 L52 24 L50 29 Z" fill="#EF4444" />
          </svg>
        );

      case 'kejriwal':
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-sm" fill="none">
            {/* Background disc */}
            <circle cx="50" cy="50" r="48" fill="#F0F9FF" stroke="#0284C7" strokeWidth="3" />
            
            {/* Blue Sweater / Shirt */}
            <path d="M22 88 C25 65, 75 65, 78 88 Z" fill="#0284C7" />
            
            {/* Iconic Muffler wrapped around neck */}
            <path d="M28 62 C34 52, 66 52, 72 62 C74 72, 68 84, 50 84 C32 84, 26 72, 28 62 Z" fill="#78350F" />
            {/* Muffler tail hanging down */}
            <path d="M34 68 L32 94 L44 94 L42 68 Z" fill="#92400E" stroke="#78350F" strokeWidth="1.5" />
            {/* Muffler stripes */}
            <line x1="33" y1="78" x2="43" y2="78" stroke="#FDE68A" strokeWidth="2" />
            <line x1="32" y1="86" x2="44" y2="86" stroke="#FDE68A" strokeWidth="2" />
            
            {/* Face */}
            <ellipse cx="50" cy="40" rx="19" ry="20" fill="#FED7AA" />
            
            {/* Iconic Gandhi / AAP Top Cap */}
            <path d="M28 26 C35 15, 65 15, 72 26 L68 32 L32 32 Z" fill="#F8FAFC" stroke="#94A3B8" strokeWidth="1.5" />
            <line x1="34" y1="28" x2="66" y2="28" stroke="#CBD5E1" strokeWidth="1" />
            
            {/* Black Hair sides */}
            <path d="M30 32 C30 44, 28 48, 32 50 C33 44, 34 36, 35 32 Z" fill="#1E293B" />
            <path d="M70 32 C70 44, 72 48, 68 50 C67 44, 66 36, 65 32 Z" fill="#1E293B" />
            
            {/* Glasses */}
            <rect x="34" y="35" width="12" height="9" rx="2" fill="#E0F2FE" fillOpacity="0.6" stroke="#0F172A" strokeWidth="2" />
            <rect x="54" y="35" width="12" height="9" rx="2" fill="#E0F2FE" fillOpacity="0.6" stroke="#0F172A" strokeWidth="2" />
            <path d="M46 39 L54 39" stroke="#0F172A" strokeWidth="2" />
            
            {/* Eyes */}
            <circle cx="40" cy="39" r="1.8" fill="#0F172A" />
            <circle cx="60" cy="39" r="1.8" fill="#0F172A" />
            
            {/* Signature Thick Dark Mustache */}
            <path d="M37 49 C43 47, 47 52, 50 53 C53 52, 57 47, 63 49 C60 54, 40 54, 37 49 Z" fill="#0F172A" />
            
            {/* Simple mouth under mustache */}
            <path d="M46 56 C48 58, 52 58, 54 56" stroke="#9A3412" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        );

      case 'rahul':
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-sm" fill="none">
            {/* Background disc */}
            <circle cx="50" cy="50" r="48" fill="#ECFDF5" stroke="#10B981" strokeWidth="3" />
            
            {/* Iconic White Polo T-Shirt with collar */}
            <path d="M22 88 C25 65, 75 65, 78 88 Z" fill="#F8FAFC" stroke="#E2E8F0" strokeWidth="1.5" />
            {/* Polo collar */}
            <path d="M40 64 L50 74 L60 64 L54 62 L50 67 L46 62 Z" fill="#E2E8F0" stroke="#CBD5E1" strokeWidth="1" />
            
            {/* Neck */}
            <rect x="42" y="52" width="16" height="14" fill="#FED7AA" />
            
            {/* Face */}
            <ellipse cx="50" cy="39" rx="19" ry="21" fill="#FED7AA" />
            
            {/* Dark groomed hair */}
            <path d="M30 33 C30 18, 70 18, 70 33 C70 30, 65 22, 50 22 C35 22, 30 30, 30 33 Z" fill="#1E293B" />
            {/* Side burns */}
            <path d="M30 32 L31 44 L34 42 L34 32 Z" fill="#1E293B" />
            <path d="M70 32 L69 44 L66 42 L66 32 Z" fill="#1E293B" />
            
            {/* Groomed stubble / salt-pepper light beard */}
            <path d="M33 42 C33 55, 40 62, 50 62 C60 62, 67 55, 67 42 C67 44, 63 58, 50 58 C37 58, 33 44, 33 42 Z" fill="#64748B" opacity="0.5" />
            <path d="M38 48 C44 47, 48 51, 50 51 C52 51, 56 47, 62 48 C58 52, 42 52, 38 48 Z" fill="#475569" opacity="0.7" />
            
            {/* Eyebrows */}
            <path d="M35 32 Q40 29 45 32" stroke="#1E293B" strokeWidth="2.5" strokeLinecap="round" />
            <path d="M55 32 Q60 29 65 32" stroke="#1E293B" strokeWidth="2.5" strokeLinecap="round" />
            
            {/* Cheerful Eyes */}
            <ellipse cx="40" cy="36" rx="2.5" ry="3" fill="#1E293B" />
            <ellipse cx="60" cy="36" rx="2.5" ry="3" fill="#1E293B" />
            <circle cx="39" cy="35" r="1" fill="#FFF" />
            <circle cx="59" cy="35" r="1" fill="#FFF" />
            
            {/* Dimple / Smile */}
            <path d="M42 50 Q50 56 58 50" stroke="#9A3412" strokeWidth="2" strokeLinecap="round" />
            {/* Dimple marks */}
            <circle cx="38" cy="51" r="1" fill="#EA580C" opacity="0.6" />
            <circle cx="62" cy="51" r="1" fill="#EA580C" opacity="0.6" />
          </svg>
        );

      case 'trump':
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-sm" fill="none">
            {/* Background disc */}
            <circle cx="50" cy="50" r="48" fill="#FFF1F2" stroke="#E11D48" strokeWidth="3" />
            
            {/* Dark Navy Suit & Long Red Tie */}
            <path d="M22 88 C25 65, 75 65, 78 88 Z" fill="#1E293B" />
            <polygon points="44,65 56,65 54,78 46,78" fill="#FFF" />
            {/* Famous Long Red Tie */}
            <polygon points="48,68 52,68 55,95 45,95" fill="#EF4444" />
            <polygon points="47,68 53,68 52,73 48,73" fill="#DC2626" />
            
            {/* Neck */}
            <rect x="42" y="52" width="16" height="15" fill="#FFEDD5" />
            
            {/* Face - Tanned tone */}
            <ellipse cx="50" cy="41" rx="20" ry="21" fill="#FDBA74" />
            
            {/* Lighter eye circles (goggle tan) */}
            <ellipse cx="40" cy="36" rx="6" ry="5" fill="#FED7AA" />
            <ellipse cx="60" cy="36" rx="6" ry="5" fill="#FED7AA" />
            
            {/* Eyes */}
            <circle cx="40" cy="36" r="2" fill="#1E3A8A" />
            <circle cx="60" cy="36" r="2" fill="#1E3A8A" />
            
            {/* Iconic Blonde Swept Hair */}
            <path d="M24 30 C20 15, 62 10, 78 22 C82 28, 76 34, 72 38 C68 32, 60 22, 45 22 C32 22, 26 26, 24 30 Z" fill="#FACC15" stroke="#EAB308" strokeWidth="1" />
            <path d="M25 30 C30 20, 50 18, 72 26 C68 22, 48 18, 30 24 Z" fill="#FEF08A" />
            
            {/* Blonde Eyebrows */}
            <path d="M34 30 Q40 27 45 30" stroke="#FBBF24" strokeWidth="2.5" strokeLinecap="round" />
            <path d="M55 30 Q60 27 66 30" stroke="#FBBF24" strokeWidth="2.5" strokeLinecap="round" />
            
            {/* Open talking / shouting mouth */}
            <ellipse cx="50" cy="51" rx="6" ry="4" fill="#881337" />
            <path d="M47 49 Q50 51 53 49" fill="#FFF" />
          </svg>
        );
    }
  };

  return (
    <div className={`relative inline-flex items-center justify-center shrink-0 ${sizeClasses} ${className}`}>
      {renderVector()}
      {showBadge && (
        <span className="absolute -bottom-1 -right-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-neutral-900 text-white border border-white/40 shadow-xs uppercase">
          {id[0]}
        </span>
      )}
    </div>
  );
};
