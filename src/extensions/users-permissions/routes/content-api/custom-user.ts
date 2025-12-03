/**
 * Custom routes for users-permissions plugin
 * Accessed with Strapi API Token from Next.js backend
 */
export default {
    routes: [
        {
            method: 'GET',
            path: '/users/me',
            handler: 'user.me',
            config: {
                policies: [],
                middlewares: [],
            },
        },
        {
            method: 'POST',
            path: '/users/me',
            handler: 'user.me',
            config: {
                policies: [],
                middlewares: [],
            },
        },
    ],
};
