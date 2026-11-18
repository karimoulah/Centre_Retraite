import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "payload"."enum_main_menu_items_children_type" AS ENUM('page', 'url');
  CREATE TABLE "payload"."main_menu_items_children" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"label" varchar NOT NULL,
  	"type" "payload"."enum_main_menu_items_children_type" DEFAULT 'page',
  	"page_id" integer,
  	"url" varchar
  );
  
  ALTER TABLE "payload"."pages_blocks_hero" ADD COLUMN "anchor" varchar;
  ALTER TABLE "payload"."pages_blocks_stats" ADD COLUMN "anchor" varchar;
  ALTER TABLE "payload"."pages_blocks_logo_strip" ADD COLUMN "anchor" varchar;
  ALTER TABLE "payload"."pages_blocks_about_split" ADD COLUMN "anchor" varchar;
  ALTER TABLE "payload"."pages_blocks_upcoming_activities" ADD COLUMN "anchor" varchar;
  ALTER TABLE "payload"."pages_blocks_feature_split" ADD COLUMN "anchor" varchar;
  ALTER TABLE "payload"."pages_blocks_services_list" ADD COLUMN "anchor" varchar;
  ALTER TABLE "payload"."pages_blocks_feature_rows" ADD COLUMN "anchor" varchar;
  ALTER TABLE "payload"."pages_blocks_testimonials_video_grid" ADD COLUMN "anchor" varchar;
  ALTER TABLE "payload"."pages_blocks_testimonial_carousel" ADD COLUMN "anchor" varchar;
  ALTER TABLE "payload"."pages_blocks_contact_cards" ADD COLUMN "anchor" varchar;
  ALTER TABLE "payload"."pages_blocks_content" ADD COLUMN "anchor" varchar;
  ALTER TABLE "payload"."_pages_v_blocks_hero" ADD COLUMN "anchor" varchar;
  ALTER TABLE "payload"."_pages_v_blocks_stats" ADD COLUMN "anchor" varchar;
  ALTER TABLE "payload"."_pages_v_blocks_logo_strip" ADD COLUMN "anchor" varchar;
  ALTER TABLE "payload"."_pages_v_blocks_about_split" ADD COLUMN "anchor" varchar;
  ALTER TABLE "payload"."_pages_v_blocks_upcoming_activities" ADD COLUMN "anchor" varchar;
  ALTER TABLE "payload"."_pages_v_blocks_feature_split" ADD COLUMN "anchor" varchar;
  ALTER TABLE "payload"."_pages_v_blocks_services_list" ADD COLUMN "anchor" varchar;
  ALTER TABLE "payload"."_pages_v_blocks_feature_rows" ADD COLUMN "anchor" varchar;
  ALTER TABLE "payload"."_pages_v_blocks_testimonials_video_grid" ADD COLUMN "anchor" varchar;
  ALTER TABLE "payload"."_pages_v_blocks_testimonial_carousel" ADD COLUMN "anchor" varchar;
  ALTER TABLE "payload"."_pages_v_blocks_contact_cards" ADD COLUMN "anchor" varchar;
  ALTER TABLE "payload"."_pages_v_blocks_content" ADD COLUMN "anchor" varchar;
  ALTER TABLE "payload"."main_menu_items_children" ADD CONSTRAINT "main_menu_items_children_page_id_pages_id_fk" FOREIGN KEY ("page_id") REFERENCES "payload"."pages"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."main_menu_items_children" ADD CONSTRAINT "main_menu_items_children_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."main_menu_items"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "main_menu_items_children_order_idx" ON "payload"."main_menu_items_children" USING btree ("_order");
  CREATE INDEX "main_menu_items_children_parent_id_idx" ON "payload"."main_menu_items_children" USING btree ("_parent_id");
  CREATE INDEX "main_menu_items_children_page_idx" ON "payload"."main_menu_items_children" USING btree ("page_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "payload"."main_menu_items_children" CASCADE;
  ALTER TABLE "payload"."pages_blocks_hero" DROP COLUMN "anchor";
  ALTER TABLE "payload"."pages_blocks_stats" DROP COLUMN "anchor";
  ALTER TABLE "payload"."pages_blocks_logo_strip" DROP COLUMN "anchor";
  ALTER TABLE "payload"."pages_blocks_about_split" DROP COLUMN "anchor";
  ALTER TABLE "payload"."pages_blocks_upcoming_activities" DROP COLUMN "anchor";
  ALTER TABLE "payload"."pages_blocks_feature_split" DROP COLUMN "anchor";
  ALTER TABLE "payload"."pages_blocks_services_list" DROP COLUMN "anchor";
  ALTER TABLE "payload"."pages_blocks_feature_rows" DROP COLUMN "anchor";
  ALTER TABLE "payload"."pages_blocks_testimonials_video_grid" DROP COLUMN "anchor";
  ALTER TABLE "payload"."pages_blocks_testimonial_carousel" DROP COLUMN "anchor";
  ALTER TABLE "payload"."pages_blocks_contact_cards" DROP COLUMN "anchor";
  ALTER TABLE "payload"."pages_blocks_content" DROP COLUMN "anchor";
  ALTER TABLE "payload"."_pages_v_blocks_hero" DROP COLUMN "anchor";
  ALTER TABLE "payload"."_pages_v_blocks_stats" DROP COLUMN "anchor";
  ALTER TABLE "payload"."_pages_v_blocks_logo_strip" DROP COLUMN "anchor";
  ALTER TABLE "payload"."_pages_v_blocks_about_split" DROP COLUMN "anchor";
  ALTER TABLE "payload"."_pages_v_blocks_upcoming_activities" DROP COLUMN "anchor";
  ALTER TABLE "payload"."_pages_v_blocks_feature_split" DROP COLUMN "anchor";
  ALTER TABLE "payload"."_pages_v_blocks_services_list" DROP COLUMN "anchor";
  ALTER TABLE "payload"."_pages_v_blocks_feature_rows" DROP COLUMN "anchor";
  ALTER TABLE "payload"."_pages_v_blocks_testimonials_video_grid" DROP COLUMN "anchor";
  ALTER TABLE "payload"."_pages_v_blocks_testimonial_carousel" DROP COLUMN "anchor";
  ALTER TABLE "payload"."_pages_v_blocks_contact_cards" DROP COLUMN "anchor";
  ALTER TABLE "payload"."_pages_v_blocks_content" DROP COLUMN "anchor";
  DROP TYPE "payload"."enum_main_menu_items_children_type";`)
}
