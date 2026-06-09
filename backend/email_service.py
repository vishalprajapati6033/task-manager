import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import os
from dotenv import load_dotenv

load_dotenv()

GMAIL_USER = os.getenv("GMAIL_USER")
GMAIL_PASSWORD = os.getenv("GMAIL_APP_PASSWORD")

def send_email(to_email, subject, body):
    if not GMAIL_USER or not GMAIL_PASSWORD:
        print("Warning: Gmail credentials not configured. Email not sent.")
        return False
        
    try:
        msg = MIMEMultipart()
        msg['From'] = GMAIL_USER
        msg['To'] = to_email
        msg['Subject'] = subject

        msg.attach(MIMEText(body, 'plain'))

        # Setup SMTP server
        server = smtplib.SMTP('smtp.gmail.com', 587)
        server.starttls()
        server.login(GMAIL_USER, GMAIL_PASSWORD)
        
        # Send email
        text = msg.as_string()
        server.sendmail(GMAIL_USER, to_email, text)
        server.quit()
        return True
    except Exception as e:
        print(f"Error sending email: {e}")
        return False

def send_task_created_email(to_email, task_title):
    subject = f"New Task Assigned: {task_title}"
    body = f"Hello,\n\nA new task '{task_title}' has been assigned to you.\n\nPlease log in to the Task Manager to view details.\n\nThanks!"
    return send_email(to_email, subject, body)

def send_task_completed_email(to_email, task_title):
    subject = f"Task Completed: {task_title}"
    body = f"Hello,\n\nThe task '{task_title}' has been marked as completed.\n\nThanks!"
    return send_email(to_email, subject, body)
