import requests
from ..core.config import settings

def create_ls_checkout(store_id: str, variant_id: str, user_id: str):
    """
    Creates a Lemon Squeezy checkout link.
    """
    url = "https://api.lemonsqueezy.com/v1/checkouts"
    headers = {
        "Accept": "application/vnd.api+json",
        "Content-Type": "application/vnd.api+json",
        "Authorization": f"Bearer {settings.lemonsqueezy_api_key}"
    }
    
    payload = {
        "data": {
            "type": "checkouts",
            "attributes": {
                "checkout_data": {
                    "custom": {
                        "user_id": user_id
                    }
                }
            },
            "relationships": {
                "store": {
                    "data": {
                        "type": "stores",
                        "id": store_id
                    }
                },
                "variant": {
                    "data": {
                        "type": "variants",
                        "id": variant_id
                    }
                }
            }
        }
    }
    
    response = requests.post(url, headers=headers, json=payload)
    if response.status_code == 201:
        return response.json()['data']['attributes']['url']
    else:
        print(f"Lemon Squeezy error: {response.text}")
        return None
