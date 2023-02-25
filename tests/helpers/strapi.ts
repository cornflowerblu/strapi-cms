import strapi, { Strapi } from "@strapi/strapi";
import { compile } from "@strapi/typescript-utils";

let instance: Strapi;

export const setupStrapi = async (): Promise<Strapi> => {
    if (!instance) {
        await compile("");

        instance = await strapi({ distDir: "./dist" }).load();

        const { app } = instance.server;
        app
            .use(instance.server.router.routes())
            .use(instance.server.router.allowedMethods());
    }
    return instance;
};
