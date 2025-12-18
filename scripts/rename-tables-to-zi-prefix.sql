-- 重命名所有表添加 zi_ 前缀
-- 这个脚本将 users, articles 等表重命名为 zi_users, zi_articles 等

-- 1. 重命名表
ALTER TABLE IF EXISTS "users" RENAME TO "zi_users";
ALTER TABLE IF EXISTS "articles" RENAME TO "zi_articles";
ALTER TABLE IF EXISTS "publish_records" RENAME TO "zi_publish_records";
ALTER TABLE IF EXISTS "publish_presets" RENAME TO "zi_publish_presets";
ALTER TABLE IF EXISTS "redeem_codes" RENAME TO "zi_redeem_codes";
ALTER TABLE IF EXISTS "image_usage_stats" RENAME TO "zi_image_usage_stats";
ALTER TABLE IF EXISTS "video_contents" RENAME TO "zi_video_contents";

-- 2. 重命名外键约束（如果需要）
-- PostgreSQL 会自动更新外键约束中的表名引用

-- 3. 重命名索引和约束
ALTER INDEX IF EXISTS "users_email_unique" RENAME TO "zi_users_email_unique";
ALTER INDEX IF EXISTS "redeem_codes_code_unique" RENAME TO "zi_redeem_codes_code_unique";
