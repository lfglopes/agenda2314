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
    kv: true,
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

  app: {
    head: {
      titleTemplate: '%s · Agenda cultural 2314',
      htmlAttrs: { lang: 'pt' },
      link: [
        { rel: 'icon', type: 'image/webp', href: '/favicon.webp' },
      ],
      meta: [
        { name: 'description', content: 'Agenda cultural do 2314 — calendário de eventos' },
      ],
    },
  },

  runtimeConfig: {
    siteUrl: 'http://localhost:3000',
  },
})