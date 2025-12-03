/**
 * Custom user controller extension
 * Designed to be called from Next.js backend with Strapi API Token
 */
export default {
    /**
     * Get user data by email
     * Uses Strapi API Token authentication (not user JWT)
     * Called from Next.js backend server-side
     */
    async me(ctx) {
        // Get email from query param or body
        const email = ctx.request.query.email || ctx.request.body?.email;

        if (!email) {
            return ctx.badRequest('Email is required');
        }

        // Find user by email
        const user = await strapi.db.query('plugin::users-permissions.user').findOne({
            where: { email },
            populate: {
                avatar: true,
                courses: {
                    populate: {
                        coverImage: true,
                        instructor: {
                            populate: ['avatar']
                        },
                        tags: true
                    }
                }
            },
        });

        if (!user) {
            return ctx.notFound('User not found');
        }

        // Sanitize sensitive fields using built-in service
        const sanitized = await strapi
            .plugin('users-permissions')
            .service('user')
            .sanitizeUser(user);

        return sanitized;
    },
};
