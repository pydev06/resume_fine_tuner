-- Helper function for incrementing cache access count
CREATE OR REPLACE FUNCTION increment_cache_access(key VARCHAR)
RETURNS VOID AS $$
BEGIN
    UPDATE ai_response_cache
    SET 
        accessed_at = NOW(),
        access_count = access_count + 1
    WHERE cache_key = key;
END;
$$ LANGUAGE plpgsql;
