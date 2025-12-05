/**
 * enrollment controller
 */

import { factories } from '@strapi/strapi'

export default factories.createCoreController('api::enrollment.enrollment', ({ strapi }) => ({
    /**
     * Find enrollments for the authenticated user
     * Automatically filters by user and populates course details
     */
    async find(ctx) {
        const user = ctx.state.user;

        if (!user) {
            return ctx.unauthorized('You must be authenticated');
        }

        // Build filters - combine user filter with any query filters
        const queryFilters = (ctx.query.filters as Record<string, any>) || {};
        const filters = {
            user: { id: user.id },
            ...queryFilters,
        };

        // Fetch enrollments with full population
        const { results, pagination } = await strapi.service('api::enrollment.enrollment').find({
            filters,
            populate: {
                course: {
                    populate: {
                        instructor: true,
                        coverImage: true,
                        modules: {
                            populate: {
                                lessons: true,
                            },
                        },
                    },
                },
            },
            ...ctx.query,
        });

        return { data: results, meta: { pagination } };
    },

    /**
     * Update enrollment progress
     * Auto-calculates progress percentage and updates status
     */
    async update(ctx) {
        const { id } = ctx.params;
        const user = ctx.state.user;

        if (!user) {
            return ctx.unauthorized('You must be authenticated');
        }

        // Verify ownership
        const enrollment = await strapi.db.query('api::enrollment.enrollment').findOne({
            where: { id, user: user.id },
            populate: { course: { populate: { modules: { populate: { lessons: true } } } } },
        });

        if (!enrollment) {
            return ctx.notFound('Enrollment not found or access denied');
        }

        // Extract update data
        const { currentLesson, completedLessons, lastAccessedAt, totalTimeSpent } = ctx.request.body.data || {};

        // Calculate progress if completedLessons is provided
        let progressPercentage = enrollment.progressPercentage;
        let enrollmentStatus: 'not-started' | 'in-progress' | 'completed' = enrollment.enrollmentStatus;

        if (completedLessons !== undefined) {
            const totalLessons = strapi.service('api::enrollment.enrollment').countTotalLessons(enrollment.course);
            progressPercentage = totalLessons > 0 ? (completedLessons.length / totalLessons) * 100 : 0;

            // Auto-update status
            if (progressPercentage === 0) {
                enrollmentStatus = 'not-started';
            } else if (progressPercentage === 100) {
                enrollmentStatus = 'completed';
            } else {
                enrollmentStatus = 'in-progress';
            }
        }

        // Update enrollment
        const updatedEnrollment = await strapi.entityService.update('api::enrollment.enrollment', id, {
            data: {
                currentLesson,
                completedLessons,
                lastAccessedAt: lastAccessedAt || new Date().toISOString(),
                totalTimeSpent,
                progressPercentage,
                enrollmentStatus,
                completedAt: enrollmentStatus === 'completed' ? new Date().toISOString() : enrollment.completedAt,
            },
            populate: {
                course: {
                    populate: {
                        instructor: true,
                        coverImage: true,
                        modules: { populate: { lessons: true } },
                    },
                },
            },
        });

        return { data: updatedEnrollment };
    },

    /**
     * Get the most recently accessed enrollment for "Continue Watching"
     */
    async continueWatching(ctx) {
        const user = ctx.state.user;

        if (!user) {
            return ctx.unauthorized('You must be authenticated');
        }

        // Find enrollment with most recent lastAccessedAt
        const enrollments = await strapi.db.query('api::enrollment.enrollment').findMany({
            where: {
                user: user.id,
                enrollmentStatus: { $in: ['not-started', 'in-progress'] }, // Exclude completed courses
            },
            orderBy: { lastAccessedAt: 'desc' },
            limit: 1,
            populate: {
                course: {
                    populate: {
                        instructor: true,
                        coverImage: true,
                        modules: {
                            populate: {
                                lessons: true,
                            },
                        },
                    },
                },
            },
        });

        if (enrollments.length === 0) {
            return { data: null };
        }

        return { data: enrollments[0] };
    },

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
            enrollmentStatus: { $in: ['not-started', 'in-progress', 'completed'] },
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
