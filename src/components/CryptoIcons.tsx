import React from 'react';

interface CryptoIconProps {
  symbol: string;
  size?: number;
  className?: string;
  network?: string;
}

export const CryptoIcon: React.FC<CryptoIconProps> = ({ 
  symbol, 
  size = 36, 
  className = '',
  network 
}) => {
  const cleanSymbol = (symbol || '').toUpperCase().trim().replace(/[-_].*$/, '');

  const renderIcon = () => {
    switch (cleanSymbol) {
      case 'USDT':
        return (
          <svg viewBox="0 0 32 32" width={size} height={size} className="shrink-0" fill="none">
            <circle cx="16" cy="16" r="16" fill="#26A17B" />
            <path
              d="M17.922 17.383c-.088.006-.615.042-1.78.042-1.042 0-1.637-.036-1.78-.042-4.14-.187-7.233-.896-7.233-1.742 0-.846 3.093-1.554 7.233-1.742V10.15h4.15v3.791c4.14.188 7.233.896 7.233 1.742 0 .846-3.093 1.555-7.233 1.742v.001l-.59.017v6.62h-2.97v-6.68zm0-4.043v-2.073h6.985V8.163H7.093v3.104h6.985v2.073C9.75 13.528 6.5 14.39 6.5 15.684c0 1.293 3.25 2.155 7.578 2.347v7.502h3.844v-7.502c4.328-.192 7.578-1.054 7.578-2.347 0-1.294-3.25-2.156-7.578-2.348z"
              fill="#FFFFFF"
            />
          </svg>
        );

      case 'TRX':
      case 'TRON':
        return (
          <svg viewBox="0 0 32 32" width={size} height={size} className="shrink-0" fill="none">
            <circle cx="16" cy="16" r="16" fill="#EF0027" />
            <path
              d="M7 9.2l17.8 2.6-7.4 13.8L7 9.2zm1.9 1.2l9.2 11.8 4.7-8.8L8.9 10.4zm7.6 12.3l-5.6-7.2L20.8 12 16.5 22.7z"
              fill="#FFFFFF"
            />
          </svg>
        );

      case 'ETH':
      case 'ETHEREUM':
        return (
          <svg viewBox="0 0 32 32" width={size} height={size} className="shrink-0" fill="none">
            <circle cx="16" cy="16" r="16" fill="#627EEA" />
            <path d="M16 4l-7.5 12.5L16 20.9l7.5-4.4L16 4z" fill="#FFFFFF" fillOpacity="0.7" />
            <path d="M16 4v16.9l7.5-4.4L16 4z" fill="#FFFFFF" />
            <path d="M16 22.3l-7.5-4.4L16 28l7.5-10.1-7.5 4.4z" fill="#FFFFFF" fillOpacity="0.7" />
            <path d="M16 22.3v5.7l7.5-10.1-7.5 4.4z" fill="#FFFFFF" />
            <path d="M8.5 16.5L16 20.9V13L8.5 16.5z" fill="#FFFFFF" fillOpacity="0.3" />
            <path d="M16 20.9l7.5-4.4L16 13v7.9z" fill="#FFFFFF" fillOpacity="0.5" />
          </svg>
        );

      case 'BNB':
      case 'BSC':
        return (
          <svg viewBox="0 0 32 32" width={size} height={size} className="shrink-0" fill="none">
            <circle cx="16" cy="16" r="16" fill="#F3BA2F" />
            <path
              d="M12.116 14.404L16 10.52l3.886 3.886 2.26-2.26L16 6l-6.144 6.144 2.26 2.26zm-6.116 1.596l2.26-2.26 2.26 2.26-2.26 2.26-2.26-2.26zm6.116 1.596L16 21.48l3.886-3.884 2.26 2.26L16 26l-6.144-6.144 2.26-2.26zm13.884-1.596l2.26-2.26 2.26 2.26-2.26 2.26-2.26-2.26zm-7.768 0L16 13.784l2.216 2.216L16 18.216l-2.216-2.216H12.116z"
              fill="#FFFFFF"
            />
          </svg>
        );

      case 'BTC':
      case 'BITCOIN':
        return (
          <svg viewBox="0 0 32 32" width={size} height={size} className="shrink-0" fill="none">
            <circle cx="16" cy="16" r="16" fill="#F7931A" />
            <path
              d="M22.5 13.8c-.3-2-1.6-2.9-3.7-3.2V8h-2.1v2.5c-.5-.1-1.1-.2-1.7-.3V8h-2.1v2.5H9.8v2.2s1.2 0 1.2.1c.7 0 .9.4.9.7v7.5c0 .3-.2.7-.9.7 0 0-1.2 0-1.2.1v2.2h3.1v2.5h2.1v-2.5c.6.1 1.1.2 1.7.3V26h2.1v-2.5c3.6.7 5.7-.9 6-4 .2-1.9-.7-3.1-2.2-3.7 1.3-.5 2-1.4 1.7-2zM19.4 19c-.3 2-2.8 1.5-4.4 1.2v-3.7c1.6.4 4.7-.2 4.4 2.5zm-.5-5.2c-.3 1.8-2.4 1.3-3.9 1v-3.3c1.5.3 4.2-.3 3.9 2.3z"
              fill="#FFFFFF"
            />
          </svg>
        );

      case 'SOL':
      case 'SOLANA':
        return (
          <svg viewBox="0 0 32 32" width={size} height={size} className="shrink-0" fill="none">
            <circle cx="16" cy="16" r="16" fill="#121620" />
            <path
              d="M8.2 21.6l2.8-2.8h12.8l-2.8 2.8H8.2zm2.8-5.6l-2.8-2.8h12.8l2.8 2.8H11zm-2.8-5.6l2.8-2.8h12.8l-2.8 2.8H8.2z"
              fill="url(#solGradient)"
            />
            <defs>
              <linearGradient id="solGradient" x1="8" y1="8" x2="24" y2="24" gradientUnits="userSpaceOnUse">
                <stop stopColor="#00FFA3" />
                <stop offset="1" stopColor="#DC1FFF" />
              </linearGradient>
            </defs>
          </svg>
        );

      case 'POL':
      case 'MATIC':
      case 'POLYGON':
        return (
          <svg viewBox="0 0 32 32" width={size} height={size} className="shrink-0" fill="none">
            <circle cx="16" cy="16" r="16" fill="#8247E5" />
            <path
              d="M20.8 13.6c-.6-.4-1.4-.4-2 0l-3.2 1.8-2.1 1.2-3.2 1.8c-.6.4-1.4.4-2 0l-2.6-1.5c-.6-.4-1-1-1-1.7s.4-1.3 1-1.7l2.6-1.5c.6-.4 1.4-.4 2 0l2.6 1.5c.6.4 1 1 1 1.7v2.1l2.1-1.2v-2.1c0-.7-.4-1.3-1-1.7l-4.7-2.7c-.6-.4-1.4-.4-2 0l-4.7 2.7c-.6.4-1 1-1 1.7v5.4c0 .7.4 1.3 1 1.7l4.7 2.7c.6.4 1.4.4 2 0l3.2-1.8 2.1-1.2 3.2-1.8c.6-.4 1.4-.4 2 0l2.6 1.5c.6.4 1 1 1 1.7s-.4 1.3-1 1.7l-2.6 1.5c-.6.4-1.4.4-2 0l-2.6-1.5c-.6-.4-1-1-1-1.7v-2.1l-2.1 1.2v2.1c0 .7.4 1.3 1 1.7l4.7 2.7c.6.4 1.4.4 2 0l4.7-2.7c.6-.4 1-1 1-1.7v-5.4c0-.7-.4-1.3-1-1.7l-4.7-2.7z"
              fill="#FFFFFF"
            />
          </svg>
        );

      case 'USDC':
        return (
          <svg viewBox="0 0 32 32" width={size} height={size} className="shrink-0" fill="none">
            <circle cx="16" cy="16" r="16" fill="#2775CA" />
            <path
              d="M16 6C10.5 6 6 10.5 6 16s4.5 10 10 10 10-4.5 10-10S21.5 6 16 6zm0 18.2c-4.5 0-8.2-3.7-8.2-8.2S11.5 7.8 16 7.8s8.2 3.7 8.2 8.2-3.7 8.2-8.2 8.2zm1.2-11.4c-1.8-.2-2.5.7-2.5 1.5 0 1.2 1.3 1.6 2.7 1.9 1.6.4 2.7 1 2.7 2.6 0 1.7-1.4 2.6-3.2 2.7v1.2h-1.6v-1.2c-1.4-.2-2.4-.8-2.7-1.8l1.7-.7c.2.6.8 1.1 1.8 1.1 1.1 0 1.9-.5 1.9-1.4 0-1.1-.9-1.5-2.5-1.9-1.7-.4-2.8-1-2.8-2.6 0-1.5 1.3-2.5 3-2.6V9.8h1.6v1.2c1.2.2 2.1.8 2.3 1.6l-1.7.7c-.1-.4-.6-.7-1.4-.7z"
              fill="#FFFFFF"
            />
          </svg>
        );

      case 'DAI':
        return (
          <svg viewBox="0 0 32 32" width={size} height={size} className="shrink-0" fill="none">
            <circle cx="16" cy="16" r="16" fill="#F5AC37" />
            <path
              d="M10 8.5h6.8c3.9 0 6.6 2.5 7.1 6.1H25v1.8h-1.2c-.3 3.7-3 6.1-7 6.1H10V8.5zm2.4 2.4v3.7h9.5c-.3-2.2-2.1-3.7-4.7-3.7h-4.8zm0 5.5v3.7h4.8c2.6 0 4.4-1.5 4.7-3.7h-9.5z"
              fill="#FFFFFF"
            />
          </svg>
        );

      case 'BUSD':
        return (
          <svg viewBox="0 0 32 32" width={size} height={size} className="shrink-0" fill="none">
            <circle cx="16" cy="16" r="16" fill="#F0B90B" />
            <path
              d="M10.5 8h5.2c2.6 0 4.3 1.3 4.3 3.3 0 1.3-.8 2.3-1.9 2.8 1.5.4 2.4 1.6 2.4 3.2 0 2.2-1.9 3.7-4.8 3.7h-5.2V8zm2.6 2.2v3.1h2.4c1.2 0 1.9-.6 1.9-1.5s-.7-1.6-1.9-1.6h-2.4zm0 5.2v3.4h2.6c1.3 0 2.2-.7 2.2-1.7s-.9-1.7-2.2-1.7h-2.6z"
              fill="#FFFFFF"
            />
          </svg>
        );

      case 'ARB':
      case 'ARBITRUM':
        return (
          <svg viewBox="0 0 32 32" width={size} height={size} className="shrink-0" fill="none">
            <circle cx="16" cy="16" r="16" fill="#28A0F0" />
            <path
              d="M16 6.5l-8.5 14.7 3.5 2.1L16 15.2l4.9 8.1 3.5-2.1L16 6.5zm0 5.2l4.6 7.8h-9.2L16 11.7z"
              fill="#FFFFFF"
            />
          </svg>
        );

      case 'AVAX':
      case 'AVALANCHE':
        return (
          <svg viewBox="0 0 32 32" width={size} height={size} className="shrink-0" fill="none">
            <circle cx="16" cy="16" r="16" fill="#E84142" />
            <path
              d="M17.4 8.5c-.6-1-2-1-2.6 0L8.2 21.6c-.6 1 .1 2.3 1.3 2.3h4.4c.5 0 1-.3 1.3-.7l2.8-5 1.8 3.3c.3.5.8.7 1.3.7h2.7c1.2 0 1.9-1.3 1.3-2.3L17.4 8.5z"
              fill="#FFFFFF"
            />
          </svg>
        );

      case 'XRP':
        return (
          <svg viewBox="0 0 32 32" width={size} height={size} className="shrink-0" fill="none">
            <circle cx="16" cy="16" r="16" fill="#23292F" />
            <path
              d="M23.5 9h2.2l-5.8 5.7c-1.8 1.8-4.8 1.8-6.6 0L7.5 9h2.2l4.8 4.7c1 1 2.6 1 3.6 0L23.5 9zm-15 14H6.3l5.8-5.7c1.8-1.8 4.8-1.8 6.6 0l5.8 5.7h-2.2l-4.8-4.7c-1-1-2.6-1-3.6 0L8.5 23z"
              fill="#FFFFFF"
            />
          </svg>
        );

      case 'DOGE':
        return (
          <svg viewBox="0 0 32 32" width={size} height={size} className="shrink-0" fill="none">
            <circle cx="16" cy="16" r="16" fill="#C2A633" />
            <path
              d="M11 9h5.8c4.2 0 7.2 2.8 7.2 7s-3 7-7.2 7H11V9zm3.2 2.8v8.4h2.4c2.5 0 4.1-1.7 4.1-4.2s-1.6-4.2-4.1-4.2h-2.4zm-4.2 4.2h6.5v1.6H10V16z"
              fill="#FFFFFF"
            />
          </svg>
        );

      case 'ADA':
      case 'CARDANO':
        return (
          <svg viewBox="0 0 32 32" width={size} height={size} className="shrink-0" fill="none">
            <circle cx="16" cy="16" r="16" fill="#0033AD" />
            <circle cx="16" cy="16" r="3.2" fill="#FFFFFF" />
            <circle cx="16" cy="8" r="1.4" fill="#FFFFFF" />
            <circle cx="16" cy="24" r="1.4" fill="#FFFFFF" />
            <circle cx="8" cy="16" r="1.4" fill="#FFFFFF" />
            <circle cx="24" cy="16" r="1.4" fill="#FFFFFF" />
            <circle cx="10.3" cy="10.3" r="1.2" fill="#FFFFFF" />
            <circle cx="21.7" cy="10.3" r="1.2" fill="#FFFFFF" />
            <circle cx="10.3" cy="21.7" r="1.2" fill="#FFFFFF" />
            <circle cx="21.7" cy="21.7" r="1.2" fill="#FFFFFF" />
          </svg>
        );

      case 'LINK':
        return (
          <svg viewBox="0 0 32 32" width={size} height={size} className="shrink-0" fill="none">
            <circle cx="16" cy="16" r="16" fill="#375BD2" />
            <path
              d="M16 8l-6.9 4v8L16 24l6.9-4v-8L16 8zm4.4 10.4l-4.4 2.5-4.4-2.5v-5l4.4-2.5 4.4 2.5v5z"
              fill="#FFFFFF"
            />
          </svg>
        );

      default:
        return (
          <div 
            style={{ width: size, height: size }}
            className="flex items-center justify-center rounded-full bg-[#2980fe]/10 text-[#2980fe] border border-[#2980fe]/20 font-bold text-xs shrink-0"
          >
            {cleanSymbol.slice(0, 3)}
          </div>
        );
    }
  };

  return (
    <div className={`relative inline-flex items-center justify-center ${className}`}>
      {renderIcon()}
      {network && (
        <span className="absolute -bottom-1 -right-1 px-1 py-0.2 bg-white dark:bg-[#121620] border border-[#e5e7eb] dark:border-[#2a3447] text-[8px] font-black font-mono rounded-md shadow-xs text-[#1e2024] dark:text-white leading-none">
          {network}
        </span>
      )}
    </div>
  );
};

export const TokenPocketLogo: React.FC<{ size?: number; className?: string }> = ({ size = 32, className = '' }) => (
  <svg viewBox="0 0 40 40" width={size} height={size} className={`shrink-0 ${className}`} fill="none">
    <rect width="40" height="40" rx="12" fill="url(#tpGradient)" />
    <path
      d="M12 12h16c1.1 0 2 .9 2 2v3c0 1.1-.9 2-2 2h-9v9c0 1.1-.9 2-2 2h-3c-1.1 0-2-.9-2-2V14c0-1.1.9-2 2-2z"
      fill="#FFFFFF"
    />
    <path
      d="M21 21h6c1.1 0 2 .9 2 2v3c0 1.1-.9 2-2 2h-6c-1.1 0-2-.9-2-2v-3c0-1.1.9-2 2-2z"
      fill="#FFFFFF"
      fillOpacity="0.85"
    />
    <defs>
      <linearGradient id="tpGradient" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
        <stop stopColor="#2980FE" />
        <stop offset="1" stopColor="#1E58E6" />
      </linearGradient>
    </defs>
  </svg>
);

export const BinanceLogo: React.FC<{ size?: number; className?: string }> = ({ size = 32, className = '' }) => (
  <svg viewBox="0 0 32 32" width={size} height={size} className={`shrink-0 ${className}`} fill="none">
    <rect width="32" height="32" rx="8" fill="#181A20" />
    <path
      d="M12.116 14.404L16 10.52l3.886 3.886 2.26-2.26L16 6l-6.144 6.144 2.26 2.26zm-6.116 1.596l2.26-2.26 2.26 2.26-2.26 2.26-2.26-2.26zm6.116 1.596L16 21.48l3.886-3.884 2.26 2.26L16 26l-6.144-6.144 2.26-2.26zm13.884-1.596l2.26-2.26 2.26 2.26-2.26 2.26-2.26-2.26zm-7.768 0L16 13.784l2.216 2.216L16 18.216l-2.216-2.216H12.116z"
      fill="#F0B90B"
    />
  </svg>
);

export const GoogleAuthLogo: React.FC<{ size?: number; className?: string }> = ({ size = 32, className = '' }) => (
  <svg viewBox="0 0 32 32" width={size} height={size} className={`shrink-0 ${className}`} fill="none">
    <circle cx="16" cy="16" r="16" fill="#4285F4" />
    <path
      d="M16 7c-4.4 0-8 3.6-8 8s3.6 8 8 8 8-3.6 8-8-3.6-8-8-8zm0 2.5c3 0 5.5 2.5 5.5 5.5s-2.5 5.5-5.5 5.5-5.5-2.5-5.5-5.5 2.5-5.5 5.5-5.5z"
      fill="#FFFFFF"
      fillOpacity="0.4"
    />
    <path
      d="M16 11v5l4 2.5-.8 1.3L14.5 17V11H16z"
      fill="#FFFFFF"
    />
  </svg>
);

export const TelegramLogo: React.FC<{ size?: number; className?: string }> = ({ size = 32, className = '' }) => (
  <svg viewBox="0 0 32 32" width={size} height={size} className={`shrink-0 ${className}`} fill="none">
    <circle cx="16" cy="16" r="16" fill="#229ED9" />
    <path
      d="M7.8 15.5l14-5.4c.6-.2 1.2.2 1 .8l-2.4 11.2c-.2.8-.7 1-1.3.6l-3.6-2.7-1.7 1.7c-.2.2-.4.4-.8.4l.3-3.6 6.6-6c.3-.3-.1-.4-.4-.2l-8.2 5.2-3.5-1.1c-.8-.2-.8-.8.1-1.1z"
      fill="#FFFFFF"
    />
  </svg>
);

export const WhatsAppLogo: React.FC<{ size?: number; className?: string }> = ({ size = 32, className = '' }) => (
  <svg viewBox="0 0 32 32" width={size} height={size} className={`shrink-0 ${className}`} fill="none">
    <circle cx="16" cy="16" r="16" fill="#25D366" />
    <path
      d="M16 7.5c-4.7 0-8.5 3.8-8.5 8.5 0 1.5.4 3 1.1 4.2L7.5 24.5l4.5-1.1c1.2.7 2.6 1.1 4 1.1 4.7 0 8.5-3.8 8.5-8.5S20.7 7.5 16 7.5zm4.9 12.1c-.2.6-1.2 1.1-1.7 1.2-.5.1-1.1.2-3.3-.7-2.7-1.1-4.4-3.8-4.5-4-.1-.2-1.1-1.5-1.1-2.8s.7-2 1-2.3c.2-.3.6-.4.9-.4h.6c.2 0 .5 0 .7.5.3.6.9 2.2 1 2.3.1.2.1.4 0 .6-.1.2-.2.4-.4.6-.2.2-.4.4-.6.6-.2.2-.4.4-.2.8.2.4.9 1.5 2 2.4 1.3 1.2 2.5 1.5 2.8 1.7.4.2.6.1.8-.1.2-.3.9-1.1 1.2-1.4.3-.4.6-.3.9-.2.3.1 2.1 1 2.4 1.2.4.2.6.3.7.5.1.2.1 1-.1 1.6z"
      fill="#FFFFFF"
    />
  </svg>
);
