/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';

export const THEMES = [
  {
    id: 'cyber-violet',
    name: 'Cyber Violet',
    tagline: 'Deep Obsidian & Neon Ultraviolet',
    accent: '#8B5CF6',
    accentHover: '#A855F7',
    accentDim: '#6D28D9',
    textSecondary: '#C084FC',
    textMuted: '#7E709A',
    bgPrimary: '#05030A',
    bgSecondary: '#0D061A',
    bgCard: '#120820',
    bgCardHover: '#1A0D2E',
    border: '#23123D',
    borderHover: '#8B5CF6',
    energy: '#38BDF8',
    glow: 'rgba(139, 92, 246, 0.35)',
    swatch: '#8B5CF6'
  },
  {
    id: 'tactical-emerald',
    name: 'Tactical Emerald',
    tagline: 'Matrix Wire & Intelligence Green',
    accent: '#10B981',
    accentHover: '#34D399',
    accentDim: '#059669',
    textSecondary: '#6EE7B7',
    textMuted: '#64748B',
    bgPrimary: '#020C07',
    bgSecondary: '#051810',
    bgCard: '#092116',
    bgCardHover: '#0E2E1F',
    border: '#113E2B',
    borderHover: '#10B981',
    energy: '#34D399',
    glow: 'rgba(16, 185, 129, 0.35)',
    swatch: '#10B981'
  },
  {
    id: 'solar-amber',
    name: 'Solar Amber',
    tagline: 'Bloomberg Horizon & High-Frequency Gold',
    accent: '#F59E0B',
    accentHover: '#FBBF24',
    accentDim: '#D97706',
    textSecondary: '#FDE68A',
    textMuted: '#927856',
    bgPrimary: '#0A0602',
    bgSecondary: '#140D04',
    bgCard: '#1E1407',
    bgCardHover: '#2A1C0A',
    border: '#3D280E',
    borderHover: '#F59E0B',
    energy: '#FBBF24',
    glow: 'rgba(245, 158, 11, 0.35)',
    swatch: '#F59E0B'
  },
  {
    id: 'glacier-cyan',
    name: 'Glacier Cyan',
    tagline: 'Quantum Subsea & Arctic Fiber',
    accent: '#06B6D4',
    accentHover: '#22D3EE',
    accentDim: '#0891B2',
    textSecondary: '#67E8F9',
    textMuted: '#628399',
    bgPrimary: '#02080E',
    bgSecondary: '#04121F',
    bgCard: '#081B2B',
    bgCardHover: '#0C263C',
    border: '#113550',
    borderHover: '#06B6D4',
    energy: '#22D3EE',
    glow: 'rgba(6, 182, 212, 0.35)',
    swatch: '#06B6D4'
  },
  {
    id: 'crimson-pulse',
    name: 'Crimson Pulse',
    tagline: 'Threat Matrix & Crisis Red',
    accent: '#EF4444',
    accentHover: '#F87171',
    accentDim: '#DC2626',
    textSecondary: '#FCA5A5',
    textMuted: '#99666E',
    bgPrimary: '#0C0305',
    bgSecondary: '#19060A',
    bgCard: '#24090F',
    bgCardHover: '#330D16',
    border: '#45121E',
    borderHover: '#EF4444',
    energy: '#F87171',
    glow: 'rgba(239, 68, 68, 0.35)',
    swatch: '#EF4444'
  },
  {
    id: 'cobalt-royal',
    name: 'Cobalt Royal',
    tagline: 'Deep Tech Navy & High-Def Blue',
    accent: '#3B82F6',
    accentHover: '#60A5FA',
    accentDim: '#2563EB',
    textSecondary: '#93C5FD',
    textMuted: '#6B7E9F',
    bgPrimary: '#030612',
    bgSecondary: '#060D24',
    bgCard: '#0A1433',
    bgCardHover: '#0F1E48',
    border: '#162B66',
    borderHover: '#3B82F6',
    energy: '#60A5FA',
    glow: 'rgba(59, 130, 246, 0.35)',
    swatch: '#3B82F6'
  },
  {
    id: 'titanium-silver',
    name: 'Titanium Silver',
    tagline: 'Stealth Monolith & High-Precision Metal',
    accent: '#E2E8F0',
    accentHover: '#FFFFFF',
    accentDim: '#94A3B8',
    textSecondary: '#CBD5E1',
    textMuted: '#71717A',
    bgPrimary: '#060608',
    bgSecondary: '#0E0E12',
    bgCard: '#15151B',
    bgCardHover: '#1D1D24',
    border: '#282832',
    borderHover: '#E2E8F0',
    energy: '#94A3B8',
    glow: 'rgba(226, 232, 240, 0.25)',
    swatch: '#E2E8F0'
  }
];

// Helper to calculate lighter/darker shades from hex
function hexToRgb(hex) {
  const clean = hex.replace('#', '');
  const bigint = parseInt(clean.length === 3 ? clean.split('').map(c => c + c).join('') : clean, 16);
  return {
    r: (bigint >> 16) & 255,
    g: (bigint >> 8) & 255,
    b: bigint & 255
  };
}

function adjustBrightness(hex, percent) {
  const { r, g, b } = hexToRgb(hex);
  const factor = 1 + percent / 100;
  const clamp = (val) => Math.min(255, Math.max(0, Math.round(val)));
  const toHex = (n) => clamp(n * factor).toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

export function generateCustomTheme(hexColor) {
  const { r, g, b } = hexToRgb(hexColor);
  
  // Calculate subtle deep background tints using the hue of the color
  const bgR = Math.min(20, Math.max(2, Math.round(r * 0.05)));
  const bgG = Math.min(20, Math.max(2, Math.round(g * 0.05)));
  const bgB = Math.min(20, Math.max(2, Math.round(b * 0.05)));

  return {
    id: 'custom',
    name: 'Custom Hue',
    tagline: `User Palette ${hexColor.toUpperCase()}`,
    accent: hexColor,
    accentHover: adjustBrightness(hexColor, 20),
    accentDim: adjustBrightness(hexColor, -25),
    textSecondary: adjustBrightness(hexColor, 40),
    textMuted: '#7E709A',
    bgPrimary: `#${bgR.toString(16).padStart(2, '0')}${bgG.toString(16).padStart(2, '0')}${bgB.toString(16).padStart(2, '0')}`,
    bgSecondary: `#${(bgR * 2).toString(16).padStart(2, '0')}${(bgG * 2).toString(16).padStart(2, '0')}${(bgB * 2).toString(16).padStart(2, '0')}`,
    bgCard: `#${(bgR * 3).toString(16).padStart(2, '0')}${(bgG * 3).toString(16).padStart(2, '0')}${(bgB * 3).toString(16).padStart(2, '0')}`,
    bgCardHover: `#${(bgR * 4).toString(16).padStart(2, '0')}${(bgG * 4).toString(16).padStart(2, '0')}${(bgB * 4).toString(16).padStart(2, '0')}`,
    border: `#${(bgR * 5).toString(16).padStart(2, '0')}${(bgG * 5).toString(16).padStart(2, '0')}${(bgB * 5).toString(16).padStart(2, '0')}`,
    borderHover: hexColor,
    energy: adjustBrightness(hexColor, 15),
    glow: `rgba(${r}, ${g}, ${b}, 0.35)`,
    swatch: hexColor
  };
}

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const [currentThemeId, setCurrentThemeId] = useState(() => {
    return localStorage.getItem('nexz_theme_id') || 'cyber-violet';
  });

  const [customColor, setCustomColorState] = useState(() => {
    return localStorage.getItem('nexz_custom_color') || '#8B5CF6';
  });

  const [isAutoCycling, setIsAutoCycling] = useState(() => {
    return localStorage.getItem('nexz_auto_cycle') === 'true';
  });

  const [fontVibe, setFontVibeState] = useState(() => {
    return localStorage.getItem('nexz_font_vibe') || 'neo-tech';
  });

  const cycleTimerRef = useRef(null);

  // Compute active theme object
  const activeTheme = React.useMemo(() => {
    if (currentThemeId === 'custom') {
      return generateCustomTheme(customColor);
    }
    const found = THEMES.find((t) => t.id === currentThemeId);
    return found || THEMES[0];
  }, [currentThemeId, customColor]);

  // Apply CSS variables to :root
  const applyThemeVariables = useCallback((themeObj) => {
    if (!themeObj) return;
    const root = document.documentElement;
    root.style.setProperty('--color-accent', themeObj.accent);
    root.style.setProperty('--color-accent-hover', themeObj.accentHover);
    root.style.setProperty('--color-accent-dim', themeObj.accentDim);
    root.style.setProperty('--color-text-secondary', themeObj.textSecondary);
    if (themeObj.textMuted) root.style.setProperty('--color-text-muted', themeObj.textMuted);
    root.style.setProperty('--color-bg-primary', themeObj.bgPrimary);
    root.style.setProperty('--color-bg-secondary', themeObj.bgSecondary);
    root.style.setProperty('--color-bg-card', themeObj.bgCard);
    root.style.setProperty('--color-bg-card-hover', themeObj.bgCardHover);
    root.style.setProperty('--color-border', themeObj.border);
    root.style.setProperty('--color-border-hover', themeObj.borderHover);
    root.style.setProperty('--color-energy', themeObj.energy);

    // Also update theme-color meta tag
    const metaTheme = document.querySelector('meta[name="theme-color"]');
    if (metaTheme) {
      metaTheme.setAttribute('content', themeObj.bgPrimary);
    }
  }, []);

  // Apply font vibe
  const applyFontVibe = useCallback((vibe) => {
    const root = document.documentElement;
    if (vibe === 'executive') {
      root.style.setProperty('--font-family-display', "'Plus Jakarta Sans', sans-serif");
      root.style.setProperty('--font-family-sans', "'Plus Jakarta Sans', sans-serif");
    } else if (vibe === 'telemetry') {
      root.style.setProperty('--font-family-display', "'JetBrains Mono', monospace");
      root.style.setProperty('--font-family-sans', "'Plus Jakarta Sans', sans-serif");
    } else {
      // Default: Neo-Tech
      root.style.setProperty('--font-family-display', "'Outfit', 'Plus Jakarta Sans', sans-serif");
      root.style.setProperty('--font-family-sans', "'Plus Jakarta Sans', system-ui, -apple-system, sans-serif");
    }
  }, []);

  // Update styles on theme or font change
  useEffect(() => {
    applyThemeVariables(activeTheme);
  }, [activeTheme, applyThemeVariables]);

  useEffect(() => {
    applyFontVibe(fontVibe);
  }, [fontVibe, applyFontVibe]);

  // Set specific curated theme
  const setTheme = useCallback((themeId) => {
    setCurrentThemeId(themeId);
    localStorage.setItem('nexz_theme_id', themeId);
  }, []);

  // Set single custom color
  const setCustomColor = useCallback((hex) => {
    setCustomColorState(hex);
    setCurrentThemeId('custom');
    localStorage.setItem('nexz_custom_color', hex);
    localStorage.setItem('nexz_theme_id', 'custom');
  }, []);

  // Cycle to next theme
  const cycleNextTheme = useCallback(() => {
    setCurrentThemeId((prev) => {
      const idx = THEMES.findIndex((t) => t.id === prev);
      const nextIdx = (idx + 1) % THEMES.length;
      const nextId = THEMES[nextIdx].id;
      localStorage.setItem('nexz_theme_id', nextId);
      return nextId;
    });
  }, []);

  // Toggle auto cycle
  const toggleAutoCycle = useCallback(() => {
    setIsAutoCycling((prev) => {
      const next = !prev;
      localStorage.setItem('nexz_auto_cycle', String(next));
      return next;
    });
  }, []);

  // Set font vibe
  const setFontVibe = useCallback((vibe) => {
    setFontVibeState(vibe);
    localStorage.setItem('nexz_font_vibe', vibe);
  }, []);

  // Auto-cycle interval effect
  useEffect(() => {
    if (!isAutoCycling) {
      if (cycleTimerRef.current) clearInterval(cycleTimerRef.current);
      return;
    }

    cycleTimerRef.current = setInterval(() => {
      cycleNextTheme();
    }, 7000); // 7-second smooth cycle interval

    return () => {
      if (cycleTimerRef.current) clearInterval(cycleTimerRef.current);
    };
  }, [isAutoCycling, cycleNextTheme]);

  return (
    <ThemeContext.Provider
      value={{
        theme: activeTheme,
        currentThemeId,
        themes: THEMES,
        setTheme,
        customColor,
        setCustomColor,
        cycleNextTheme,
        isAutoCycling,
        toggleAutoCycle,
        fontVibe,
        setFontVibe
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
