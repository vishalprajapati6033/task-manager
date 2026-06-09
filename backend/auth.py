from functools import wraps
from flask import request, jsonify
import httpx
import os

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

def require_auth(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        auth_header = request.headers.get("Authorization")
        if not auth_header or not auth_header.startswith("Bearer "):
            return jsonify({"error": "Missing or invalid authorization token"}), 401
            
        token = auth_header.split(" ")[1]
        
        if not SUPABASE_URL or not SUPABASE_KEY:
            return jsonify({"error": "Backend auth not configured"}), 500
            
        try:
            headers = {
                "apikey": SUPABASE_KEY,
                "Authorization": f"Bearer {token}"
            }
            # Verify the token by calling Supabase auth endpoint
            url = f"{SUPABASE_URL}/auth/v1/user"
            
            with httpx.Client() as client:
                response = client.get(url, headers=headers)
                
            if response.status_code != 200:
                return jsonify({"error": "Invalid or expired token"}), 401
                
            user_data = response.json()
            # Inject user information into request context
            request.user = user_data
        except Exception as e:
            return jsonify({"error": f"Token verification failed: {str(e)}"}), 401
            
        return f(*args, **kwargs)
    return decorated
