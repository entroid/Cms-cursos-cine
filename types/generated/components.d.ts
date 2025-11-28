import type { Schema, Struct } from '@strapi/strapi';

export interface CourseLesson extends Struct.ComponentSchema {
  collectionName: 'components_course_lessons';
  info: {
    description: 'Individual lesson within a module';
    displayName: 'Lesson';
    icon: 'play';
  };
  attributes: {
    duration: Schema.Attribute.Integer &
      Schema.Attribute.SetMinMax<
        {
          min: 0;
        },
        number
      >;
    freePreview: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>;
    order: Schema.Attribute.Integer &
      Schema.Attribute.Required &
      Schema.Attribute.DefaultTo<1>;
    resources: Schema.Attribute.Component<'course.lesson-resource', true>;
    textContent: Schema.Attribute.RichText;
    title: Schema.Attribute.String & Schema.Attribute.Required;
    videoUrl: Schema.Attribute.String;
  };
}

export interface CourseLessonResource extends Struct.ComponentSchema {
  collectionName: 'components_course_lesson_resources';
  info: {
    description: 'Additional materials for a lesson';
    displayName: 'Lesson Resource';
    icon: 'paperclip';
  };
  attributes: {
    file: Schema.Attribute.Media<'files' | 'images' | 'videos' | 'audios'>;
    label: Schema.Attribute.String & Schema.Attribute.Required;
    type: Schema.Attribute.Enumeration<['pdf', 'link', 'audio', 'file']> &
      Schema.Attribute.Required;
    url: Schema.Attribute.String;
  };
}

export interface CourseModule extends Struct.ComponentSchema {
  collectionName: 'components_course_modules';
  info: {
    description: 'Course module containing lessons';
    displayName: 'Module';
    icon: 'folder';
  };
  attributes: {
    description: Schema.Attribute.Text;
    lessons: Schema.Attribute.Component<'course.lesson', true>;
    order: Schema.Attribute.Integer &
      Schema.Attribute.Required &
      Schema.Attribute.DefaultTo<1>;
    title: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface CourseSettings extends Struct.ComponentSchema {
  collectionName: 'components_course_settings';
  info: {
    description: 'Course visibility and configuration settings';
    displayName: 'Course Settings';
    icon: 'cog';
  };
  attributes: {
    featured: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>;
    language: Schema.Attribute.Enumeration<['es', 'en', 'pt']> &
      Schema.Attribute.DefaultTo<'es'>;
    releaseDate: Schema.Attribute.DateTime;
    seo: Schema.Attribute.Component<'shared.seo-metadata', false>;
    visible: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<true>;
  };
}

export interface SharedSeoMetadata extends Struct.ComponentSchema {
  collectionName: 'components_shared_seo_metadata';
  info: {
    description: 'Search engine optimization metadata';
    displayName: 'SEO Metadata';
    icon: 'search';
  };
  attributes: {
    metaDescription: Schema.Attribute.Text &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 160;
      }>;
    metaTitle: Schema.Attribute.String &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 60;
      }>;
    socialImage: Schema.Attribute.Media<'images'>;
  };
}

export interface SharedSocialLink extends Struct.ComponentSchema {
  collectionName: 'components_shared_social_links';
  info: {
    description: 'Social media profile link';
    displayName: 'Social Link';
    icon: 'link';
  };
  attributes: {
    platform: Schema.Attribute.Enumeration<
      ['twitter', 'instagram', 'linkedin', 'youtube', 'website', 'github']
    > &
      Schema.Attribute.Required;
    url: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

declare module '@strapi/strapi' {
  export module Public {
    export interface ComponentSchemas {
      'course.lesson': CourseLesson;
      'course.lesson-resource': CourseLessonResource;
      'course.module': CourseModule;
      'course.settings': CourseSettings;
      'shared.seo-metadata': SharedSeoMetadata;
      'shared.social-link': SharedSocialLink;
    }
  }
}
