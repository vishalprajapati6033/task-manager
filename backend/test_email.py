import email_service
import os
from dotenv import load_dotenv

load_dotenv()

print("Testing email notification...")
print("SMTP Sender User:", os.getenv("GMAIL_USER"))

# Send a test email to the configured user themselves
success = email_service.send_email(
    to_email=os.getenv("GMAIL_USER"),
    subject="TaskFlow AI Test Email",
    body="If you see this, your Gmail SMTP integration is working perfectly!"
)

print("Result of email dispatch:", success)
if success:
    print("Success: Test email sent successfully!")
else:
    print("Failure: Test email could not be sent. Check backend log errors.")
