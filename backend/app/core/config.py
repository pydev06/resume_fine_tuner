from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    openai_api_key: str
    supabase_url: str
    supabase_key: str
    supabase_service_key: str
    stripe_secret_key: str = ""
    stripe_webhook_secret: str = ""
    razorpay_key_id: str = ""
    razorpay_key_secret: str = ""
    lemonsqueezy_api_key: str = ""
    lemonsqueezy_webhook_secret: str = ""
    frontend_url: str = "http://localhost:5173"

    model_config = SettingsConfigDict(env_file=".env")

settings = Settings()
