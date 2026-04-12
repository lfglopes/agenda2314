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

  colorMode: false,

  hub: {
    db: process.env.NODE_ENV === 'production'
      ? { dialect: 'sqlite', driver: 'd1', connection: { databaseId: '08ce1509-37bb-4a05-96b4-5e510b0bbb14' } }
      : 'sqlite',
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
    resendApiKey: '',
    requireModeration: '',
    siteUrl: 'http://localhost:3000',
  },

  nitro: {
    cloudflare: {
      wrangler: {
        name: 'agenda2314',
        observability: {
          enabled: false,
          head_sampling_rate: 1,
          logs: {
            enabled: true,
            head_sampling_rate: 1,
            persist: true,
            invocation_logs: true,
          },
          traces: {
            enabled: false,
            persist: true,
            head_sampling_rate: 1,
          },
        },
      },
    },
  },

  vite: {
    optimizeDeps: {
      include: [
        '@fullcalendar/vue3',
        '@fullcalendar/daygrid',
        '@vue/devtools-core',
        '@vue/devtools-kit',
      ]
    }
  }
})