import asyncio
import sys
import os

# Add backend to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.services.ai_service import generate_finding_details

async def main():
    try:
        print("Calling Ollama...")
        res = await generate_finding_details("SQLi")
        print("Success:", res)
    except Exception as e:
        import traceback
        traceback.print_exc()
        print("Error:", str(e))

if __name__ == "__main__":
    asyncio.run(main())
