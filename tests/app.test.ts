import { setupStrapi } from "./helpers/strapi";

jest.setTimeout(10000)

beforeAll(async () => {
    await setupStrapi();
});

it("strapi is defined", () => {
    expect(strapi).toBeDefined();
});