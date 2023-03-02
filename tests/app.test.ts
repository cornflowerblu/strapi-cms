import { setupStrapi } from './helpers/strapi'
import request from 'supertest'

jest.setTimeout(10000)

beforeAll(async () => {
  await setupStrapi()
})

it('strapi is defined', () => {
  expect(strapi).toBeDefined()
})

it('should return 204 on /_health', async () => {
  await request(strapi.server.httpServer).get('/_health').expect(204)
})
