import os
from dotenv import load_dotenv
from supabase import create_client, Client
from crewai.tools import tool # <-- Import the CrewAI tool decorator
from twilio.rest import Client as TwilioClient
import sendgrid
from sendgrid.helpers.mail import Mail, Email, To, Content

load_dotenv()

url: str = os.environ.get("SUPABASE_URL")
key: str = os.environ.get("SUPABASE_KEY")
db: Client = create_client(url, key)

# The @tool decorator tells the AI: "This is a physical action you can perform."
@tool("Log New Complaint to Database")
def insert_complaint(user_id: str, category: str, description: str, status: str = "Pending_Technician") -> str:
    """
    Use this tool to physically save a new resident complaint into the Supabase database.
    Always pass the user_id, the categorized category (e.g., 'Plumbing', 'Electrical'), 
    and the original description.
    """
    try:
        response = db.table("complaints").insert({
            "resident_id": user_id,
            "category": category,
            "description": description,
            "status": status
        }).execute()
        return f"Success! Complaint logged with ID: {response.data[0]['ticket_id']}"
    except Exception as e:
        return f"Database Error: {str(e)}"

@tool("Lookup On-Call Technician")
def get_on_call_technician(category: str) -> str:
    """
    Use this tool when you need to find the phone number and name of the emergency 
    vendor for a specific category (e.g., 'Plumbing').
    """
    try:
        response = db.table("external_services").select("*").eq("service_category", category).eq("is_on_call", True).execute()
        if response.data:
            tech = response.data[0]
            return f"Found Technician: {tech['vendor_name']}, Contact: {tech['contact_person']}, Phone: {tech['phone_number']}"
        return f"No active technician found on call for {category}."
    except Exception as e:
        return f"Database Error: {str(e)}"

@tool("Send SMS via Twilio")
def send_sms(to_phone: str, message: str) -> str:
    """
    Use this tool to physically send an SMS to a phone number (e.g., the technician) via Twilio.
    Make sure to provide the phone number and the message you want to send.
    """
    try:
        account_sid = os.environ.get("TWILIO_ACCOUNT_SID")
        auth_token = os.environ.get("TWILIO_AUTH_TOKEN")
        from_phone = os.environ.get("TWILIO_FROM_PHONE")
        
        # If credentials are not set (e.g. placeholder), simulate or handle gracefully
        if account_sid == "your_twilio_account_sid" or not account_sid:
            return f"Simulated SMS to {to_phone}: {message} (Real credentials not configured)"
            
        client = TwilioClient(account_sid, auth_token)
        msg = client.messages.create(
            body=message,
            from_=from_phone,
            to=to_phone
        )
        return f"SMS sent successfully. SID: {msg.sid}"
    except Exception as e:
        return f"Twilio SMS Error: {str(e)}"

@tool("Send Email via SendGrid")
def send_email(to_email: str, subject: str, body: str) -> str:
    """
    Use this tool to physically send an email (e.g., to the RWA Admin) via SendGrid.
    Provide the destination email address, subject, and the body of the email.
    """
    try:
        api_key = os.environ.get('SENDGRID_API_KEY')
        
        # If credentials are not set, simulate
        if api_key == "your_sendgrid_api_key" or not api_key:
            return f"Simulated Email to {to_email} with subject '{subject}': {body} (Real credentials not configured)"
            
        sg = sendgrid.SendGridAPIClient(api_key=api_key)
        from_email = Email(os.environ.get("SENDGRID_FROM_EMAIL", "admin@smartsociety.com"))
        to_email_obj = To(to_email)
        content = Content("text/plain", body)
        mail = Mail(from_email, to_email_obj, subject, content)
        
        response = sg.client.mail.send.post(request_body=mail.get())
        return f"Email sent successfully to {to_email}. Status code: {response.status_code}"
    except Exception as e:
        return f"SendGrid Email Error: {str(e)}"

@tool("Pandas Query Tool")
def pandas_query_tool(file_path: str, action: str, query: str = "") -> str:
    """
    Allows you to autonomously read an Excel sheet and query it using Pandas.
    Provide the 'file_path' of the Excel file.
    'action' can be:
    - "SUMMARY": Returns column names, data types, and basic statistics.
    - "HEAD": Returns the first 50 rows of data.
    - "QUERY": Filters data using pandas df.query(query). Example query string: "Amount > 10000" or 'Category == "Maintenance"'.
    """
    import pandas as pd
    try:
        df = pd.read_excel(file_path)
        if action == "SUMMARY":
            info = f"Columns: {list(df.columns)}\n"
            info += f"Shape: {df.shape}\n"
            info += df.describe(include='all').to_string()
            return info
        elif action == "HEAD":
            return df.head(50).to_string()
        elif action == "QUERY":
            if not query:
                return "Error: query string must be provided for action='QUERY'."
            result = df.query(query)
            if result.empty:
                return "Query returned 0 rows."
            return result.to_string()
        else:
            return "Invalid action. Use SUMMARY, HEAD, or QUERY."
    except Exception as e:
        return f"Error executing on {file_path}: {e}"

@tool("Log Expense Anomaly to Database")
def insert_expense_anomaly(category: str, amount: float, description: str, date: str) -> str:
    """
    Use this tool to log a detected budget anomaly directly into the 'society_expenses' Supabase table.
    Provide the category, anomaly amount, description of why it's an anomaly, and the date of the expense.
    """
    try:
        # Check if amount is actually a float or int. If the LLM passes a string, try converting
        if isinstance(amount, str):
            amount = float(amount.replace(',', '').replace('$', ''))
        
        response = db.table("society_expenses").insert({
            "category": category,
            "amount": amount,
            "description": description,
            "expense_date": date,
            "is_anomaly": True
        }).execute()
        
        # If successfully logged, return a success string
        if isinstance(response.data, list) and len(response.data) > 0:
            return f"Success! Anomaly logged with ID: {response.data[0].get('id', 'Unknown')}"
        return "Success! Anomaly logged."
    except Exception as e:
        return f"Database Error: {str(e)}"

@tool("Get Active Visitors")
def get_active_visitors() -> str:
    """
    Use this tool to get a list of all visitors currently inside the society 
    (meaning their 'exit_time' is null). This returns their details and entry time.
    """
    try:
        from datetime import datetime
        import pytz
        
        response = db.table("visitor_logs").select("*").is_("exit_time", "null").execute()
        
        if not response.data:
            return "No active visitors found in the society."
            
        # Format the data nicely for the LLM to read
        result = "ACTIVE VISITORS:\n"
        # Current time in UTC (Supabase default)
        now_utc = datetime.now(pytz.utc)
        
        for visitor in response.data:
            entry_time = datetime.fromisoformat(visitor['entry_time'].replace('Z', '+00:00'))
            duration = now_utc - entry_time
            hours_inside = round(duration.total_seconds() / 3600, 2)
            
            result += f"- ID: {visitor.get('id')}\n"
            result += f"  Name: {visitor.get('visitor_name')}\n"
            result += f"  Type: {visitor.get('visitor_type')}\n"
            result += f"  Host Flat: {visitor.get('host_flat')}\n"
            result += f"  Entry Time: {visitor.get('entry_time')}\n"
            result += f"  Hours Inside: {hours_inside} hours\n"
            result += f"  Contact: {visitor.get('contact_number')}\n\n"
            
        return result
    except Exception as e:
        return f"Database Error: {str(e)}"