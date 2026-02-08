import razorpay
from ..core.config import settings

client = razorpay.Client(auth=(settings.razorpay_key_id, settings.razorpay_key_secret))

def create_razorpay_order(amount_in_inr: int, user_id: str):
    """
    Creates a Razorpay order. Amount should be in paise (e.g., 500 for Rs. 5).
    """
    receipt_id = str(user_id)[:8] if user_id else "default"
    data = {
        "amount": amount_in_inr * 100,  # Convert to paise
        "currency": "INR",
        "receipt": f"receipt_{receipt_id}",
        "notes": {
            "user_id": str(user_id)
        }
    }
    order = client.order.create(data=data)
    return order

def verify_razorpay_signature(razorpay_order_id: str, razorpay_payment_id: str, razorpay_signature: str):
    """
    Verifies the payment signature from Razorpay.
    """
    params_dict = {
        'razorpay_order_id': razorpay_order_id,
        'razorpay_payment_id': razorpay_payment_id,
        'razorpay_signature': razorpay_signature
    }
    try:
        client.utility.verify_payment_signature(params_dict)
        return True
    except Exception:
        return False
