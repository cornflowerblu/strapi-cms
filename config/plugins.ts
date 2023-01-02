export default ({ env }) => ({
  upload: {
    config: {
      provider: "strapi-provider-upload-cloudflare-2",
      providerOptions: {
        accountId: env("accountId"),
        apiKey: env("apiKey"),
        variant: "sunny",
      },
    },
  },
  "import-export-entries": {
    enabled: true,
  },
});
