/**
 * enrollment controller
 */

import { factories } from '@strapi/strapi'

export default factories.createCoreController('api::enrollment.enrollment', ({ strapi }) => ({
    async validateAccess(ctx) {
        const { courseId, externalUserId } = ctx.query;

        if (!courseId || !externalUserId) {
            return ctx.badRequest('courseId and externalUserId are required');
        }

        const enrollment = await strapi.db.query('api::enrollment.enrollment').findOne({
            where: {
                course: courseId,
                externalUserId: externalUserId,
                status: 'active',
            },
            populate: ['course'],
        });

        if (enrollment) {
            return { hasAccess: true, enrollment };
        } else {
            return { hasAccess: false, message: 'No active enrollment found' };
        }
    },
}));
