import stripe
from fastapi import APIRouter, Depends, HTTPException, Request, Header
from ..core.config import settings
from ..dependencies import get_current_user
from ..services.supabase_service import add_user_credits, get_user_credits
from ..services.razorpay_service import create_razorpay_order, verify_razorpay_signature
from ..services.lemonsqueezy_service import create_ls_checkout

router = APIRouter()
stripe.api_key = settings.stripe_secret_key

@router.get("/credits")
async def get_credits(current_user = Depends(get_current_user)):
    try:
        credits = get_user_credits(current_user['id'])
        return {"credits": credits}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/create-checkout")
async def create_checkout(
    plan: str,
    provider: str = "stripe", # stripe, razorpay, lemonsqueezy
    current_user = Depends(get_current_user)
):
    try:
        # Define price mapping
        prices = {
            "starter": {"usd": 500, "inr": 499, "credits": 10, "name": "Starter Pack (10 Interviews)"},
            "pro": {"usd": 1500, "inr": 1299, "credits": 50, "name": "Pro Pack (50 Interviews)"}
        }
        
        if plan not in prices:
            raise HTTPException(status_code=400, detail="Invalid plan selected")
            
        if provider == "stripe":
            checkout_session = stripe.checkout.Session.create(
                payment_method_types=['card'],
                line_items=[{
                    'price_data': {
                        'currency': 'usd',
                        'product_data': {'name': prices[plan]["name"]},
                        'unit_amount': prices[plan]["usd"],
                    },
                    'quantity': 1,
                }],
                mode='payment',
                success_url=f"{settings.frontend_url}/dashboard?status=success",
                cancel_url=f"{settings.frontend_url}/pricing",
                metadata={
                    "user_id": current_user['id'],
                    "credits": prices[plan]["credits"]
                }
            )
            return {"url": checkout_session.url}
            
        elif provider == "razorpay":
            order = create_razorpay_order(prices[plan]["inr"], current_user['id'])
            return {
                "order_id": order["id"],
                "amount": order["amount"],
                "currency": order["currency"],
                "credits": prices[plan]["credits"]
            }
            
        elif provider == "lemonsqueezy":
            # Store ID and Variant ID would ideally be in config or passed from frontend
            # For now using placeholders that user should fill
            url = create_ls_checkout("YOUR_STORE_ID", "YOUR_VARIANT_ID", current_user['id'])
            if not url:
                raise HTTPException(status_code=500, detail="Lemon Squeezy checkout creation failed")
            return {"url": url}
            
        else:
            raise HTTPException(status_code=400, detail="Unsupported provider")

    except Exception as e:
        print(f"Checkout error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/verify-razorpay")
async def verify_razorpay(data: dict, current_user = Depends(get_current_user)):
    """
    Client-side verification for Razorpay modal completion.
    """
    is_valid = verify_razorpay_signature(
        data.get("razorpay_order_id"),
        data.get("razorpay_payment_id"),
        data.get("razorpay_signature")
    )
    if is_valid:
        credits = int(data.get("credits", 0))
        add_user_credits(current_user['id'], credits)
        return {"status": "success"}
    else:
        raise HTTPException(status_code=400, detail="Invalid signature")

@router.post("/webhook/stripe")
async def stripe_webhook(request: Request, stripe_signature: str = Header(None)):
    payload = await request.body()
    try:
        event = stripe.Webhook.construct_event(
            payload, stripe_signature, settings.stripe_webhook_secret
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Webhook Error: {str(e)}")

    if event['type'] == 'checkout.session.completed':
        session = event['data']['object']
        user_id = session.get('metadata', {}).get('user_id')
        credits = int(session.get('metadata', {}).get('credits', 0))
        
        if user_id and credits > 0:
            add_user_credits(user_id, credits)
            print(f"Stripe: Added {credits} credits to user {user_id}")

    return {"status": "success"}

@router.post("/webhook/lemonsqueezy")
async def lemonsqueezy_webhook(request: Request):
    payload = await request.json()
    # LS doesn't have a Python SDK but we can verify signature manually if needed
    # For now simplicity, getting attributes
    event_name = payload.get('meta', {}).get('event_name')
    
    if event_name == 'order_created':
        attributes = payload.get('data', {}).get('attributes', {})
        user_id = payload.get('meta', {}).get('custom_data', {}).get('user_id')
        
        # Determine credits based on variant ID or product name
        # Simplified: assuming user bought 10 credits for now
        credits = 10 
        if user_id:
            add_user_credits(user_id, credits)
            print(f"LemonSqueezy: Added {credits} credits to user {user_id}")

    return {"status": "success"}

@router.post("/webhook/razorpay")
async def razorpay_webhook(request: Request):
    # Razorpay webhooks can also be used for backup verification
    payload = await request.json()
    event = payload.get('event')
    
    if event == 'order.paid':
        order_notes = payload['payload']['payment']['entity'].get('notes', {})
        user_id = order_notes.get('user_id')
        # Logic to determine credits from order
        # add_user_credits(user_id, credits)
        pass

    return {"status": "success"}
