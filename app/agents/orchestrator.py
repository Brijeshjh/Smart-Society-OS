import os
os.environ["OPENAI_API_KEY"] = "NA"

from crewai import Agent, Task, Crew, Process
from langchain_ollama import ChatOllama
from app.agents.tools import insert_complaint, get_on_call_technician, send_sms, send_email

# 1. Initialize the Local Gemma Model via Ollama
# By default, this connects to http://localhost:11434
gemma_llm = ChatOllama(model="gemma2", temperature=0.3)

# 2. Define the Helpdesk Agent (The Triage Expert)
helpdesk_agent = Agent(
    role="Helpdesk Triage Manager",
    goal="Analyze resident complaints, determine severity, categorize the issue, and log it into the database.",
    backstory=(
        "You are the frontline support for a Smart Society. You read complaints, "
        "categorize them (e.g., Plumbing, Electrical), rate their severity "
        "(Low, Medium, EMERGENCY), and log them securely."
    ),
    verbose=True,
    allow_delegation=False,
    llm=gemma_llm,
    tools=[insert_complaint]    # Note: In a full production setup, we would wrap the Python functions 
    # from tools.py into formal CrewAI @tool decorators here.
)

# 3. Define the Communication Agent (The Dispatcher)
communication_agent = Agent(
    role="Emergency Dispatch Liaison",
    goal="Find the active on-call technician for emergencies, send them an SMS, and email the RWA Admin.",
    backstory=(
        "You manage vendor relationships. When an emergency is logged, you immediately "
        "look up the correct on-call technician (e.g., Plumber), physically send them an SMS detailing "
        "the issue, and also send an email to the RWA Admin reporting the incident."
    ),
    verbose=True,
    allow_delegation=False,
    llm=gemma_llm,
    tools=[get_on_call_technician, send_sms, send_email]
)

def process_complaint_workflow(user_id: str, description: str) -> dict:
    """
    The main LangGraph/CrewAI workflow triggered by FastAPI.
    """
    
    # Task 1: Triage and Log the Complaint
    triage_task = Task(
        description=(
            f"A resident (ID: {user_id}) just submitted this complaint: '{description}'.\n"
            f"1. Determine the category (Plumbing, Electrical, etc.).\n"
            f"2. Determine if it is an EMERGENCY.\n"
            f"3. Return a structured JSON response with category and severity."
        ),
        expected_output="A JSON object containing 'category' and 'severity'.",
        agent=helpdesk_agent
    )

    # Task 2: Dispatch (Only if deemed necessary by the flow)
    dispatch_task = Task(
        description=(
            f"Based on the triage results, if the severity is EMERGENCY, perform the following steps:\n"
            f"1. Identify the correct service category and look up the on-call technician.\n"
            f"2. Use the 'Send SMS via Twilio' tool to send an SMS alert to the technician's phone number.\n"
            f"3. Use the 'Send Email via SendGrid' tool to send an email to the RWA Admin (rwa_admin@smartsociety.com) detailing the emergency and which technician was contacted.\n"
            f"If it's not an EMERGENCY, just return 'No dispatch needed'."
        ),
        expected_output="A dispatch summary detailing who was contacted via SMS and Email.",
        agent=communication_agent
    )

    # 4. Assemble the Crew
    society_crew = Crew(
        agents=[helpdesk_agent, communication_agent],
        tasks=[triage_task, dispatch_task],
        process=Process.sequential # Runs Task 1, then passes context to Task 2
    )

    # 5. Execute the Workflow
    # This wakes up Gemma on your local machine and starts the reasoning loop.
    print(f"--- Starting Orchestrator for User {user_id} ---")
    result = society_crew.kickoff()
    
    return {
        "status": "Workflow Complete",
        "agent_output": str(result)
    }