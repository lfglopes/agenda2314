// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },

  modules: [
    '@nuxt/eslint',
    '@nuxtjs/i18n',
    '@nuxt/ui',
    '@nuxthub/core',
  ],

  hub: {
    db: 'sqlite',
  },

  css: ['~/assets/css/main.css'],

  i18n: {
    defaultLocale: 'pt',
    strategy: 'no_prefix',
    langDir: 'locales',
    locales: [
      { code: 'pt', language: 'pt-PT', file: 'pt.json', name: 'Português' },
      { code: 'de', language: 'de-DE', file: 'de.json', name: 'Deutsch' },
    ],
    detectBrowserLanguage: {
      useCookie: true,
      cookieKey: 'i18n_redirected',
    },
  },

  runtimeConfig: {
    siteUrl: 'http://localhost:3000',
  },
})