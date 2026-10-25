import React from 'react';
import { Sun, Moon, Monitor } from 'lucide-react';
import { useTheme, type ThemePreference } from '../../context/ThemeContext';

export interface ThemeSwitcherProps {
  variant?: 'segmented' | 'cards' | 'button';
  showLabel?: boolean;
  className?: string;
}

export const ThemeSwitcher: React.FC<ThemeSwitcherProps> = ({
  variant = 'segmented',
  showLabel = true,
  className = ''
}) => {
  const { themePreference, resolvedTheme, setThemePreference, toggleTheme } = useTheme();

  // 1. QUICK BUTTON TOGGLE (For Header or navigation bar)
  if (variant === 'button') {
    return (
      <button
        type="button"
        onClick={toggleTheme}
        aria-label={`Switch to ${resolvedTheme === 'dark' ? 'light' : 'dark'} mode`}
        title={`Currently in ${resolvedTheme} mode. Click to toggle.`}
        className={`theme-toggle-btn ${className}`}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '36px',
          height: '36px',
          borderRadius: '9px',
          backgroundColor: 'var(--bg-subtle, #f1f5f9)',
          border: '1px solid var(--border-main, #e2e8f0)',
          color: 'var(--text-primary, #0f172a)',
          cursor: 'pointer',
          transition: 'all 0.18s ease',
          outline: 'none',
          position: 'relative'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = 'var(--bg-muted, #e2e8f0)';
          e.currentTarget.style.borderColor = 'var(--brand-forest, #166534)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'var(--bg-subtle, #f1f5f9)';
          e.currentTarget.style.borderColor = 'var(--border-main, #e2e8f0)';
        }}
      >
        {resolvedTheme === 'dark' ? (
          <Sun size={17} className="theme-icon-sun" color="#facc15" strokeWidth={2.2} />
        ) : (
          <Moon size={17} className="theme-icon-moon" color="#166534" strokeWidth={2.2} />
        )}
      </button>
    );
  }

  // 2. DETAILED CARD SELECTOR (For Settings / Profile Preferences)
  if (variant === 'cards') {
    const options: { id: ThemePreference; label: string; desc: string; icon: React.ReactNode }[] = [
      {
        id: 'light',
        label: 'Light Mode',
        desc: 'Clean, high-clarity daylight theme with forest green accents',
        icon: <Sun size={20} color={themePreference === 'light' ? 'var(--brand-forest, #166534)' : '#64748b'} />
      },
      {
        id: 'dark',
        label: 'Dark Mode',
        desc: 'Comfortable deep charcoal surfaces designed for low-glare reading',
        icon: <Moon size={20} color={themePreference === 'dark' ? '#4ade80' : '#64748b'} />
      },
      {
        id: 'system',
        label: 'System Preference',
        desc: 'Automatically synchronizes with your device operating system theme',
        icon: <Monitor size={20} color={themePreference === 'system' ? '#38bdf8' : '#64748b'} />
      }
    ];

    return (
      <div
        role="radiogroup"
        aria-label="Theme appearance options"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
          gap: '12px',
          width: '100%'
        }}
        className={className}
      >
        {options.map((opt) => {
          const isSelected = themePreference === opt.id;
          return (
            <button
              key={opt.id}
              type="button"
              role="radio"
              aria-checked={isSelected}
              onClick={() => setThemePreference(opt.id)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
                textAlign: 'left',
                padding: '16px',
                borderRadius: '12px',
                border: isSelected ? '2px solid var(--brand-forest, #166534)' : '1px solid var(--border-main, #e2e8f0)',
                backgroundColor: isSelected ? 'var(--bg-hover, rgba(22, 101, 52, 0.06))' : 'var(--bg-surface, #ffffff)',
                cursor: 'pointer',
                transition: 'all 0.18s ease',
                position: 'relative',
                boxShadow: isSelected ? '0 4px 12px rgba(22, 101, 52, 0.12)' : 'none'
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  width: '100%',
                  marginBottom: '10px'
                }}
              >
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '8px',
                    backgroundColor: isSelected ? 'var(--light-green, #dcfce7)' : 'var(--bg-subtle, #f1f5f9)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  {opt.icon}
                </div>
                <div
                  style={{
                    width: '18px',
                    height: '18px',
                    borderRadius: '50%',
                    border: isSelected ? '5px solid var(--brand-forest, #166534)' : '2px solid var(--border-strong, #cbd5e1)',
                    backgroundColor: 'var(--bg-surface, #ffffff)',
                    transition: 'border 0.15s ease'
                  }}
                  aria-hidden="true"
                />
              </div>

              <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary, #0f172a)', marginBottom: '4px' }}>
                {opt.label}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted, #64748b)', lineHeight: 1.4 }}>
                {opt.desc}
              </div>
            </button>
          );
        })}
      </div>
    );
  }

  // 3. COMPACT SEGMENTED CONTROL (Default)
  const options: { id: ThemePreference; label: string; icon: React.ReactNode }[] = [
    { id: 'light', label: 'Light', icon: <Sun size={15} /> },
    { id: 'dark', label: 'Dark', icon: <Moon size={15} /> },
    { id: 'system', label: 'System', icon: <Monitor size={15} /> }
  ];

  return (
    <div
      role="radiogroup"
      aria-label="Theme appearance switcher"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '3px',
        backgroundColor: 'var(--bg-subtle, #f1f5f9)',
        border: '1px solid var(--border-main, #e2e8f0)',
        borderRadius: '10px',
        gap: '2px'
      }}
      className={className}
    >
      {options.map((opt) => {
        const isSelected = themePreference === opt.id;
        return (
          <button
            key={opt.id}
            type="button"
            role="radio"
            aria-checked={isSelected}
            onClick={() => setThemePreference(opt.id)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              fontSize: '12.5px',
              fontWeight: isSelected ? 600 : 500,
              borderRadius: '7px',
              border: 'none',
              backgroundColor: isSelected ? 'var(--bg-surface, #ffffff)' : 'transparent',
              color: isSelected ? 'var(--text-primary, #0f172a)' : 'var(--text-muted, #64748b)',
              boxShadow: isSelected ? '0 1px 3px rgba(0, 0, 0, 0.08)' : 'none',
              cursor: 'pointer',
              transition: 'background-color 0.15s ease, color 0.15s ease, box-shadow 0.15s ease',
              outline: 'none'
            }}
          >
            {opt.icon}
            {showLabel && <span>{opt.label}</span>}
          </button>
        );
      })}
    </div>
  );
};
