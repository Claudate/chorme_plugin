CREATE TABLE "zi_articles" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"title" text NOT NULL,
	"content" text NOT NULL,
	"style" varchar(20) DEFAULT 'default' NOT NULL,
	"status" varchar(20) DEFAULT 'draft' NOT NULL,
	"word_count" integer DEFAULT 0,
	"reading_time" integer DEFAULT 0,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "zi_image_usage_stats" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"month" varchar(7) NOT NULL,
	"used_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "zi_publish_presets" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"name" varchar(255) NOT NULL,
	"platform" varchar(50) DEFAULT 'wechat' NOT NULL,
	"is_default" boolean DEFAULT false,
	"author_name" varchar(255),
	"auto_generate_digest" boolean DEFAULT true,
	"header_content" text,
	"footer_content" text,
	"platform_config" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "zi_publish_records" (
	"id" text PRIMARY KEY NOT NULL,
	"article_id" text NOT NULL,
	"user_id" text NOT NULL,
	"platform" varchar(50) NOT NULL,
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"platform_article_id" text,
	"platform_url" text,
	"published_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "zi_redeem_codes" (
	"id" text PRIMARY KEY NOT NULL,
	"code" varchar(50) NOT NULL,
	"type" varchar(20) NOT NULL,
	"duration" integer NOT NULL,
	"is_used" boolean DEFAULT false NOT NULL,
	"used_by" text,
	"used_at" timestamp with time zone,
	"created_by" varchar(255),
	"note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "zi_redeem_codes_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "zi_users" (
	"id" text PRIMARY KEY NOT NULL,
	"email" varchar(255) NOT NULL,
	"name" varchar(255),
	"password_hash" text,
	"avatar" text,
	"plan" varchar(20) DEFAULT 'free' NOT NULL,
	"plan_expired_at" timestamp with time zone,
	"use_custom_r2" boolean DEFAULT false,
	"custom_r2_account_id" text,
	"custom_r2_access_key_id" text,
	"custom_r2_secret_access_key" text,
	"custom_r2_bucket_name" text,
	"custom_r2_public_url" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "zi_users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "zi_video_contents" (
	"id" text PRIMARY KEY NOT NULL,
	"article_id" text NOT NULL,
	"user_id" text NOT NULL,
	"platform" varchar(50) NOT NULL,
	"short_title" varchar(100),
	"key_points" text,
	"tags" text,
	"hashtags" text,
	"speech_script" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "zi_articles" ADD CONSTRAINT "zi_articles_user_id_zi_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."zi_users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "zi_image_usage_stats" ADD CONSTRAINT "zi_image_usage_stats_user_id_zi_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."zi_users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "zi_publish_presets" ADD CONSTRAINT "zi_publish_presets_user_id_zi_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."zi_users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "zi_publish_records" ADD CONSTRAINT "zi_publish_records_article_id_zi_articles_id_fk" FOREIGN KEY ("article_id") REFERENCES "public"."zi_articles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "zi_publish_records" ADD CONSTRAINT "zi_publish_records_user_id_zi_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."zi_users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "zi_redeem_codes" ADD CONSTRAINT "zi_redeem_codes_used_by_zi_users_id_fk" FOREIGN KEY ("used_by") REFERENCES "public"."zi_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "zi_video_contents" ADD CONSTRAINT "zi_video_contents_article_id_zi_articles_id_fk" FOREIGN KEY ("article_id") REFERENCES "public"."zi_articles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "zi_video_contents" ADD CONSTRAINT "zi_video_contents_user_id_zi_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."zi_users"("id") ON DELETE cascade ON UPDATE no action;