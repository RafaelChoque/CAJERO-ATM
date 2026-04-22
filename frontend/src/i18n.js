import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import es from './locales/es.json';
import en from './locales/en.json';

i18n
  .use(initReactI18next)
  .init({
    resources: {
      es: { translation: es },
      en: { translation: en }
    },
    lng: localStorage.getItem('idioma') || 'es', // Lee del localStorage o usa español por defecto
    fallbackLng: 'es',
    interpolation: {
      escapeValue: false // React ya protege contra XSS
    }
  });

export default i18n;