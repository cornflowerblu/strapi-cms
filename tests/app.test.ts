import { setupStrapi } from "./helpers/strapi";

beforeAll(async () => {
    await setupStrapi();
});

it("strapi is defined", () => {
    expect(strapi).toBeDefined();
});