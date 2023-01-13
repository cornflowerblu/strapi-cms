/**
 * show controller
 */

import { factories } from "@strapi/strapi";
import show from "../routes/show";

export default factories.createCoreController(
  "api::show.show",
  ({ strapi }) => {
    return {
      async countShowSeasons(ctx) {
        //@ts-ignore
        const seasonRows = await strapi.db.connection.raw(`
                select count(*) from shows_seasons_links
                join shows s on shows_seasons_links.show_id = s.id
                where show_id = ${ctx.querystring || 0};`);

        //@ts-ignore
        const showRows = await strapi.db.connection.raw(`
                select shows.id, shows.name, shows.slug, shows.short_name from shows
                where shows.id = ${ctx.querystring || 0};
            `);

        //@ts-ignore
        const episodeRows = await strapi.db.connection.raw(`
                select count(*) from episodes_show_links
                join shows s on episodes_show_links.show_id = s.id
                where show_id = ${ctx.querystring || 0};`);

        const seasons = seasonRows.rows[0].count;
        const show = showRows.rows[0];
        const episodes = episodeRows.rows[0]?.count;

        return { show, seasons, episodes };
      },
    };
  }
);
