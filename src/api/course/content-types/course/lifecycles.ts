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
