import { Core } from '@strapi/strapi';
// Force reload

export default {
  /**
   * An asynchronous register function that runs before
   * your application is initialized.
   *
   * This gives you an opportunity to extend code.
   */
  register({ strapi }: { strapi: Core.Strapi }) { },

  /**
   * An asynchronous bootstrap function that runs before
   * your application gets started.
   *
   * This gives you an opportunity to set up your data model,
   * run jobs, or perform some special logic.
   */
  async bootstrap({ strapi }: { strapi: Core.Strapi }) {
    // Set Public permissions
    const publicRole = await strapi
      .query('plugin::users-permissions.role')
      .findOne({ where: { type: 'public' } });

    if (publicRole) {
      const permissions = [
        'api::course.course.find',
        'api::course.course.findOne',
        'api::instructor.instructor.find',
        'api::instructor.instructor.findOne',
        'api::enrollment.enrollment.validateAccess', // Custom endpoint
        // Authentication endpoints for public access
        'plugin::users-permissions.auth.callback',   // Login endpoint
        'plugin::users-permissions.user.register',   // Registration endpoint
      ];


      await Promise.all(
        permissions.map(async (action) => {
          const existing = await strapi.query('plugin::users-permissions.permission').findOne({
            where: {
              action,
              role: publicRole.id,
            },
          });

          if (!existing) {
            strapi.log.info(`Creating permission: ${action}`);
            await strapi.query('plugin::users-permissions.permission').create({
              data: {
                action,
                role: publicRole.id,
              },
            });
          } else {
            strapi.log.info(`Permission already exists: ${action}`);
          }
        })
      );

      strapi.log.info('Public permissions configured via bootstrap');
    }

    // Set Authenticated permissions
    const authenticatedRole = await strapi
      .query('plugin::users-permissions.role')
      .findOne({ where: { type: 'authenticated' } });

    if (authenticatedRole) {
      const authenticatedPermissions = [
        'api::enrollment.enrollment.find',
        'api::enrollment.enrollment.findOne',
        'api::enrollment.enrollment.update',
        'api::enrollment.enrollment.continueWatching',
        'api::course.course.find',
        'api::course.course.findOne',
      ];

      await Promise.all(
        authenticatedPermissions.map(async (action) => {
          const existing = await strapi.query('plugin::users-permissions.permission').findOne({
            where: {
              action,
              role: authenticatedRole.id,
            },
          });

          if (!existing) {
            strapi.log.info(`Creating authenticated permission: ${action}`);
            await strapi.query('plugin::users-permissions.permission').create({
              data: {
                action,
                role: authenticatedRole.id,
              },
            });
          } else {
            strapi.log.info(`Authenticated permission already exists: ${action}`);
          }
        })
      );

      strapi.log.info('Authenticated permissions configured via bootstrap');
    }
  },
};
