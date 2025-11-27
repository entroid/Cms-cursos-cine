import { errors } from '@strapi/utils';
const { ApplicationError } = errors;

export default {
    async beforeCreate(event) {
        const { data } = event.params;
        console.log('Instructor beforeCreate triggered', JSON.stringify(data, null, 2));

        // Check if the user is creating it via Admin Panel (has createdBy)
        if (data.createdBy) {
            const existing = await strapi.db.query('api::instructor.instructor').findOne({
                where: {
                    createdBy: data.createdBy,
                },
            });

            if (existing) {
                throw new ApplicationError('Ya tienes un perfil de instructor. Solo puedes editar tu perfil existente.');
            }

            // Auto-associate the 'user' field with the creator
            data.user = data.createdBy;
        }
    },

    async beforeUpdate(event) {
        const { data } = event.params;

        // Prevent modification of critical relationship fields
        // This ensures 'user' and 'courses' are managed automatically and cannot be manually changed
        // regardless of the UI state.
        if (data.user) delete data.user;
        if (data.courses) delete data.courses;
    },
};
