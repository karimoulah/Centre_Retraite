import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  // Payload keeps its tables in their own schema, next to the API's tables.
  await db.execute(sql`CREATE SCHEMA IF NOT EXISTS "payload";`);
  await db.execute(sql`
   CREATE TYPE "payload"."enum_pages_blocks_hero_primary_action_type" AS ENUM('page', 'url');
  CREATE TYPE "payload"."enum_pages_blocks_stats_theme" AS ENUM('light', 'dark');
  CREATE TYPE "payload"."enum_pages_blocks_logo_strip_theme" AS ENUM('light', 'dark');
  CREATE TYPE "payload"."enum_pages_blocks_feature_split_cards_link_type" AS ENUM('page', 'url');
  CREATE TYPE "payload"."enum_pages_blocks_feature_split_action_type" AS ENUM('page', 'url');
  CREATE TYPE "payload"."enum_pages_blocks_services_list_services_link_type" AS ENUM('page', 'url');
  CREATE TYPE "payload"."enum_pages_blocks_services_list_action_type" AS ENUM('page', 'url');
  CREATE TYPE "payload"."enum_pages_blocks_feature_rows_rows_link_type" AS ENUM('page', 'url');
  CREATE TYPE "payload"."enum_pages_blocks_testimonials_video_grid_action_type" AS ENUM('page', 'url');
  CREATE TYPE "payload"."enum_pages_status" AS ENUM('draft', 'published');
  CREATE TYPE "payload"."enum__pages_v_blocks_hero_primary_action_type" AS ENUM('page', 'url');
  CREATE TYPE "payload"."enum__pages_v_blocks_stats_theme" AS ENUM('light', 'dark');
  CREATE TYPE "payload"."enum__pages_v_blocks_logo_strip_theme" AS ENUM('light', 'dark');
  CREATE TYPE "payload"."enum__pages_v_blocks_feature_split_cards_link_type" AS ENUM('page', 'url');
  CREATE TYPE "payload"."enum__pages_v_blocks_feature_split_action_type" AS ENUM('page', 'url');
  CREATE TYPE "payload"."enum__pages_v_blocks_services_list_services_link_type" AS ENUM('page', 'url');
  CREATE TYPE "payload"."enum__pages_v_blocks_services_list_action_type" AS ENUM('page', 'url');
  CREATE TYPE "payload"."enum__pages_v_blocks_feature_rows_rows_link_type" AS ENUM('page', 'url');
  CREATE TYPE "payload"."enum__pages_v_blocks_testimonials_video_grid_action_type" AS ENUM('page', 'url');
  CREATE TYPE "payload"."enum__pages_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "payload"."enum_site_settings_socials_platform" AS ENUM('facebook', 'instagram', 'youtube', 'linkedin', 'x');
  CREATE TYPE "payload"."enum_main_menu_items_type" AS ENUM('page', 'url');
  CREATE TYPE "payload"."enum_footer_menus_columns_links_type" AS ENUM('page', 'url');
  CREATE TABLE "payload"."pages_blocks_hero" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"badge" varchar,
  	"title" varchar,
  	"text" varchar,
  	"primary_action_label" varchar,
  	"primary_action_type" "payload"."enum_pages_blocks_hero_primary_action_type" DEFAULT 'page',
  	"primary_action_page_id" integer,
  	"primary_action_url" varchar,
  	"image_id" integer,
  	"medallion" varchar DEFAULT 'LES AÎNÉS • ENTRAIDE • ÉCOUTE •',
  	"block_name" varchar
  );
  
  CREATE TABLE "payload"."pages_blocks_stats_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"value" varchar,
  	"label" varchar
  );
  
  CREATE TABLE "payload"."pages_blocks_stats" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"theme" "payload"."enum_pages_blocks_stats_theme" DEFAULT 'light',
  	"block_name" varchar
  );
  
  CREATE TABLE "payload"."pages_blocks_logo_strip_logos" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"logo_id" integer,
  	"url" varchar
  );
  
  CREATE TABLE "payload"."pages_blocks_logo_strip" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"theme" "payload"."enum_pages_blocks_logo_strip_theme" DEFAULT 'light',
  	"title" varchar DEFAULT 'Nos partenaires',
  	"block_name" varchar
  );
  
  CREATE TABLE "payload"."pages_blocks_about_split_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"content" varchar
  );
  
  CREATE TABLE "payload"."pages_blocks_about_split" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"eyebrow" varchar,
  	"title" varchar,
  	"text" varchar,
  	"image_id" integer,
  	"highlight_value" varchar,
  	"highlight_label" varchar,
  	"show_upcoming_activities" boolean DEFAULT true,
  	"block_name" varchar
  );
  
  CREATE TABLE "payload"."pages_blocks_upcoming_activities" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"eyebrow" varchar,
  	"title" varchar,
  	"text" varchar,
  	"limit" numeric DEFAULT 6,
  	"block_name" varchar
  );
  
  CREATE TABLE "payload"."pages_blocks_feature_split_cards" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"text" varchar,
  	"link_label" varchar,
  	"link_type" "payload"."enum_pages_blocks_feature_split_cards_link_type" DEFAULT 'page',
  	"link_page_id" integer,
  	"link_url" varchar
  );
  
  CREATE TABLE "payload"."pages_blocks_feature_split" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"image_id" integer,
  	"title" varchar,
  	"action_label" varchar,
  	"action_type" "payload"."enum_pages_blocks_feature_split_action_type" DEFAULT 'page',
  	"action_page_id" integer,
  	"action_url" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "payload"."pages_blocks_services_list_services" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"description" varchar,
  	"image_id" integer,
  	"link_label" varchar,
  	"link_type" "payload"."enum_pages_blocks_services_list_services_link_type" DEFAULT 'page',
  	"link_page_id" integer,
  	"link_url" varchar
  );
  
  CREATE TABLE "payload"."pages_blocks_services_list" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"eyebrow" varchar,
  	"title" varchar,
  	"action_label" varchar,
  	"action_type" "payload"."enum_pages_blocks_services_list_action_type" DEFAULT 'page',
  	"action_page_id" integer,
  	"action_url" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "payload"."pages_blocks_feature_rows_rows" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"text" varchar,
  	"image_id" integer,
  	"link_label" varchar,
  	"link_type" "payload"."enum_pages_blocks_feature_rows_rows_link_type" DEFAULT 'page',
  	"link_page_id" integer,
  	"link_url" varchar
  );
  
  CREATE TABLE "payload"."pages_blocks_feature_rows" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"text" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "payload"."pages_blocks_testimonials_video_grid" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"text" varchar,
  	"action_label" varchar,
  	"action_type" "payload"."enum_pages_blocks_testimonials_video_grid_action_type" DEFAULT 'page',
  	"action_page_id" integer,
  	"action_url" varchar,
  	"limit" numeric DEFAULT 3,
  	"block_name" varchar
  );
  
  CREATE TABLE "payload"."pages_blocks_testimonial_carousel" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"text" varchar,
  	"limit" numeric DEFAULT 6,
  	"block_name" varchar
  );
  
  CREATE TABLE "payload"."pages_blocks_contact_cards" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar DEFAULT 'Nous joindre',
  	"block_name" varchar
  );
  
  CREATE TABLE "payload"."pages_blocks_content" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"body" jsonb,
  	"block_name" varchar
  );
  
  CREATE TABLE "payload"."pages" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"slug" varchar,
  	"meta_title" varchar,
  	"meta_description" varchar,
  	"meta_image_id" integer,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "payload"."enum_pages_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "payload"."_pages_v_blocks_hero" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"badge" varchar,
  	"title" varchar,
  	"text" varchar,
  	"primary_action_label" varchar,
  	"primary_action_type" "payload"."enum__pages_v_blocks_hero_primary_action_type" DEFAULT 'page',
  	"primary_action_page_id" integer,
  	"primary_action_url" varchar,
  	"image_id" integer,
  	"medallion" varchar DEFAULT 'LES AÎNÉS • ENTRAIDE • ÉCOUTE •',
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "payload"."_pages_v_blocks_stats_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"value" varchar,
  	"label" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "payload"."_pages_v_blocks_stats" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"theme" "payload"."enum__pages_v_blocks_stats_theme" DEFAULT 'light',
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "payload"."_pages_v_blocks_logo_strip_logos" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"logo_id" integer,
  	"url" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "payload"."_pages_v_blocks_logo_strip" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"theme" "payload"."enum__pages_v_blocks_logo_strip_theme" DEFAULT 'light',
  	"title" varchar DEFAULT 'Nos partenaires',
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "payload"."_pages_v_blocks_about_split_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"content" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "payload"."_pages_v_blocks_about_split" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"eyebrow" varchar,
  	"title" varchar,
  	"text" varchar,
  	"image_id" integer,
  	"highlight_value" varchar,
  	"highlight_label" varchar,
  	"show_upcoming_activities" boolean DEFAULT true,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "payload"."_pages_v_blocks_upcoming_activities" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"eyebrow" varchar,
  	"title" varchar,
  	"text" varchar,
  	"limit" numeric DEFAULT 6,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "payload"."_pages_v_blocks_feature_split_cards" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"text" varchar,
  	"link_label" varchar,
  	"link_type" "payload"."enum__pages_v_blocks_feature_split_cards_link_type" DEFAULT 'page',
  	"link_page_id" integer,
  	"link_url" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "payload"."_pages_v_blocks_feature_split" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"image_id" integer,
  	"title" varchar,
  	"action_label" varchar,
  	"action_type" "payload"."enum__pages_v_blocks_feature_split_action_type" DEFAULT 'page',
  	"action_page_id" integer,
  	"action_url" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "payload"."_pages_v_blocks_services_list_services" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"description" varchar,
  	"image_id" integer,
  	"link_label" varchar,
  	"link_type" "payload"."enum__pages_v_blocks_services_list_services_link_type" DEFAULT 'page',
  	"link_page_id" integer,
  	"link_url" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "payload"."_pages_v_blocks_services_list" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"eyebrow" varchar,
  	"title" varchar,
  	"action_label" varchar,
  	"action_type" "payload"."enum__pages_v_blocks_services_list_action_type" DEFAULT 'page',
  	"action_page_id" integer,
  	"action_url" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "payload"."_pages_v_blocks_feature_rows_rows" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"text" varchar,
  	"image_id" integer,
  	"link_label" varchar,
  	"link_type" "payload"."enum__pages_v_blocks_feature_rows_rows_link_type" DEFAULT 'page',
  	"link_page_id" integer,
  	"link_url" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "payload"."_pages_v_blocks_feature_rows" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"text" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "payload"."_pages_v_blocks_testimonials_video_grid" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"text" varchar,
  	"action_label" varchar,
  	"action_type" "payload"."enum__pages_v_blocks_testimonials_video_grid_action_type" DEFAULT 'page',
  	"action_page_id" integer,
  	"action_url" varchar,
  	"limit" numeric DEFAULT 3,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "payload"."_pages_v_blocks_testimonial_carousel" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"text" varchar,
  	"limit" numeric DEFAULT 6,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "payload"."_pages_v_blocks_contact_cards" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar DEFAULT 'Nous joindre',
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "payload"."_pages_v_blocks_content" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"body" jsonb,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "payload"."_pages_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_title" varchar,
  	"version_slug" varchar,
  	"version_meta_title" varchar,
  	"version_meta_description" varchar,
  	"version_meta_image_id" integer,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "payload"."enum__pages_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean
  );
  
  CREATE TABLE "payload"."activities" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar NOT NULL,
  	"starts_at" timestamp(3) with time zone NOT NULL,
  	"location" varchar,
  	"description" varchar,
  	"published" boolean DEFAULT true,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload"."media" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"alt" varchar NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"url" varchar,
  	"thumbnail_u_r_l" varchar,
  	"filename" varchar,
  	"mime_type" varchar,
  	"filesize" numeric,
  	"width" numeric,
  	"height" numeric,
  	"focal_x" numeric,
  	"focal_y" numeric
  );
  
  CREATE TABLE "payload"."users_sessions" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"created_at" timestamp(3) with time zone,
  	"expires_at" timestamp(3) with time zone NOT NULL
  );
  
  CREATE TABLE "payload"."users" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"email" varchar NOT NULL,
  	"reset_password_token" varchar,
  	"reset_password_expiration" timestamp(3) with time zone,
  	"salt" varchar,
  	"hash" varchar,
  	"reset_password_requested_at" timestamp(3) with time zone,
  	"login_attempts" numeric DEFAULT 0,
  	"lock_until" timestamp(3) with time zone
  );
  
  CREATE TABLE "payload"."payload_kv" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"key" varchar NOT NULL,
  	"data" jsonb NOT NULL
  );
  
  CREATE TABLE "payload"."payload_locked_documents" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"global_slug" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload"."payload_locked_documents_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"pages_id" integer,
  	"activities_id" integer,
  	"media_id" integer,
  	"users_id" integer
  );
  
  CREATE TABLE "payload"."payload_preferences" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"key" varchar,
  	"value" jsonb,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload"."payload_preferences_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"users_id" integer
  );
  
  CREATE TABLE "payload"."payload_migrations" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"batch" numeric,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload"."site_settings_socials" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"platform" "payload"."enum_site_settings_socials_platform" NOT NULL,
  	"url" varchar NOT NULL
  );
  
  CREATE TABLE "payload"."site_settings" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"phone" varchar NOT NULL,
  	"email" varchar NOT NULL,
  	"address" varchar NOT NULL,
  	"opening_hours" varchar,
  	"footer_text" varchar,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "payload"."main_menu_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"label" varchar NOT NULL,
  	"type" "payload"."enum_main_menu_items_type" DEFAULT 'page',
  	"page_id" integer,
  	"url" varchar
  );
  
  CREATE TABLE "payload"."main_menu" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "payload"."footer_menus_columns_links" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"label" varchar NOT NULL,
  	"type" "payload"."enum_footer_menus_columns_links_type" DEFAULT 'page',
  	"page_id" integer,
  	"url" varchar
  );
  
  CREATE TABLE "payload"."footer_menus_columns" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar NOT NULL
  );
  
  CREATE TABLE "payload"."footer_menus" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  ALTER TABLE "payload"."pages_blocks_hero" ADD CONSTRAINT "pages_blocks_hero_primary_action_page_id_pages_id_fk" FOREIGN KEY ("primary_action_page_id") REFERENCES "payload"."pages"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."pages_blocks_hero" ADD CONSTRAINT "pages_blocks_hero_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "payload"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."pages_blocks_hero" ADD CONSTRAINT "pages_blocks_hero_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."pages_blocks_stats_items" ADD CONSTRAINT "pages_blocks_stats_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."pages_blocks_stats"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."pages_blocks_stats" ADD CONSTRAINT "pages_blocks_stats_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."pages_blocks_logo_strip_logos" ADD CONSTRAINT "pages_blocks_logo_strip_logos_logo_id_media_id_fk" FOREIGN KEY ("logo_id") REFERENCES "payload"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."pages_blocks_logo_strip_logos" ADD CONSTRAINT "pages_blocks_logo_strip_logos_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."pages_blocks_logo_strip"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."pages_blocks_logo_strip" ADD CONSTRAINT "pages_blocks_logo_strip_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."pages_blocks_about_split_items" ADD CONSTRAINT "pages_blocks_about_split_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."pages_blocks_about_split"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."pages_blocks_about_split" ADD CONSTRAINT "pages_blocks_about_split_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "payload"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."pages_blocks_about_split" ADD CONSTRAINT "pages_blocks_about_split_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."pages_blocks_upcoming_activities" ADD CONSTRAINT "pages_blocks_upcoming_activities_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."pages_blocks_feature_split_cards" ADD CONSTRAINT "pages_blocks_feature_split_cards_link_page_id_pages_id_fk" FOREIGN KEY ("link_page_id") REFERENCES "payload"."pages"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."pages_blocks_feature_split_cards" ADD CONSTRAINT "pages_blocks_feature_split_cards_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."pages_blocks_feature_split"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."pages_blocks_feature_split" ADD CONSTRAINT "pages_blocks_feature_split_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "payload"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."pages_blocks_feature_split" ADD CONSTRAINT "pages_blocks_feature_split_action_page_id_pages_id_fk" FOREIGN KEY ("action_page_id") REFERENCES "payload"."pages"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."pages_blocks_feature_split" ADD CONSTRAINT "pages_blocks_feature_split_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."pages_blocks_services_list_services" ADD CONSTRAINT "pages_blocks_services_list_services_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "payload"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."pages_blocks_services_list_services" ADD CONSTRAINT "pages_blocks_services_list_services_link_page_id_pages_id_fk" FOREIGN KEY ("link_page_id") REFERENCES "payload"."pages"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."pages_blocks_services_list_services" ADD CONSTRAINT "pages_blocks_services_list_services_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."pages_blocks_services_list"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."pages_blocks_services_list" ADD CONSTRAINT "pages_blocks_services_list_action_page_id_pages_id_fk" FOREIGN KEY ("action_page_id") REFERENCES "payload"."pages"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."pages_blocks_services_list" ADD CONSTRAINT "pages_blocks_services_list_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."pages_blocks_feature_rows_rows" ADD CONSTRAINT "pages_blocks_feature_rows_rows_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "payload"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."pages_blocks_feature_rows_rows" ADD CONSTRAINT "pages_blocks_feature_rows_rows_link_page_id_pages_id_fk" FOREIGN KEY ("link_page_id") REFERENCES "payload"."pages"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."pages_blocks_feature_rows_rows" ADD CONSTRAINT "pages_blocks_feature_rows_rows_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."pages_blocks_feature_rows"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."pages_blocks_feature_rows" ADD CONSTRAINT "pages_blocks_feature_rows_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."pages_blocks_testimonials_video_grid" ADD CONSTRAINT "pages_blocks_testimonials_video_grid_action_page_id_pages_id_fk" FOREIGN KEY ("action_page_id") REFERENCES "payload"."pages"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."pages_blocks_testimonials_video_grid" ADD CONSTRAINT "pages_blocks_testimonials_video_grid_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."pages_blocks_testimonial_carousel" ADD CONSTRAINT "pages_blocks_testimonial_carousel_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."pages_blocks_contact_cards" ADD CONSTRAINT "pages_blocks_contact_cards_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."pages_blocks_content" ADD CONSTRAINT "pages_blocks_content_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."pages" ADD CONSTRAINT "pages_meta_image_id_media_id_fk" FOREIGN KEY ("meta_image_id") REFERENCES "payload"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."_pages_v_blocks_hero" ADD CONSTRAINT "_pages_v_blocks_hero_primary_action_page_id_pages_id_fk" FOREIGN KEY ("primary_action_page_id") REFERENCES "payload"."pages"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."_pages_v_blocks_hero" ADD CONSTRAINT "_pages_v_blocks_hero_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "payload"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."_pages_v_blocks_hero" ADD CONSTRAINT "_pages_v_blocks_hero_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."_pages_v_blocks_stats_items" ADD CONSTRAINT "_pages_v_blocks_stats_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."_pages_v_blocks_stats"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."_pages_v_blocks_stats" ADD CONSTRAINT "_pages_v_blocks_stats_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."_pages_v_blocks_logo_strip_logos" ADD CONSTRAINT "_pages_v_blocks_logo_strip_logos_logo_id_media_id_fk" FOREIGN KEY ("logo_id") REFERENCES "payload"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."_pages_v_blocks_logo_strip_logos" ADD CONSTRAINT "_pages_v_blocks_logo_strip_logos_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."_pages_v_blocks_logo_strip"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."_pages_v_blocks_logo_strip" ADD CONSTRAINT "_pages_v_blocks_logo_strip_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."_pages_v_blocks_about_split_items" ADD CONSTRAINT "_pages_v_blocks_about_split_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."_pages_v_blocks_about_split"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."_pages_v_blocks_about_split" ADD CONSTRAINT "_pages_v_blocks_about_split_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "payload"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."_pages_v_blocks_about_split" ADD CONSTRAINT "_pages_v_blocks_about_split_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."_pages_v_blocks_upcoming_activities" ADD CONSTRAINT "_pages_v_blocks_upcoming_activities_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."_pages_v_blocks_feature_split_cards" ADD CONSTRAINT "_pages_v_blocks_feature_split_cards_link_page_id_pages_id_fk" FOREIGN KEY ("link_page_id") REFERENCES "payload"."pages"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."_pages_v_blocks_feature_split_cards" ADD CONSTRAINT "_pages_v_blocks_feature_split_cards_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."_pages_v_blocks_feature_split"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."_pages_v_blocks_feature_split" ADD CONSTRAINT "_pages_v_blocks_feature_split_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "payload"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."_pages_v_blocks_feature_split" ADD CONSTRAINT "_pages_v_blocks_feature_split_action_page_id_pages_id_fk" FOREIGN KEY ("action_page_id") REFERENCES "payload"."pages"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."_pages_v_blocks_feature_split" ADD CONSTRAINT "_pages_v_blocks_feature_split_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."_pages_v_blocks_services_list_services" ADD CONSTRAINT "_pages_v_blocks_services_list_services_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "payload"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."_pages_v_blocks_services_list_services" ADD CONSTRAINT "_pages_v_blocks_services_list_services_link_page_id_pages_id_fk" FOREIGN KEY ("link_page_id") REFERENCES "payload"."pages"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."_pages_v_blocks_services_list_services" ADD CONSTRAINT "_pages_v_blocks_services_list_services_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."_pages_v_blocks_services_list"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."_pages_v_blocks_services_list" ADD CONSTRAINT "_pages_v_blocks_services_list_action_page_id_pages_id_fk" FOREIGN KEY ("action_page_id") REFERENCES "payload"."pages"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."_pages_v_blocks_services_list" ADD CONSTRAINT "_pages_v_blocks_services_list_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."_pages_v_blocks_feature_rows_rows" ADD CONSTRAINT "_pages_v_blocks_feature_rows_rows_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "payload"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."_pages_v_blocks_feature_rows_rows" ADD CONSTRAINT "_pages_v_blocks_feature_rows_rows_link_page_id_pages_id_fk" FOREIGN KEY ("link_page_id") REFERENCES "payload"."pages"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."_pages_v_blocks_feature_rows_rows" ADD CONSTRAINT "_pages_v_blocks_feature_rows_rows_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."_pages_v_blocks_feature_rows"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."_pages_v_blocks_feature_rows" ADD CONSTRAINT "_pages_v_blocks_feature_rows_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."_pages_v_blocks_testimonials_video_grid" ADD CONSTRAINT "_pages_v_blocks_testimonials_video_grid_action_page_id_pages_id_fk" FOREIGN KEY ("action_page_id") REFERENCES "payload"."pages"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."_pages_v_blocks_testimonials_video_grid" ADD CONSTRAINT "_pages_v_blocks_testimonials_video_grid_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."_pages_v_blocks_testimonial_carousel" ADD CONSTRAINT "_pages_v_blocks_testimonial_carousel_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."_pages_v_blocks_contact_cards" ADD CONSTRAINT "_pages_v_blocks_contact_cards_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."_pages_v_blocks_content" ADD CONSTRAINT "_pages_v_blocks_content_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."_pages_v" ADD CONSTRAINT "_pages_v_parent_id_pages_id_fk" FOREIGN KEY ("parent_id") REFERENCES "payload"."pages"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."_pages_v" ADD CONSTRAINT "_pages_v_version_meta_image_id_media_id_fk" FOREIGN KEY ("version_meta_image_id") REFERENCES "payload"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."users_sessions" ADD CONSTRAINT "users_sessions_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "payload"."payload_locked_documents"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_pages_fk" FOREIGN KEY ("pages_id") REFERENCES "payload"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_activities_fk" FOREIGN KEY ("activities_id") REFERENCES "payload"."activities"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "payload"."media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "payload"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "payload"."payload_preferences"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "payload"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."site_settings_socials" ADD CONSTRAINT "site_settings_socials_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."site_settings"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."main_menu_items" ADD CONSTRAINT "main_menu_items_page_id_pages_id_fk" FOREIGN KEY ("page_id") REFERENCES "payload"."pages"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."main_menu_items" ADD CONSTRAINT "main_menu_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."main_menu"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."footer_menus_columns_links" ADD CONSTRAINT "footer_menus_columns_links_page_id_pages_id_fk" FOREIGN KEY ("page_id") REFERENCES "payload"."pages"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."footer_menus_columns_links" ADD CONSTRAINT "footer_menus_columns_links_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."footer_menus_columns"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."footer_menus_columns" ADD CONSTRAINT "footer_menus_columns_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."footer_menus"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "pages_blocks_hero_order_idx" ON "payload"."pages_blocks_hero" USING btree ("_order");
  CREATE INDEX "pages_blocks_hero_parent_id_idx" ON "payload"."pages_blocks_hero" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_hero_path_idx" ON "payload"."pages_blocks_hero" USING btree ("_path");
  CREATE INDEX "pages_blocks_hero_primary_action_primary_action_page_idx" ON "payload"."pages_blocks_hero" USING btree ("primary_action_page_id");
  CREATE INDEX "pages_blocks_hero_image_idx" ON "payload"."pages_blocks_hero" USING btree ("image_id");
  CREATE INDEX "pages_blocks_stats_items_order_idx" ON "payload"."pages_blocks_stats_items" USING btree ("_order");
  CREATE INDEX "pages_blocks_stats_items_parent_id_idx" ON "payload"."pages_blocks_stats_items" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_stats_order_idx" ON "payload"."pages_blocks_stats" USING btree ("_order");
  CREATE INDEX "pages_blocks_stats_parent_id_idx" ON "payload"."pages_blocks_stats" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_stats_path_idx" ON "payload"."pages_blocks_stats" USING btree ("_path");
  CREATE INDEX "pages_blocks_logo_strip_logos_order_idx" ON "payload"."pages_blocks_logo_strip_logos" USING btree ("_order");
  CREATE INDEX "pages_blocks_logo_strip_logos_parent_id_idx" ON "payload"."pages_blocks_logo_strip_logos" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_logo_strip_logos_logo_idx" ON "payload"."pages_blocks_logo_strip_logos" USING btree ("logo_id");
  CREATE INDEX "pages_blocks_logo_strip_order_idx" ON "payload"."pages_blocks_logo_strip" USING btree ("_order");
  CREATE INDEX "pages_blocks_logo_strip_parent_id_idx" ON "payload"."pages_blocks_logo_strip" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_logo_strip_path_idx" ON "payload"."pages_blocks_logo_strip" USING btree ("_path");
  CREATE INDEX "pages_blocks_about_split_items_order_idx" ON "payload"."pages_blocks_about_split_items" USING btree ("_order");
  CREATE INDEX "pages_blocks_about_split_items_parent_id_idx" ON "payload"."pages_blocks_about_split_items" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_about_split_order_idx" ON "payload"."pages_blocks_about_split" USING btree ("_order");
  CREATE INDEX "pages_blocks_about_split_parent_id_idx" ON "payload"."pages_blocks_about_split" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_about_split_path_idx" ON "payload"."pages_blocks_about_split" USING btree ("_path");
  CREATE INDEX "pages_blocks_about_split_image_idx" ON "payload"."pages_blocks_about_split" USING btree ("image_id");
  CREATE INDEX "pages_blocks_upcoming_activities_order_idx" ON "payload"."pages_blocks_upcoming_activities" USING btree ("_order");
  CREATE INDEX "pages_blocks_upcoming_activities_parent_id_idx" ON "payload"."pages_blocks_upcoming_activities" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_upcoming_activities_path_idx" ON "payload"."pages_blocks_upcoming_activities" USING btree ("_path");
  CREATE INDEX "pages_blocks_feature_split_cards_order_idx" ON "payload"."pages_blocks_feature_split_cards" USING btree ("_order");
  CREATE INDEX "pages_blocks_feature_split_cards_parent_id_idx" ON "payload"."pages_blocks_feature_split_cards" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_feature_split_cards_link_link_page_idx" ON "payload"."pages_blocks_feature_split_cards" USING btree ("link_page_id");
  CREATE INDEX "pages_blocks_feature_split_order_idx" ON "payload"."pages_blocks_feature_split" USING btree ("_order");
  CREATE INDEX "pages_blocks_feature_split_parent_id_idx" ON "payload"."pages_blocks_feature_split" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_feature_split_path_idx" ON "payload"."pages_blocks_feature_split" USING btree ("_path");
  CREATE INDEX "pages_blocks_feature_split_image_idx" ON "payload"."pages_blocks_feature_split" USING btree ("image_id");
  CREATE INDEX "pages_blocks_feature_split_action_action_page_idx" ON "payload"."pages_blocks_feature_split" USING btree ("action_page_id");
  CREATE INDEX "pages_blocks_services_list_services_order_idx" ON "payload"."pages_blocks_services_list_services" USING btree ("_order");
  CREATE INDEX "pages_blocks_services_list_services_parent_id_idx" ON "payload"."pages_blocks_services_list_services" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_services_list_services_image_idx" ON "payload"."pages_blocks_services_list_services" USING btree ("image_id");
  CREATE INDEX "pages_blocks_services_list_services_link_link_page_idx" ON "payload"."pages_blocks_services_list_services" USING btree ("link_page_id");
  CREATE INDEX "pages_blocks_services_list_order_idx" ON "payload"."pages_blocks_services_list" USING btree ("_order");
  CREATE INDEX "pages_blocks_services_list_parent_id_idx" ON "payload"."pages_blocks_services_list" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_services_list_path_idx" ON "payload"."pages_blocks_services_list" USING btree ("_path");
  CREATE INDEX "pages_blocks_services_list_action_action_page_idx" ON "payload"."pages_blocks_services_list" USING btree ("action_page_id");
  CREATE INDEX "pages_blocks_feature_rows_rows_order_idx" ON "payload"."pages_blocks_feature_rows_rows" USING btree ("_order");
  CREATE INDEX "pages_blocks_feature_rows_rows_parent_id_idx" ON "payload"."pages_blocks_feature_rows_rows" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_feature_rows_rows_image_idx" ON "payload"."pages_blocks_feature_rows_rows" USING btree ("image_id");
  CREATE INDEX "pages_blocks_feature_rows_rows_link_link_page_idx" ON "payload"."pages_blocks_feature_rows_rows" USING btree ("link_page_id");
  CREATE INDEX "pages_blocks_feature_rows_order_idx" ON "payload"."pages_blocks_feature_rows" USING btree ("_order");
  CREATE INDEX "pages_blocks_feature_rows_parent_id_idx" ON "payload"."pages_blocks_feature_rows" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_feature_rows_path_idx" ON "payload"."pages_blocks_feature_rows" USING btree ("_path");
  CREATE INDEX "pages_blocks_testimonials_video_grid_order_idx" ON "payload"."pages_blocks_testimonials_video_grid" USING btree ("_order");
  CREATE INDEX "pages_blocks_testimonials_video_grid_parent_id_idx" ON "payload"."pages_blocks_testimonials_video_grid" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_testimonials_video_grid_path_idx" ON "payload"."pages_blocks_testimonials_video_grid" USING btree ("_path");
  CREATE INDEX "pages_blocks_testimonials_video_grid_action_action_page_idx" ON "payload"."pages_blocks_testimonials_video_grid" USING btree ("action_page_id");
  CREATE INDEX "pages_blocks_testimonial_carousel_order_idx" ON "payload"."pages_blocks_testimonial_carousel" USING btree ("_order");
  CREATE INDEX "pages_blocks_testimonial_carousel_parent_id_idx" ON "payload"."pages_blocks_testimonial_carousel" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_testimonial_carousel_path_idx" ON "payload"."pages_blocks_testimonial_carousel" USING btree ("_path");
  CREATE INDEX "pages_blocks_contact_cards_order_idx" ON "payload"."pages_blocks_contact_cards" USING btree ("_order");
  CREATE INDEX "pages_blocks_contact_cards_parent_id_idx" ON "payload"."pages_blocks_contact_cards" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_contact_cards_path_idx" ON "payload"."pages_blocks_contact_cards" USING btree ("_path");
  CREATE INDEX "pages_blocks_content_order_idx" ON "payload"."pages_blocks_content" USING btree ("_order");
  CREATE INDEX "pages_blocks_content_parent_id_idx" ON "payload"."pages_blocks_content" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_content_path_idx" ON "payload"."pages_blocks_content" USING btree ("_path");
  CREATE UNIQUE INDEX "pages_slug_idx" ON "payload"."pages" USING btree ("slug");
  CREATE INDEX "pages_meta_meta_image_idx" ON "payload"."pages" USING btree ("meta_image_id");
  CREATE INDEX "pages_updated_at_idx" ON "payload"."pages" USING btree ("updated_at");
  CREATE INDEX "pages_created_at_idx" ON "payload"."pages" USING btree ("created_at");
  CREATE INDEX "pages__status_idx" ON "payload"."pages" USING btree ("_status");
  CREATE INDEX "_pages_v_blocks_hero_order_idx" ON "payload"."_pages_v_blocks_hero" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_hero_parent_id_idx" ON "payload"."_pages_v_blocks_hero" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_hero_path_idx" ON "payload"."_pages_v_blocks_hero" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_hero_primary_action_primary_action_page_idx" ON "payload"."_pages_v_blocks_hero" USING btree ("primary_action_page_id");
  CREATE INDEX "_pages_v_blocks_hero_image_idx" ON "payload"."_pages_v_blocks_hero" USING btree ("image_id");
  CREATE INDEX "_pages_v_blocks_stats_items_order_idx" ON "payload"."_pages_v_blocks_stats_items" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_stats_items_parent_id_idx" ON "payload"."_pages_v_blocks_stats_items" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_stats_order_idx" ON "payload"."_pages_v_blocks_stats" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_stats_parent_id_idx" ON "payload"."_pages_v_blocks_stats" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_stats_path_idx" ON "payload"."_pages_v_blocks_stats" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_logo_strip_logos_order_idx" ON "payload"."_pages_v_blocks_logo_strip_logos" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_logo_strip_logos_parent_id_idx" ON "payload"."_pages_v_blocks_logo_strip_logos" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_logo_strip_logos_logo_idx" ON "payload"."_pages_v_blocks_logo_strip_logos" USING btree ("logo_id");
  CREATE INDEX "_pages_v_blocks_logo_strip_order_idx" ON "payload"."_pages_v_blocks_logo_strip" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_logo_strip_parent_id_idx" ON "payload"."_pages_v_blocks_logo_strip" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_logo_strip_path_idx" ON "payload"."_pages_v_blocks_logo_strip" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_about_split_items_order_idx" ON "payload"."_pages_v_blocks_about_split_items" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_about_split_items_parent_id_idx" ON "payload"."_pages_v_blocks_about_split_items" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_about_split_order_idx" ON "payload"."_pages_v_blocks_about_split" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_about_split_parent_id_idx" ON "payload"."_pages_v_blocks_about_split" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_about_split_path_idx" ON "payload"."_pages_v_blocks_about_split" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_about_split_image_idx" ON "payload"."_pages_v_blocks_about_split" USING btree ("image_id");
  CREATE INDEX "_pages_v_blocks_upcoming_activities_order_idx" ON "payload"."_pages_v_blocks_upcoming_activities" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_upcoming_activities_parent_id_idx" ON "payload"."_pages_v_blocks_upcoming_activities" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_upcoming_activities_path_idx" ON "payload"."_pages_v_blocks_upcoming_activities" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_feature_split_cards_order_idx" ON "payload"."_pages_v_blocks_feature_split_cards" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_feature_split_cards_parent_id_idx" ON "payload"."_pages_v_blocks_feature_split_cards" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_feature_split_cards_link_link_page_idx" ON "payload"."_pages_v_blocks_feature_split_cards" USING btree ("link_page_id");
  CREATE INDEX "_pages_v_blocks_feature_split_order_idx" ON "payload"."_pages_v_blocks_feature_split" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_feature_split_parent_id_idx" ON "payload"."_pages_v_blocks_feature_split" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_feature_split_path_idx" ON "payload"."_pages_v_blocks_feature_split" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_feature_split_image_idx" ON "payload"."_pages_v_blocks_feature_split" USING btree ("image_id");
  CREATE INDEX "_pages_v_blocks_feature_split_action_action_page_idx" ON "payload"."_pages_v_blocks_feature_split" USING btree ("action_page_id");
  CREATE INDEX "_pages_v_blocks_services_list_services_order_idx" ON "payload"."_pages_v_blocks_services_list_services" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_services_list_services_parent_id_idx" ON "payload"."_pages_v_blocks_services_list_services" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_services_list_services_image_idx" ON "payload"."_pages_v_blocks_services_list_services" USING btree ("image_id");
  CREATE INDEX "_pages_v_blocks_services_list_services_link_link_page_idx" ON "payload"."_pages_v_blocks_services_list_services" USING btree ("link_page_id");
  CREATE INDEX "_pages_v_blocks_services_list_order_idx" ON "payload"."_pages_v_blocks_services_list" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_services_list_parent_id_idx" ON "payload"."_pages_v_blocks_services_list" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_services_list_path_idx" ON "payload"."_pages_v_blocks_services_list" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_services_list_action_action_page_idx" ON "payload"."_pages_v_blocks_services_list" USING btree ("action_page_id");
  CREATE INDEX "_pages_v_blocks_feature_rows_rows_order_idx" ON "payload"."_pages_v_blocks_feature_rows_rows" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_feature_rows_rows_parent_id_idx" ON "payload"."_pages_v_blocks_feature_rows_rows" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_feature_rows_rows_image_idx" ON "payload"."_pages_v_blocks_feature_rows_rows" USING btree ("image_id");
  CREATE INDEX "_pages_v_blocks_feature_rows_rows_link_link_page_idx" ON "payload"."_pages_v_blocks_feature_rows_rows" USING btree ("link_page_id");
  CREATE INDEX "_pages_v_blocks_feature_rows_order_idx" ON "payload"."_pages_v_blocks_feature_rows" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_feature_rows_parent_id_idx" ON "payload"."_pages_v_blocks_feature_rows" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_feature_rows_path_idx" ON "payload"."_pages_v_blocks_feature_rows" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_testimonials_video_grid_order_idx" ON "payload"."_pages_v_blocks_testimonials_video_grid" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_testimonials_video_grid_parent_id_idx" ON "payload"."_pages_v_blocks_testimonials_video_grid" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_testimonials_video_grid_path_idx" ON "payload"."_pages_v_blocks_testimonials_video_grid" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_testimonials_video_grid_action_action_pa_idx" ON "payload"."_pages_v_blocks_testimonials_video_grid" USING btree ("action_page_id");
  CREATE INDEX "_pages_v_blocks_testimonial_carousel_order_idx" ON "payload"."_pages_v_blocks_testimonial_carousel" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_testimonial_carousel_parent_id_idx" ON "payload"."_pages_v_blocks_testimonial_carousel" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_testimonial_carousel_path_idx" ON "payload"."_pages_v_blocks_testimonial_carousel" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_contact_cards_order_idx" ON "payload"."_pages_v_blocks_contact_cards" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_contact_cards_parent_id_idx" ON "payload"."_pages_v_blocks_contact_cards" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_contact_cards_path_idx" ON "payload"."_pages_v_blocks_contact_cards" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_content_order_idx" ON "payload"."_pages_v_blocks_content" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_content_parent_id_idx" ON "payload"."_pages_v_blocks_content" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_content_path_idx" ON "payload"."_pages_v_blocks_content" USING btree ("_path");
  CREATE INDEX "_pages_v_parent_idx" ON "payload"."_pages_v" USING btree ("parent_id");
  CREATE INDEX "_pages_v_version_version_slug_idx" ON "payload"."_pages_v" USING btree ("version_slug");
  CREATE INDEX "_pages_v_version_meta_version_meta_image_idx" ON "payload"."_pages_v" USING btree ("version_meta_image_id");
  CREATE INDEX "_pages_v_version_version_updated_at_idx" ON "payload"."_pages_v" USING btree ("version_updated_at");
  CREATE INDEX "_pages_v_version_version_created_at_idx" ON "payload"."_pages_v" USING btree ("version_created_at");
  CREATE INDEX "_pages_v_version_version__status_idx" ON "payload"."_pages_v" USING btree ("version__status");
  CREATE INDEX "_pages_v_created_at_idx" ON "payload"."_pages_v" USING btree ("created_at");
  CREATE INDEX "_pages_v_updated_at_idx" ON "payload"."_pages_v" USING btree ("updated_at");
  CREATE INDEX "_pages_v_latest_idx" ON "payload"."_pages_v" USING btree ("latest");
  CREATE INDEX "activities_updated_at_idx" ON "payload"."activities" USING btree ("updated_at");
  CREATE INDEX "activities_created_at_idx" ON "payload"."activities" USING btree ("created_at");
  CREATE INDEX "media_updated_at_idx" ON "payload"."media" USING btree ("updated_at");
  CREATE INDEX "media_created_at_idx" ON "payload"."media" USING btree ("created_at");
  CREATE UNIQUE INDEX "media_filename_idx" ON "payload"."media" USING btree ("filename");
  CREATE INDEX "users_sessions_order_idx" ON "payload"."users_sessions" USING btree ("_order");
  CREATE INDEX "users_sessions_parent_id_idx" ON "payload"."users_sessions" USING btree ("_parent_id");
  CREATE INDEX "users_updated_at_idx" ON "payload"."users" USING btree ("updated_at");
  CREATE INDEX "users_created_at_idx" ON "payload"."users" USING btree ("created_at");
  CREATE UNIQUE INDEX "users_email_idx" ON "payload"."users" USING btree ("email");
  CREATE UNIQUE INDEX "payload_kv_key_idx" ON "payload"."payload_kv" USING btree ("key");
  CREATE INDEX "payload_locked_documents_global_slug_idx" ON "payload"."payload_locked_documents" USING btree ("global_slug");
  CREATE INDEX "payload_locked_documents_updated_at_idx" ON "payload"."payload_locked_documents" USING btree ("updated_at");
  CREATE INDEX "payload_locked_documents_created_at_idx" ON "payload"."payload_locked_documents" USING btree ("created_at");
  CREATE INDEX "payload_locked_documents_rels_order_idx" ON "payload"."payload_locked_documents_rels" USING btree ("order");
  CREATE INDEX "payload_locked_documents_rels_parent_idx" ON "payload"."payload_locked_documents_rels" USING btree ("parent_id");
  CREATE INDEX "payload_locked_documents_rels_path_idx" ON "payload"."payload_locked_documents_rels" USING btree ("path");
  CREATE INDEX "payload_locked_documents_rels_pages_id_idx" ON "payload"."payload_locked_documents_rels" USING btree ("pages_id");
  CREATE INDEX "payload_locked_documents_rels_activities_id_idx" ON "payload"."payload_locked_documents_rels" USING btree ("activities_id");
  CREATE INDEX "payload_locked_documents_rels_media_id_idx" ON "payload"."payload_locked_documents_rels" USING btree ("media_id");
  CREATE INDEX "payload_locked_documents_rels_users_id_idx" ON "payload"."payload_locked_documents_rels" USING btree ("users_id");
  CREATE INDEX "payload_preferences_key_idx" ON "payload"."payload_preferences" USING btree ("key");
  CREATE INDEX "payload_preferences_updated_at_idx" ON "payload"."payload_preferences" USING btree ("updated_at");
  CREATE INDEX "payload_preferences_created_at_idx" ON "payload"."payload_preferences" USING btree ("created_at");
  CREATE INDEX "payload_preferences_rels_order_idx" ON "payload"."payload_preferences_rels" USING btree ("order");
  CREATE INDEX "payload_preferences_rels_parent_idx" ON "payload"."payload_preferences_rels" USING btree ("parent_id");
  CREATE INDEX "payload_preferences_rels_path_idx" ON "payload"."payload_preferences_rels" USING btree ("path");
  CREATE INDEX "payload_preferences_rels_users_id_idx" ON "payload"."payload_preferences_rels" USING btree ("users_id");
  CREATE INDEX "payload_migrations_updated_at_idx" ON "payload"."payload_migrations" USING btree ("updated_at");
  CREATE INDEX "payload_migrations_created_at_idx" ON "payload"."payload_migrations" USING btree ("created_at");
  CREATE INDEX "site_settings_socials_order_idx" ON "payload"."site_settings_socials" USING btree ("_order");
  CREATE INDEX "site_settings_socials_parent_id_idx" ON "payload"."site_settings_socials" USING btree ("_parent_id");
  CREATE INDEX "main_menu_items_order_idx" ON "payload"."main_menu_items" USING btree ("_order");
  CREATE INDEX "main_menu_items_parent_id_idx" ON "payload"."main_menu_items" USING btree ("_parent_id");
  CREATE INDEX "main_menu_items_page_idx" ON "payload"."main_menu_items" USING btree ("page_id");
  CREATE INDEX "footer_menus_columns_links_order_idx" ON "payload"."footer_menus_columns_links" USING btree ("_order");
  CREATE INDEX "footer_menus_columns_links_parent_id_idx" ON "payload"."footer_menus_columns_links" USING btree ("_parent_id");
  CREATE INDEX "footer_menus_columns_links_page_idx" ON "payload"."footer_menus_columns_links" USING btree ("page_id");
  CREATE INDEX "footer_menus_columns_order_idx" ON "payload"."footer_menus_columns" USING btree ("_order");
  CREATE INDEX "footer_menus_columns_parent_id_idx" ON "payload"."footer_menus_columns" USING btree ("_parent_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "payload"."pages_blocks_hero" CASCADE;
  DROP TABLE "payload"."pages_blocks_stats_items" CASCADE;
  DROP TABLE "payload"."pages_blocks_stats" CASCADE;
  DROP TABLE "payload"."pages_blocks_logo_strip_logos" CASCADE;
  DROP TABLE "payload"."pages_blocks_logo_strip" CASCADE;
  DROP TABLE "payload"."pages_blocks_about_split_items" CASCADE;
  DROP TABLE "payload"."pages_blocks_about_split" CASCADE;
  DROP TABLE "payload"."pages_blocks_upcoming_activities" CASCADE;
  DROP TABLE "payload"."pages_blocks_feature_split_cards" CASCADE;
  DROP TABLE "payload"."pages_blocks_feature_split" CASCADE;
  DROP TABLE "payload"."pages_blocks_services_list_services" CASCADE;
  DROP TABLE "payload"."pages_blocks_services_list" CASCADE;
  DROP TABLE "payload"."pages_blocks_feature_rows_rows" CASCADE;
  DROP TABLE "payload"."pages_blocks_feature_rows" CASCADE;
  DROP TABLE "payload"."pages_blocks_testimonials_video_grid" CASCADE;
  DROP TABLE "payload"."pages_blocks_testimonial_carousel" CASCADE;
  DROP TABLE "payload"."pages_blocks_contact_cards" CASCADE;
  DROP TABLE "payload"."pages_blocks_content" CASCADE;
  DROP TABLE "payload"."pages" CASCADE;
  DROP TABLE "payload"."_pages_v_blocks_hero" CASCADE;
  DROP TABLE "payload"."_pages_v_blocks_stats_items" CASCADE;
  DROP TABLE "payload"."_pages_v_blocks_stats" CASCADE;
  DROP TABLE "payload"."_pages_v_blocks_logo_strip_logos" CASCADE;
  DROP TABLE "payload"."_pages_v_blocks_logo_strip" CASCADE;
  DROP TABLE "payload"."_pages_v_blocks_about_split_items" CASCADE;
  DROP TABLE "payload"."_pages_v_blocks_about_split" CASCADE;
  DROP TABLE "payload"."_pages_v_blocks_upcoming_activities" CASCADE;
  DROP TABLE "payload"."_pages_v_blocks_feature_split_cards" CASCADE;
  DROP TABLE "payload"."_pages_v_blocks_feature_split" CASCADE;
  DROP TABLE "payload"."_pages_v_blocks_services_list_services" CASCADE;
  DROP TABLE "payload"."_pages_v_blocks_services_list" CASCADE;
  DROP TABLE "payload"."_pages_v_blocks_feature_rows_rows" CASCADE;
  DROP TABLE "payload"."_pages_v_blocks_feature_rows" CASCADE;
  DROP TABLE "payload"."_pages_v_blocks_testimonials_video_grid" CASCADE;
  DROP TABLE "payload"."_pages_v_blocks_testimonial_carousel" CASCADE;
  DROP TABLE "payload"."_pages_v_blocks_contact_cards" CASCADE;
  DROP TABLE "payload"."_pages_v_blocks_content" CASCADE;
  DROP TABLE "payload"."_pages_v" CASCADE;
  DROP TABLE "payload"."activities" CASCADE;
  DROP TABLE "payload"."media" CASCADE;
  DROP TABLE "payload"."users_sessions" CASCADE;
  DROP TABLE "payload"."users" CASCADE;
  DROP TABLE "payload"."payload_kv" CASCADE;
  DROP TABLE "payload"."payload_locked_documents" CASCADE;
  DROP TABLE "payload"."payload_locked_documents_rels" CASCADE;
  DROP TABLE "payload"."payload_preferences" CASCADE;
  DROP TABLE "payload"."payload_preferences_rels" CASCADE;
  DROP TABLE "payload"."payload_migrations" CASCADE;
  DROP TABLE "payload"."site_settings_socials" CASCADE;
  DROP TABLE "payload"."site_settings" CASCADE;
  DROP TABLE "payload"."main_menu_items" CASCADE;
  DROP TABLE "payload"."main_menu" CASCADE;
  DROP TABLE "payload"."footer_menus_columns_links" CASCADE;
  DROP TABLE "payload"."footer_menus_columns" CASCADE;
  DROP TABLE "payload"."footer_menus" CASCADE;
  DROP TYPE "payload"."enum_pages_blocks_hero_primary_action_type";
  DROP TYPE "payload"."enum_pages_blocks_stats_theme";
  DROP TYPE "payload"."enum_pages_blocks_logo_strip_theme";
  DROP TYPE "payload"."enum_pages_blocks_feature_split_cards_link_type";
  DROP TYPE "payload"."enum_pages_blocks_feature_split_action_type";
  DROP TYPE "payload"."enum_pages_blocks_services_list_services_link_type";
  DROP TYPE "payload"."enum_pages_blocks_services_list_action_type";
  DROP TYPE "payload"."enum_pages_blocks_feature_rows_rows_link_type";
  DROP TYPE "payload"."enum_pages_blocks_testimonials_video_grid_action_type";
  DROP TYPE "payload"."enum_pages_status";
  DROP TYPE "payload"."enum__pages_v_blocks_hero_primary_action_type";
  DROP TYPE "payload"."enum__pages_v_blocks_stats_theme";
  DROP TYPE "payload"."enum__pages_v_blocks_logo_strip_theme";
  DROP TYPE "payload"."enum__pages_v_blocks_feature_split_cards_link_type";
  DROP TYPE "payload"."enum__pages_v_blocks_feature_split_action_type";
  DROP TYPE "payload"."enum__pages_v_blocks_services_list_services_link_type";
  DROP TYPE "payload"."enum__pages_v_blocks_services_list_action_type";
  DROP TYPE "payload"."enum__pages_v_blocks_feature_rows_rows_link_type";
  DROP TYPE "payload"."enum__pages_v_blocks_testimonials_video_grid_action_type";
  DROP TYPE "payload"."enum__pages_v_version_status";
  DROP TYPE "payload"."enum_site_settings_socials_platform";
  DROP TYPE "payload"."enum_main_menu_items_type";
  DROP TYPE "payload"."enum_footer_menus_columns_links_type";`)
}
