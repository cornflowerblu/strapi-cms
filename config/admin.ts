export default ({ env }) => ({
  auth: {
    secret: env('ADMIN_JWT_SECRET') || 'admin-jwt-secret',
  },
  apiToken: {
    salt: env('API_TOKEN_SALT') || 'api-token-salt',
  },
})
