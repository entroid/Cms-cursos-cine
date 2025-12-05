const { createStrapi } = require('@strapi/strapi');

async function run() {
    // Load Strapi
    const strapi = await createStrapi().load();

    try {
        console.log('Attempting to create enrollment...');
        const entry = await strapi.entityService.create('api::enrollment.enrollment', {
            data: {
                user: 6,
                course: 3,
                status: 'not-started',
                enrolledAt: new Date(),
                progressPercentage: 0
            }
        });
        console.log('Success! Created enrollment:', entry.id);
    } catch (error) {
        console.error('Error creating enrollment:');
        console.error(JSON.stringify(error, null, 2));
        if (error.details) console.error('Details:', error.details);
    }

    // Stop Strapi
    await strapi.destroy();
    process.exit(0);
}

run();
