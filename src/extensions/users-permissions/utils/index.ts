export const getService = (name) => {
  return strapi.plugin("users-permissions").service(name);
};
