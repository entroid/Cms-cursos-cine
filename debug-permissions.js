const { createStrapi } = require('@strapi/strapi');

async function checkPermissions() {
    const strapi = await createStrapi().load();

    const publicRole = await strapi.query('plugin::users-permissions.role').findOne({ where: { type: 'public' } });
    console.log('Public Role ID:', publicRole.id);

    const permissions = await strapi.query('plugin::users-permissions.permission').findMany({
        where: {
            role: publicRole.id,
            action: { $contains: 'enrollment' }
        }
    });

    console.log('Enrollment Permissions for Public Role:');
    console.log(JSON.stringify(permissions, null, 2));

    process.exit(0);
}

checkPermissions();
