# backend_py/app/services/ai_service.py
import openai, os
openai.api_key = os.getenv("OPENAI_API_KEY")

async def ask_openai(prompt):
    resp = openai.ChatCompletion.create(model="gpt-4o-mini", messages=[{"role":"user","content":prompt}])
    return resp.choices[0].message.content
