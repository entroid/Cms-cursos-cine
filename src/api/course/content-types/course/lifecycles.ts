export default {
    async beforeCreate(event) {
        const { data } = event.params;

        if (data.createdBy) {
            // Find the instructor profile associated with this user
            const instructorProfile = await strapi.db.query('api::instructor.instructor').findOne({
                where: {
                    createdBy: data.createdBy,
                },
            });

            if (instructorProfile) {
                // Auto-associate the course with the instructor's profile
                data.instructor = instructorProfile.id;
            }
        }
    },
};
