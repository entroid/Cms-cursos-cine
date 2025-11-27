export default {
    routes: [
        {
            method: 'GET',
            path: '/validate-access',
            handler: 'enrollment.validateAccess',
            config: {
                policies: [],
                middlewares: [],
            },
        },
    ],
};
