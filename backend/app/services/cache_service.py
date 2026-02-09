"""
AI Response Cache Service
Caches AI responses to reduce API costs and improve performance.
"""

import hashlib
import json
from datetime import datetime, timedelta
from typing import Optional, Dict, Any
from ..services.supabase_service import supabase

class AICache:
    """Service for caching AI responses"""
    
    # Cache TTL in hours by type
    TTL_CONFIG = {
        'domain_detection': 168,  # 7 days
        'interview_start': 24,     # 24 hours
        'common_pattern': 72       # 3 days
    }
    
    @staticmethod
    def generate_cache_key(prompt: str, context: Dict[str, Any]) -> str:
        """
        Generate unique cache key from prompt and context.
        
        Args:
            prompt: The AI prompt
            context: Additional context (e.g., category, domain)
        
        Returns:
            SHA256 hash as cache key
        """
        # Sort context keys for consistent hashing
        context_str = json.dumps(context, sort_keys=True)
        data = f"{prompt}:{context_str}"
        return hashlib.sha256(data.encode()).hexdigest()
    
    @staticmethod
    def generate_prompt_hash(prompt: str) -> str:
        """Generate hash of just the prompt for indexing"""
        return hashlib.sha256(prompt.encode()).hexdigest()
    
    async def get(self, cache_key: str) -> Optional[Dict[str, Any]]:
        """
        Retrieve cached response if valid.
        
        Args:
            cache_key: The cache key
        
        Returns:
            Cached response data or None if not found/expired
        """
        try:
            result = supabase.table('ai_response_cache')\
                .select('*')\
                .eq('cache_key', cache_key)\
                .gt('expires_at', datetime.now().isoformat())\
                .execute()
            
            if result.data and len(result.data) > 0:
                # Update access stats
                self._update_access_stats(cache_key)
                return result.data[0]['response_data']
            
            return None
        except Exception as e:
            print(f"Error retrieving from cache: {e}")
            return None
    
    async def set(
        self, 
        cache_key: str, 
        prompt: str,
        response: Dict[str, Any], 
        cache_type: str = 'common_pattern',
        model: str = 'gpt-4',
        tokens_used: int = 0
    ) -> bool:
        """
        Store AI response in cache.
        
        Args:
            cache_key: The cache key
            prompt: The original prompt
            response: The AI response to cache
            cache_type: Type of cache entry
            model: AI model used
            tokens_used: Number of tokens consumed
        
        Returns:
            True if successful, False otherwise
        """
        try:
            # Get TTL for this cache type
            ttl_hours = self.TTL_CONFIG.get(cache_type, 24)
            expires_at = datetime.now() + timedelta(hours=ttl_hours)
            
            prompt_hash = self.generate_prompt_hash(prompt)
            
            cache_entry = {
                'cache_key': cache_key,
                'prompt_hash': prompt_hash,
                'response_data': response,
                'model': model,
                'tokens_used': tokens_used,
                'cache_type': cache_type,
                'expires_at': expires_at.isoformat(),
                'created_at': datetime.now().isoformat(),
                'accessed_at': datetime.now().isoformat(),
                'access_count': 1
            }
            
            # Upsert to handle duplicate keys
            supabase.table('ai_response_cache').upsert(cache_entry).execute()
            return True
            
        except Exception as e:
            print(f"Error storing in cache: {e}")
            return False
    
    def _update_access_stats(self, cache_key: str):
        """Update access statistics for cache entry"""
        try:
            # Increment access count and update accessed_at
            supabase.rpc('increment_cache_access', {
                'key': cache_key
            }).execute()
        except Exception:
            # Fallback if RPC doesn't exist
            try:
                supabase.table('ai_response_cache')\
                    .update({
                        'accessed_at': datetime.now().isoformat(),
                        'access_count': supabase.table('ai_response_cache')
                            .select('access_count')
                            .eq('cache_key', cache_key)
                            .execute().data[0]['access_count'] + 1
                    })\
                    .eq('cache_key', cache_key)\
                    .execute()
            except Exception as e:
                print(f"Error updating access stats: {e}")
    
    async def cleanup_expired(self) -> int:
        """
        Clean up expired cache entries.
        
        Returns:
            Number of entries deleted
        """
        try:
            result = supabase.table('ai_response_cache')\
                .delete()\
                .lt('expires_at', datetime.now().isoformat())\
                .execute()
            
            return len(result.data) if result.data else 0
        except Exception as e:
            print(f"Error cleaning up cache: {e}")
            return 0
    
    async def get_stats(self) -> Dict[str, Any]:
        """
        Get cache statistics.
        
        Returns:
            Dictionary with cache stats
        """
        try:
            # Total entries
            total = supabase.table('ai_response_cache').select('id', count='exact').execute()
            
            # Entries by type
            by_type = supabase.table('ai_response_cache')\
                .select('cache_type')\
                .execute()
            
            type_counts = {}
            for entry in by_type.data:
                cache_type = entry['cache_type']
                type_counts[cache_type] = type_counts.get(cache_type, 0) + 1
            
            # Total tokens saved (sum of tokens_used)
            tokens_result = supabase.table('ai_response_cache')\
                .select('tokens_used')\
                .execute()
            
            total_tokens = sum(entry.get('tokens_used', 0) for entry in tokens_result.data)
            
            return {
                'total_entries': total.count,
                'by_type': type_counts,
                'total_tokens_saved': total_tokens,
                'estimated_cost_saved': total_tokens * 0.000002  # Rough estimate
            }
        except Exception as e:
            print(f"Error getting cache stats: {e}")
            return {}

# Global cache instance
ai_cache = AICache()
