import os
from flask import Flask, request, jsonify
from flask_cors import CORS

from supabase import create_client
from dotenv import load_dotenv
import email_service
from auth import require_auth

load_dotenv()

app = Flask(__name__)
CORS(app)

# Supabase Setup
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

if SUPABASE_URL and SUPABASE_KEY:
    supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
else:
    supabase = None
    print("Warning: Supabase credentials not found. DB operations will fail.")

@app.route("/", methods=["GET"])
def health_check():
    return jsonify({"status": "healthy", "message": "Task Manager API is running"})

# Tasks Endpoints

@app.route("/api/tasks", methods=["GET"])
@require_auth
def get_tasks():
    if not supabase:
        return jsonify({"error": "Supabase not configured"}), 500
    try:
        # Example: Fetch all tasks
        # In a real app, you would filter by the logged-in user or assigned user
        response = supabase.table("tasks").select("*").execute()
        return jsonify({"data": response.data}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/tasks", methods=["POST"])
@require_auth
def create_task():
    if not supabase:
        return jsonify({"error": "Supabase not configured"}), 500
    try:
        data = request.json
        assigned_email = data.get("assigned_email")
        assigned_to_id = None
        
        if assigned_email:
            profile_res = supabase.table("profiles").select("id").eq("email", assigned_email).execute()
            if profile_res.data:
                assigned_to_id = profile_res.data[0]["id"]
                
        new_task = {
            "title": data.get("title"),
            "description": data.get("description", ""),
            "status": "pending",
            "assigned_to": assigned_to_id,
            "assigned_email": assigned_email,
            "created_by": data.get("created_by")
        }
        response = supabase.table("tasks").insert(new_task).execute()
        
        # Trigger email notification to the assigned user (if we have their email)
        # In a real app, you would fetch the user's email from the DB first.
        # For demonstration, we'll send a placeholder email.
        assigned_email = data.get("assigned_email")
        if assigned_email:
            print(f"SMTP: Attempting to send task creation email to {assigned_email}...")
            sent = email_service.send_task_created_email(assigned_email, new_task["title"])
            print(f"SMTP: Email dispatch status: {sent}")
        
        return jsonify({"data": response.data}), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/tasks/<task_id>", methods=["PUT"])
@require_auth
def update_task(task_id):
    if not supabase:
        return jsonify({"error": "Supabase not configured"}), 500
    try:
        data = request.json
        # E.g., updating status to 'completed'
        update_data = {}
        if "status" in data:
            update_data["status"] = data["status"]
            
        response = supabase.table("tasks").update(update_data).eq("id", task_id).execute()
        
        # Trigger email notification if completed
        if update_data.get("status") == "completed":
            # You would fetch the creator's email here
            creator_email = data.get("creator_email")
            task_title = data.get("title", f"Task #{task_id}")
            if creator_email:
                print(f"SMTP: Attempting to send task completion email to {creator_email}...")
                sent = email_service.send_task_completed_email(creator_email, task_title)
                print(f"SMTP: Email dispatch status: {sent}")
        
        return jsonify({"data": response.data}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    app.run(debug=True, port=5000)
