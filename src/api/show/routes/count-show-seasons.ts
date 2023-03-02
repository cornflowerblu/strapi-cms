export default {
  routes: [
    {
      method: 'GET',
      path: '/shows/count',
      handler: 'show.countShowSeasons',
      config: {
        auth: false,
      },
    },
  ],
}
