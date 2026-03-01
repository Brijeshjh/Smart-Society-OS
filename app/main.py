from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from app.models.schemas import ComplaintRequest, ComplaintResponse
from app.agents.orchestrator import process_complaint_workflow 
from app.agents.finance_agent import process_finance_workflow
from app.agents.security_agent import process_security_scan
import os
import shutil

app = FastAPI(title="Smart Society OS Backend", version="1.0")

# Enable CORS for the React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/api/helpdesk/ticket", response_model=ComplaintResponse)
def create_new_complaint(payload: ComplaintRequest):
    try:
        # 1. Trigger the Local Gemma AI Workflow
        workflow_result = process_complaint_workflow(
            user_id=payload.user_id, 
            description=payload.description
        )
        
        return ComplaintResponse(
            status="success",
            message=workflow_result["agent_output"],
            severity="Processed by Local AI"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/finance/upload")
def upload_finance_document(file: UploadFile = File(...)):
    if not file.filename.endswith('.xlsx'):
        raise HTTPException(status_code=400, detail="Only .xlsx files are supported.")
    
    # Save the file temporarily
    temp_dir = "temp_uploads"
    os.makedirs(temp_dir, exist_ok=True)
    temp_path = os.path.join(temp_dir, file.filename)
    
    try:
        with open(temp_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        # Trigger the Finance Agent Workflow
        workflow_result = process_finance_workflow(temp_path)
        
        return {
            "status": "success",
            "message": "File processed successfully.",
            "report": workflow_result["agent_output"]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        # Optionally clean up the file
        if os.path.exists(temp_path):
            os.remove(temp_path)

@app.post("/api/security/sweep")
def run_security_scan():
    """
    Triggers the Virtual Guard to check for visitor anomalies.
    In a real app, this might be triggered by a CRON job every hour.
    """
    try:
        guard_phone = os.environ.get("HEAD_GUARD_PHONE", "+1234567890")
        guard_email = os.environ.get("HEAD_GUARD_EMAIL", "guard@smartsociety.com")
        
        workflow_result = process_security_scan(guard_phone, guard_email)
        
        return {
            "status": "success",
            "message": "Security scan executed successfully.",
            "report": workflow_result["agent_output"]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))