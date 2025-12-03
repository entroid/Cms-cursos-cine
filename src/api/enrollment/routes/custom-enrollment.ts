export default {
    routes: [
        {
            method: 'GET',
            path: '/enrollment/validate-access',
            handler: 'enrollment.validateAccess',
            config: {
                policies: [],
                middlewares: [],
            },
        },
    ],
};
