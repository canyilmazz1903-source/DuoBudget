import tr from './locales/tr';
import en from './locales/en';

const locales: Record<string, any> = {
  tr,
  en,
};

let currentLocale = 'tr';

export const setLocale = (locale: string) => {
  if (locales[locale]) {
    currentLocale = locale;
  }
};

export const getLocale = () => currentLocale;

/**
 * Translate a key path (e.g. 'common.appName') with optional interpolation.
 */
export const t = (key: string, variables?: Record<string, string | number>): string => {
  const keys = key.split('.');
  let result = locales[currentLocale];

  for (const k of keys) {
    if (result && k in result) {
      result = result[k];
    } else {
      // Fallback to Turkish if translation is missing in the target locale
      let trResult = locales['tr'];
      for (const trKey of keys) {
        if (trResult && trKey in trResult) {
          trResult = trResult[trKey];
        } else {
          return key;
        }
      }
      result = trResult;
      break;
    }
  }

  if (typeof result !== 'string') {
    return key;
  }

  if (variables) {
    let interpolated = result;
    Object.entries(variables).forEach(([name, value]) => {
      interpolated = interpolated.replace(new RegExp(`{${name}}`, 'g'), String(value));
    });
    return interpolated;
  }

  return result;
};
