/**
 * enrollment controller
 */

import { factories } from '@strapi/strapi'

export default factories.createCoreController('api::enrollment.enrollment', ({ strapi }) => ({
    /**
     * Validate if a user has access to a course
     * Supports both user.id (new) and externalUserId (legacy)
     */
    async validateAccess(ctx) {
        const { courseId, userId, externalUserId } = ctx.query;

        // Validate input
        if (!courseId) {
            return ctx.badRequest('courseId is required');
        }

        if (!userId && !externalUserId) {
            return ctx.badRequest('Either userId or externalUserId is required');
        }

        // Build query conditions
        const whereConditions: any = {
            course: courseId,
            status: 'active',
        };

        // Prefer user.id over externalUserId
        if (userId) {
            whereConditions.user = userId;
        } else if (externalUserId) {
            whereConditions.externalUserId = externalUserId;
        }

        // Find enrollment
        const enrollment = await strapi.db.query('api::enrollment.enrollment').findOne({
            where: whereConditions,
            populate: {
                course: true,
                user: {
                    populate: ['avatar']
                }
            },
        });

        if (enrollment) {
            return {
                hasAccess: true,
                enrollment,
                method: userId ? 'user' : 'externalUserId' // For debugging
            };
        } else {
            return {
                hasAccess: false,
                message: 'No active enrollment found',
                searchedBy: userId ? `userId: ${userId}` : `externalUserId: ${externalUserId}`
            };
        }
    },
}));
