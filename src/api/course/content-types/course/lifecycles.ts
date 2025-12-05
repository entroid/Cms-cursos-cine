import { factories } from '@strapi/strapi';

/**
 * Generate a URL-friendly slug from a string
 */
function slugify(text: string): string {
    return text
        .toString()
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '-')           // Replace spaces with -
        .replace(/[^\w\-]+/g, '')       // Remove all non-word chars
        .replace(/\-\-+/g, '-')         // Replace multiple - with single -
        .replace(/^-+/, '')             // Trim - from start of text
        .replace(/-+$/, '');            // Trim - from end of text
}

/**
 * Auto-generate unique lessonId for lessons that don't have one
 */
function generateLessonIds(modules: any[]): void {
    if (!modules || !Array.isArray(modules)) return;

    const usedIds = new Set<string>();

    modules.forEach((module) => {
        if (module.lessons && Array.isArray(module.lessons)) {
            module.lessons.forEach((lesson) => {
                // Only generate if lessonId is missing or empty
                if (!lesson.lessonId || lesson.lessonId.trim() === '') {
                    let baseSlug = slugify(lesson.title || 'lesson');
                    let uniqueSlug = baseSlug;
                    let counter = 1;

                    // Ensure uniqueness within this course
                    while (usedIds.has(uniqueSlug)) {
                        uniqueSlug = `${baseSlug}-${counter}`;
                        counter++;
                    }

                    lesson.lessonId = uniqueSlug;
                    usedIds.add(uniqueSlug);
                } else {
                    // Track existing IDs to avoid duplicates
                    usedIds.add(lesson.lessonId);
                }
            });
        }
    });
}

export default {
    async beforeCreate(event) {
        const { data } = event.params;

        // Auto-assign instructor based on the creator's instructor profile
        if (data.createdBy && !data.instructor) {
            const instructorProfile = await strapi.db.query('api::instructor.instructor').findOne({
                where: {
                    createdBy: data.createdBy,
                },
            });

            if (instructorProfile) {
                data.instructor = instructorProfile.id;
            }
        }

        // Auto-generate lessonId for lessons
        if (data.modules) {
            generateLessonIds(data.modules);
        }

        // Auto-calculate estimatedDuration from modules/lessons
        if (data.modules && Array.isArray(data.modules)) {
            const totalDuration = data.modules.reduce((total, module) => {
                if (module.lessons && Array.isArray(module.lessons)) {
                    const moduleDuration = module.lessons.reduce((sum, lesson) => {
                        return sum + (lesson.duration || 0);
                    }, 0);
                    return total + moduleDuration;
                }
                return total;
            }, 0);

            data.estimatedDuration = totalDuration;
        }
    },

    async beforeUpdate(event) {
        const { data } = event.params;

        // Auto-generate lessonId for lessons
        if (data.modules) {
            generateLessonIds(data.modules);
        }

        // Auto-calculate estimatedDuration from modules/lessons
        if (data.modules && Array.isArray(data.modules)) {
            const totalDuration = data.modules.reduce((total, module) => {
                if (module.lessons && Array.isArray(module.lessons)) {
                    const moduleDuration = module.lessons.reduce((sum, lesson) => {
                        return sum + (lesson.duration || 0);
                    }, 0);
                    return total + moduleDuration;
                }
                return total;
            }, 0);

            data.estimatedDuration = totalDuration;
        }
    },
};
