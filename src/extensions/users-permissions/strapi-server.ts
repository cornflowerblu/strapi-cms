import utils from "@strapi/utils";
import { getService } from "../users-permissions/utils";
import jwt from "jsonwebtoken";
import _ from "lodash";

import { setMaxListeners } from "process";
const { sanitize } = utils;
const { ApplicationError, ValidationError } = utils.errors;
const sanitizeUser = (user, ctx) => {
  const { auth } = ctx.state;
  const userSchema = strapi.getModel("plugin::users-permissions.user");
  return sanitize.contentAPI.output(user, userSchema, { auth });
};

let user;
const issueJWT = (payload, jwtOptions = {}) => {
  _.defaults(jwtOptions, strapi.config.get("plugin.users-permissions.jwt"));
  return jwt.sign(
    _.clone(payload.toJSON ? payload.toJSON() : payload),
    strapi.config.get("plugin.users-permissions.jwtSecret") || "SUPERSECRET",
    jwtOptions
  );
};

const verifyToken = (token) => {
  return new Promise(function (resolve, reject) {
    jwt.verify(
      token,
      process.env.REFRESH_SECRET,
      {},
      function (err, tokenPayload = {}) {
        if (err) {
          return reject(new Error("Invalid token."));
        }
        resolve(tokenPayload);
      }
    );
  });
};

// issue a Refresh token
const issueToken = (payload, jwtOptions = {}) => {
  _.defaults(jwtOptions, strapi.config.get("plugin.users-permissions.jwt"));
  return jwt.sign(
    _.clone(payload.toJSON ? payload.toJSON() : payload),
    process.env.REFRESH_SECRET
  );
};

export default async (plugin) => {
  plugin.controllers.auth.callback = async (ctx) => {
    const provider = ctx.params.provider || "local";
    const params = ctx.request.body;
    const store = strapi.store({ type: "plugin", name: "users-permissions" });
    const grantSettings = await store.get({ key: "grant" });
    const grantProvider = provider === "local" ? "email" : provider;
    if (!_.get(grantSettings, [grantProvider, "enabled"])) {
      throw new ApplicationError("This provider is disabled");
    }
    if (provider === "local") {
      const { identifier } = params;
      // Check if the user exists.
      user = await strapi.query("plugin::users-permissions.user").findOne({
        where: {
          provider,
          $or: [{ email: identifier.toLowerCase() }, { username: identifier }],
        },
      });
      if (!user) {
        throw new ValidationError("Invalid identifier or password");
      }
      if (!user.password) {
        throw new ValidationError("Invalid identifier or password");
      }
      const validPassword = await getService("user").validatePassword(
        params.password,
        user.password
      );
      if (!validPassword) {
        throw new ValidationError("Invalid identifier or password");
      } else {
        ctx.cookies.set("token", issueToken({ id: user.id }), {
          httpOnly: true,
          secure: false,
          signed: true,
          overwrite: true,
        });
        ctx.send({
          status: "Authenticated",
          jwt: issueJWT(
            {
              id: user.id,
              "https://hasura.io/jwt/claims": {
                "x-hasura-allowed-roles": ["admin", "readonly"],
                "x-hasura-default-role": "readonly",
                "x-hasura-user-id": `${user.id}`,
              },
            },
            { expiresIn: "60m" }
          ),
          user: await sanitizeUser(user, ctx),
        });
      }
    }
    const advancedSettings = await store.get({ key: "advanced" });
    const requiresConfirmation = _.get(advancedSettings, "email_confirmation");
    if (requiresConfirmation && user.confirmed !== true) {
      throw new ApplicationError("Your account email is not confirmed");
    }
    if (user.blocked === true) {
      throw new ApplicationError(
        "Your account has been blocked by an administrator"
      );
    }
    return ctx.send({
      status: "Authenticated",
      jwt: issueJWT(
        {
          id: user.id,
          "https://hasura.io/jwt/claims": {
            "x-hasura-allowed-roles": ["admin", "readonly"],
            "x-hasura-default-role": "readonly",
            "x-hasura-user-id": `${user.id}`,
          },
        },
        { expiresIn: "60m" }
      ),
      user: await sanitizeUser(user, ctx),
    });
  };
  plugin.controllers.auth["customJWT"] = async (ctx) => {
    const store = await strapi.store({
      type: "plugin",
      name: "users-permissions",
    });
    const { token } = ctx.request.body;
    let tokenCookie = ctx.cookies.get("token");

    if (!tokenCookie && !token) {
      return ctx.badRequest("No Authorization");
    }
    if (!tokenCookie) {
      if (token) {
        tokenCookie = token;
      } else {
        return ctx.badRequest("No Authorization");
      }
    }

    try {
      const obj: any = await verifyToken(token);
      const user = await strapi
        .query("plugin::users-permissions.user")
        .findOne({ where: { id: obj.id } });
      if (!user) {
        throw new ValidationError("Invalid identifier or password");
      }
      if (
        _.get(await store.get({ key: "advanced" }), "email_confirmation") &&
        user.confirmed !== true
      ) {
        throw new ApplicationError("Your account email is not confirmed");
      }
      if (user.blocked === true) {
        throw new ApplicationError(
          "Your account has been blocked by an administrator"
        );
      }
      const newToken = issueToken({ id: user.id });
      ctx.cookies.set("token", token, {
        httpOnly: true,
        secure: false,
        signed: true,
        overwrite: true,
      });
      ctx.send({
        jwt: issueJWT({ id: obj.id }),
        token: newToken,
      });
    } catch (err) {
      return ctx.badRequest(err.toString());
    }
  };
  plugin.routes["content-api"].routes.push({
    method: "POST",
    path: "/token",
    handler: "auth.customJWT",
    config: {
      policies: [],
      prefix: "",
    },
  });
  // Connect the user with a third-party provider.
  // try {
  //   const user = await getService('providers').connect(provider, ctx.query);
  //   return ctx.send({
  //     jwt: issueJWT({ id: user.id, test: "test" }),
  //     user: await sanitizeUser(user, ctx),
  //   });
  // } catch (error) {
  //   throw new ApplicationError(error.message);
  // }

  return plugin;
};
