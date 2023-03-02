export default ({ env }) => ({
  upload: {
    config: {
      provider: 'strapi-provider-upload-cloudflare-2',
      providerOptions: {
        accountId: env('accountId') || '1234567890',
        apiKey: env('apiKey') || 'my-api-key',
        variant: 'sunny',
      },
    },
  },
  'import-export-entries': {
    enabled: true,
  },
  'users-permissions': {
    enabled: true,
    config: {
      jwt: {
        expiresIn: '60m',
      },
    },
  },
})
