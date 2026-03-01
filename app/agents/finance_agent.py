from crewai import Agent, Task, Crew, Process
from langchain_ollama import ChatOllama
from app.agents.tools import pandas_query_tool, insert_expense_anomaly

# Initialize the Local Gemma Model via Ollama
gemma_llm = ChatOllama(model="gemma2", temperature=0.1)

finance_agent = Agent(
    role="Digital Treasurer and Finance Analyst",
    goal="Analyze society expense reports, detect budget anomalies, and log them into the database.",
    backstory=(
        "You are the eagle-eyed Digital Treasurer of a Smart Society. "
        "You are presented with raw financial data (usually Excel files). Your job is to "
        "autonomously read the data using the Pandas Query Tool, parse it for overspending, duplicate "
        "payments, or highly abnormal expenses, and securely log any anomalies."
    ),
    verbose=True,
    allow_delegation=False,
    llm=gemma_llm,
    tools=[pandas_query_tool, insert_expense_anomaly]
)

def process_finance_workflow(file_path: str) -> dict:
    """
    Workflow to analyze an Excel file for budget anomalies.
    """
    
    analysis_task = Task(
        description=(
            f"An expense report has been uploaded to the server at: {file_path}.\n"
            f"1. Use the 'Pandas Query Tool' to read a SUMMARY and HEAD of the file.\n"
            f"2. Formulate follow-up queries using 'Pandas Query Tool' action 'QUERY' if needed to find out-of-bounds expenses (e.g. unusually large amounts, duplicates).\n"
            f"3. For each detected anomaly, use the 'Log Expense Anomaly to Database' tool to record it into the 'society_expenses' table.\n"
            f"4. Provide a final summary of the anomalies found and logged."
        ),
        expected_output="A summary report detailing the anomalies found and successfully logged into the database.",
        agent=finance_agent
    )

    finance_crew = Crew(
        agents=[finance_agent],
        tasks=[analysis_task],
        process=Process.sequential
    )

    print(f"--- Starting Finance Orchestrator for file {file_path} ---")
    result = finance_crew.kickoff()
    
    return {
        "status": "Workflow Complete",
        "agent_output": str(result)
    }
