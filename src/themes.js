export const themes = {
  ocean: {
    id: 'ocean',
    name: 'Ocean Blue',
    desc: 'Biznes va IT startaplar uchun',
    bg: '0F172A',         // Slate 900
    cardBg: '1E293B',     // Slate 800
    primary: '38BDF8',     // Sky 400
    accent: '0EA5E9',      // Sky 500
    text: 'F8FAFC',        // Slate 50
    subtext: '94A3B8',     // Slate 400
    border: '334155',      // Slate 700
  },
  dark: {
    id: 'dark',
    name: 'Modern Dark',
    desc: 'Zamonaviy texnologik va minimalist',
    bg: '12131C',
    cardBg: '1E1F2E',
    primary: 'A855F7',     // Purple 500
    accent: '6366F1',      // Indigo 500
    text: 'FFFFFF',
    subtext: 'A1A1AA',
    border: '2D2F45',
  },
  emerald: {
    id: 'emerald',
    name: 'Emerald Nature',
    desc: 'Ekologiya, salomatlik va moliya',
    bg: '062419',
    cardBg: '0B3B2B',
    primary: '34D399',     // Emerald 400
    accent: '10B981',      // Emerald 500
    text: 'ECFDF5',
    subtext: '6EE7B7',
    border: '14533D',
  },
  sunset: {
    id: 'sunset',
    name: 'Sunset Orange',
    desc: 'Kreativ, marketing va taqdimotlar',
    bg: '1C120C',
    cardBg: '2D1E16',
    primary: 'FB923C',     // Orange 400
    accent: 'F97316',      // Orange 500
    text: 'FFF7ED',
    subtext: 'FDBA74',
    border: '452B20',
  },
  minimal: {
    id: 'minimal',
    name: 'Clean Light',
    desc: 'Rasmiy va ilmiy taqdimotlar',
    bg: 'F8FAFC',
    cardBg: 'FFFFFF',
    primary: '2563EB',     // Blue 600
    accent: '1D4ED8',      // Blue 700
    text: '0F172A',
    subtext: '64748B',
    border: 'E2E8F0',
  }
};

export function getTheme(themeName) {
  if (themeName && themes[themeName.toLowerCase()]) {
    return themes[themeName.toLowerCase()];
  }
  return themes.ocean;
}
