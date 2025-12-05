/**
 * enrollment router
 */

import { factories } from '@strapi/strapi';

export default {
    routes: [
        // Custom route for continue watching
        {
            method: 'GET',
            path: '/enrollments/continue-watching',
            handler: 'enrollment.continueWatching',
            config: {
                policies: [],
                middlewares: [],
            },
        },
        // Standard CRUD routes
        {
            method: 'GET',
            path: '/enrollments',
            handler: 'enrollment.find',
            config: {
                policies: [],
                middlewares: [],
            },
        },
        {
            method: 'GET',
            path: '/enrollments/:id',
            handler: 'enrollment.findOne',
            config: {
                policies: [],
                middlewares: [],
            },
        },
        {
            method: 'POST',
            path: '/enrollments',
            handler: 'enrollment.create',
            config: {
                policies: [],
                middlewares: [],
            },
        },
        {
            method: 'PUT',
            path: '/enrollments/:id',
            handler: 'enrollment.update',
            config: {
                policies: [],
                middlewares: [],
            },
        },
        {
            method: 'DELETE',
            path: '/enrollments/:id',
            handler: 'enrollment.delete',
            config: {
                policies: [],
                middlewares: [],
            },
        },
        // Legacy validateAccess route
        {
            method: 'GET',
            path: '/enrollments/validate-access',
            handler: 'enrollment.validateAccess',
            config: {
                policies: [],
                middlewares: [],
            },
        },
    ],
};
