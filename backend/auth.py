from functools import wraps
from flask import request, jsonify
import httpx
import os

def require_auth(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        supabase_url = os.getenv("SUPABASE_URL")
        supabase_key = os.getenv("SUPABASE_KEY")
        
        auth_header = request.headers.get("Authorization")
        if not auth_header or not auth_header.startswith("Bearer "):
            return jsonify({"error": "Missing or invalid authorization token"}), 401
            
        token = auth_header.split(" ")[1]
        
        if not supabase_url or not supabase_key:
            return jsonify({"error": "Backend auth not configured"}), 500
            
        try:
            headers = {
                "apikey": supabase_key,
                "Authorization": f"Bearer {token}"
            }
            # Verify the token by calling Supabase auth endpoint
            url = f"{supabase_url}/auth/v1/user"
            
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
