/**
 * PBX Design System - Single Source of Truth
 * Navy + Gold unified theme across all pages
 * 
 * USAGE: Import tokens directly, no inline hardcoded colors allowed
 * import { colors, spacing, ... } from '../lib/theme';
 */

// === COLOR TOKENS ===
export const colors = {
  // Primary - PBX Navy
  navy: '#0A2540',
  navyDark: '#061C33',
  navyLight: '#1A3A5C',
  
  // Accent - Gold
  gold: '#F6C94B',
  goldDark: '#D4A520',
  goldLight: '#FFEEB3',
  
  // Backgrounds
  shell: '#0A2540',           // Main app shell background
  card: '#FFFFFF',            // Card backgrounds (light for readability)
  cardDark: '#F8F9FA',        // Slightly darker card variant
  input: '#FFFFFF',           // Input field backgrounds
  
  // Text on dark backgrounds (shell)
  textPrimary: '#FFFFFF',
  textSecondary: 'rgba(255,255,255,0.7)',
  textMuted: 'rgba(255,255,255,0.5)',
  
  // Text on light backgrounds (cards)
  textDark: '#1A1A1A',
  textDarkSecondary: '#6B7280',
  
  // Borders
  borderLight: 'rgba(255,255,255,0.15)',
  borderCard: '#E5E7EB',
  
  // Status colors
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',
  
  // CTA (Call to Action)
  ctaPrimary: '#F6C94B',        // Gold button
  ctaSecondary: '#EF4444',      // Red button (marketing CTAs)
};

// === TAILWIND CLASS MAPPINGS ===
// Use these for consistent styling across components
export const tw = {
  // Shell & backgrounds
  shellBg: 'bg-gradient-to-b from-[#0A2540] to-[#061C33]',
  shellBgSolid: 'bg-[#0A2540]',
  cardBg: 'bg-white',
  cardBgDark: 'bg-[#F8F9FA]',
  
  // Text
  textOnDark: 'text-white',
  textOnDarkMuted: 'text-white/70',
  textOnDarkFaint: 'text-white/50',
  textOnLight: 'text-[#1A1A1A]',
  textOnLightMuted: 'text-gray-500',
  
  // Accent
  textGold: 'text-[#F6C94B]',
  bgGold: 'bg-[#F6C94B]',
  
  // Borders
  borderOnDark: 'border-white/15',
  borderOnLight: 'border-gray-200',
  
  // Buttons - Primary (Gold)
  btnPrimary: 'bg-[#F6C94B] text-[#0A2540] font-bold hover:bg-[#D4A520]',
  btnPrimaryDisabled: 'bg-[#F6C94B]/50 text-[#0A2540]/50 cursor-not-allowed',
  
  // Buttons - Navy (for light backgrounds)
  btnNavy: 'bg-[#0A2540] text-white font-semibold hover:bg-[#061C33]',
  btnNavyDisabled: 'bg-[#0A2540]/50 text-white/50 cursor-not-allowed',
  
  // Buttons - Red CTA (marketing)
  btnCta: 'bg-red-600 text-white font-bold hover:bg-red-700',
  
  // Buttons - Secondary (outlined)
  btnSecondary: 'bg-transparent border border-white/20 text-white hover:bg-white/10',
};

// === SPACING & RADIUS ===
export const spacing = {
  radiusSm: '8px',
  radiusMd: '12px',
  radiusLg: '16px',
  radiusXl: '24px',
  radiusFull: '9999px',
};

// === FX RATE SOURCE LABELS ===
// Always show a source label - never show rate without it
export const fxSourceLabels = {
  openexchangerates: 'Live',
  'exchangerate.host': 'Live',
  dev: 'Dev feed',
  'local-dev': 'Dev feed',
  unknown: 'Indicative',
};

// === GRADIENT PRESETS ===
export const gradients = {
  shell: `linear-gradient(180deg, ${colors.navy} 0%, ${colors.navyDark} 100%)`,
  gold: `linear-gradient(135deg, ${colors.gold} 0%, ${colors.goldDark} 100%)`,
};

// === CSS VARIABLE INJECTION ===
// Call this at app initialization to set CSS custom properties
export function injectThemeVariables() {
  const root = document.documentElement;
  
  // Colors
  root.style.setProperty('--pbx-navy', colors.navy);
  root.style.setProperty('--pbx-navy-dark', colors.navyDark);
  root.style.setProperty('--pbx-navy-light', colors.navyLight);
  root.style.setProperty('--pbx-gold', colors.gold);
  root.style.setProperty('--pbx-gold-dark', colors.goldDark);
  root.style.setProperty('--pbx-gold-light', colors.goldLight);
  root.style.setProperty('--pbx-bg-shell', colors.shell);
  root.style.setProperty('--pbx-bg-card', colors.card);
  root.style.setProperty('--pbx-text-primary', colors.textPrimary);
  root.style.setProperty('--pbx-text-dark', colors.textDark);
  root.style.setProperty('--pbx-success', colors.success);
  root.style.setProperty('--pbx-error', colors.error);
}

// Default export for convenience
export default {
  colors,
  tw,
  spacing,
  fxSourceLabels,
  gradients,
  injectThemeVariables,
};
