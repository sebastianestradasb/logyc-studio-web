export type Lang = 'es' | 'en';
export type Page = 'home' | 'web';

// Output file of each page in each language; the ES/EN switch maps between them.
export const routes: Record<Page, Record<Lang, string>> = {
  home: { es: 'index.html', en: 'en.html' },
  web: { es: 'web.html', en: 'web-en.html' },
};

export const social = {
  instagram: { url: 'https://www.instagram.com/logycstudio/', handle: '@logycstudio' },
};

export const ui = {
  es: {
    followUs: 'Mira más de nuestro trabajo en Instagram',
    instagramLabel: 'Instagram de LOGYC Studio (se abre en otra pestaña)',
    homeLabel: 'LOGYC Studio inicio',
    menu: 'Menú',
    cta: 'Empezar proyecto',
    footer: 'contenido + web con IA',
    nav: { servicios: 'Servicios', web: 'Web', contenido: 'Contenido IA', proceso: 'Proceso', faq: 'FAQ' },
  },
  en: {
    followUs: 'See more of our work on Instagram',
    instagramLabel: 'LOGYC Studio on Instagram (opens in a new tab)',
    homeLabel: 'LOGYC Studio home',
    menu: 'Menu',
    cta: 'Start a project',
    footer: 'content + web with AI',
    nav: { servicios: 'Services', web: 'Web', contenido: 'AI Content', proceso: 'Process', faq: 'FAQ' },
  },
} as const;
