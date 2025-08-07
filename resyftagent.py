import os
from pydantic_ai import Agent
from pydantic_ai.models.openai import OpenAIModel
import asyncio
from dotenv import load_dotenv
from pydantic_ai.tools import RunContext
load_dotenv()

model = OpenAIModel(
    model_name="google/gemini-2.5-flash",
    api_key=os.getenv("OPEN_ROUTER_API_KEY"),
    base_url="https://openrouter.ai/api/v1",
)



agent = Agent(
    model=model,
    system_prompt="You are a helpful assistant that can answer questions and help with tasks.",
)

@agent.tool_plain
def context_aware_processor(
    ctx: RunContext[None],
    messages: list[ModelMessage],
) -> list[ModelMessage]:
    # Access current usage
    current_tokens = ctx.usage.total_tokens
    return current_tokens

async def main():
    message_hist = None
    while True:
        user_input = input("You: ")
        if user_input.lower() in ["quit", "exit", "bye"]:
            print("Goodbye!")
            break
        result = await agent.run(
            user_input,
            message_history=message_hist,
        )
        message_hist = result.all_messages()
        print(f"Assistant: {result.data}")

if __name__ == "__main__":
    asyncio.run(main())