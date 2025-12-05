/**
 * enrollment service
 */

import { factories } from '@strapi/strapi';

export default factories.createCoreService('api::enrollment.enrollment', ({ strapi }) => ({
    /**
     * Count total lessons in a course
     */
    countTotalLessons(course: any): number {
        if (!course || !course.modules) {
            return 0;
        }

        return course.modules.reduce((total, module) => {
            return total + (module.lessons?.length || 0);
        }, 0);
    },

    /**
     * Calculate progress percentage
     */
    calculateProgress(courseId: number, completedLessons: string[]): Promise<number> {
        return strapi.db.query('api::course.course').findOne({
            where: { id: courseId },
            populate: { modules: { populate: { lessons: true } } },
        }).then(course => {
            const totalLessons = this.countTotalLessons(course);
            return totalLessons > 0 ? (completedLessons.length / totalLessons) * 100 : 0;
        });
    },

    /**
     * Update enrollment progress
     */
    async updateProgress(enrollmentId: number, lessonId: string): Promise<any> {
        const enrollment = await strapi.entityService.findOne('api::enrollment.enrollment', enrollmentId, {
            populate: { course: { populate: { modules: { populate: { lessons: true } } } } },
        }) as any;

        if (!enrollment) {
            throw new Error('Enrollment not found');
        }

        // Add lesson to completed list if not already there
        const completedLessons: string[] = Array.isArray(enrollment.completedLessons)
            ? [...enrollment.completedLessons]
            : [];
        if (!completedLessons.includes(lessonId)) {
            completedLessons.push(lessonId);
        }

        // Calculate new progress
        const totalLessons = this.countTotalLessons(enrollment.course);
        const progressPercentage = totalLessons > 0 ? (completedLessons.length / totalLessons) * 100 : 0;

        // Determine status
        let enrollmentStatus: 'not-started' | 'in-progress' | 'completed' = 'in-progress';
        if (progressPercentage === 0) {
            enrollmentStatus = 'not-started';
        } else if (progressPercentage === 100) {
            enrollmentStatus = 'completed';
        }

        // Update enrollment
        return strapi.entityService.update('api::enrollment.enrollment', enrollmentId, {
            data: {
                currentLesson: lessonId,
                completedLessons,
                progressPercentage,
                enrollmentStatus,
                lastAccessedAt: new Date().toISOString(),
                completedAt: enrollmentStatus === 'completed' ? new Date().toISOString() : enrollment.completedAt,
            },
        });
    },

    /**
     * Get continue watching enrollment for a user
     */
    async getContinueWatching(userId: number): Promise<any> {
        const enrollments = await strapi.db.query('api::enrollment.enrollment').findMany({
            where: {
                user: userId,
                enrollmentStatus: { $in: ['not-started', 'in-progress'] },
            },
            orderBy: { lastAccessedAt: 'desc' },
            limit: 1,
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

        return enrollments.length > 0 ? enrollments[0] : null;
    },
}));
