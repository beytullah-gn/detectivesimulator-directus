-- Opens every published case to all players (the web has no purchase flow).
UPDATE scenarios
SET access_type = 'free', revenuecat_product_id = NULL
WHERE status = 'published' AND access_type = 'premium';
