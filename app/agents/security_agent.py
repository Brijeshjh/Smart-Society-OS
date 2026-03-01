from crewai import Agent, Task, Crew, Process
from langchain_ollama import ChatOllama
from app.agents.tools import get_active_visitors, send_sms, send_email

# Initialize the Local Gemma Model via Ollama
gemma_llm = ChatOllama(model="gemma2", temperature=0.2)

security_agent = Agent(
    role="Virtual Security Guard (Head)",
    goal="Monitor active visitors in the society, detect anomalies like overstaying, and alert the physical security head.",
    backstory=(
        "You are the Virtual Guard of a Smart Society. You constantly review the visitor logs. "
        "A regular guest staying overnight isn't necessarily an anomaly, but a 'Delivery' person "
        "or 'Maid' staying for 14 hours is a severe security risk. You use the tools provided to find active visitors, "
        "evaluate their time inside, and send immediate SMS alerts to the physical head guard for any suspicious behavior."
    ),
    verbose=True,
    allow_delegation=False,
    llm=gemma_llm,
    tools=[get_active_visitors, send_sms, send_email]
)

def process_security_scan(guard_phone: str, guard_email: str) -> dict:
    """
    Workflow to scan the visitor logs for overstaying anomalies and send an alert if needed.
    """
    
    scan_task = Task(
        description=(
            f"1. Use the 'Get Active Visitors' tool to fetch all people currently inside the society.\n"
            f"2. Analyze the 'Hours Inside' based on their 'Type'. For example:\n"
            f"   - 'Delivery' typically should not exceed 1-2 hours.\n"
            f"   - 'Maid'/'Staff' usually work 8-10 hours.\n"
            f"   - 'Guest' can stay for days.\n"
            f"3. If you find NO anomalies, simply return 'Scan Complete: No anomalies detected.'\n"
            f"4. If you DO find an anomaly (e.g. Delivery inside for 14 hours), formulate a brief alert message.\n"
            f"5. If an anomaly is found, use 'Send SMS via Twilio' to send the alert to {guard_phone}.\n"
            f"6. Also use 'Send Email via SendGrid' to send a detailed report to {guard_email}."
        ),
        expected_output="A summary of the scan run, any anomalies found, and confirmation if alerts were sent.",
        agent=security_agent
    )

    security_crew = Crew(
        agents=[security_agent],
        tasks=[scan_task],
        process=Process.sequential
    )

    print(f"--- Starting Security Scan ---")
    result = security_crew.kickoff()
    
    return {
        "status": "Security Scan Complete",
        "agent_output": str(result)
    }
