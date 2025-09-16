import { getRequestConfig } from 'next-intl/server';
import { headers } from 'next/headers';

export default getRequestConfig(async () => {
  // This can either be defined statically if only a single locale
  // is supported, or alternatively read from the user settings,
  // a database, the `Accept-Language` header, etc.
  const headersList = headers();
  const locale = headersList.get('x-locale') || 'ar'; // Default to Arabic

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default
  };
});
