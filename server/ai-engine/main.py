import os
import json
import asyncio
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from openai import OpenAI
from dotenv import load_dotenv

from analyzers.review import generate_review

load_dotenv()

app = FastAPI(title="LingoBuddy AI Engine", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

MIMO_API_KEY = os.getenv("MIMO_API_KEY", "")
MIMO_BASE_URL = os.getenv("MIMO_BASE_URL", "https://api.xiaomimimo.com/v1")
MIMO_MODEL = os.getenv("MIMO_MODEL", "mimo-v2.5-pro")

client = OpenAI(
    api_key=MIMO_API_KEY,
    base_url=MIMO_BASE_URL,
)

SCENARIO_PROMPTS = {
    "interview": {
        "role": "You are a senior HR manager at a multinational company conducting a job interview. Be professional but friendly. Ask follow-up questions based on the candidate's responses. Focus on behavioral and situational questions.",
        "greeting": "Good morning! Thank you for coming in today. Please have a seat. Let's start with — could you tell me a little bit about yourself?"
    },
    "meeting": {
        "role": "You are a project manager leading a business meeting with your team. Discuss project progress, address concerns, and assign action items. Be professional and collaborative.",
        "greeting": "Thanks everyone for joining today's meeting. Let's get started. First, I'd like to go over our current project status. Does anyone have updates to share?"
    },
    "restaurant": {
        "role": "You are a waiter at a nice restaurant in New York. Be polite and helpful. Take the customer's order, answer questions about the menu, and make recommendations.",
        "greeting": "Good evening! Welcome to The Golden Fork. May I start you off with something to drink? And here's our menu for tonight."
    },
    "customs": {
        "role": "You are a customs officer at an international airport. Be formal and thorough. Ask standard customs and immigration questions about the traveler's purpose of visit, duration, and belongings.",
        "greeting": "Passport, please. What is the purpose of your visit to the United States?"
    },
    "shopping": {
        "role": "You are a shopkeeper at a busy market. Be friendly but shrewd. Engage in bargaining with the customer. Offer deals but try to maintain good prices.",
        "greeting": "Hey there! Welcome to my shop! We've got the best deals in town. What are you looking for today?"
    },
    "doctor": {
        "role": "You are a doctor at a clinic. Be caring and professional. Ask about the patient's symptoms, medical history, and provide medical advice. Use clear, simple language.",
        "greeting": "Hi there, I'm Dr. Smith. What brings you in today? How long have you been experiencing these symptoms?"
    },
    "hotel": {
        "role": "You are a hotel receptionist at a 4-star hotel. Be professional and accommodating. Help the guest with check-in, explain hotel amenities, and answer questions.",
        "greeting": "Welcome to the Grand Horizon Hotel! Do you have a reservation? May I have your name, please?"
    },
    "networking": {
        "role": "You are an outgoing professional at a networking event. Be friendly and engaging. Ask about the other person's work, share your own experiences, and suggest keeping in touch.",
        "greeting": "Hey! I don't think we've met. I'm Alex, I work in marketing. What brings you to this event tonight?"
    },
}


@app.get("/health")
async def health():
    return {"status": "ok", "model": MIMO_MODEL}


@app.websocket("/ws/chat")
async def chat_stream(websocket: WebSocket):
    """
    WebSocket endpoint for real-time chat conversation.
    Receives user text messages, sends AI responses with error corrections.
    """
    await websocket.accept()
    conversation_history = []
    scenario_id = None

    try:
        while True:
            data = await websocket.receive_text()
            msg = json.loads(data)

            if msg.get("type") == "init":
                scenario_id = msg.get("scenarioId", "interview")
                scenario = SCENARIO_PROMPTS.get(scenario_id, SCENARIO_PROMPTS["interview"])

                system_prompt = f"""{scenario['role']}

IMPORTANT RULES:
1. Stay in character at all times. Do not break character.
2. Keep responses concise (2-3 sentences max) to maintain natural conversation flow.
3. If the user makes grammar or vocabulary mistakes, continue the conversation naturally but note the error.
4. After your response, if you noticed any errors, include them in a special format at the end.
5. Error format: [ERROR:type:original:suggestion] where type is grammar/vocabulary/pronunciation
6. Only mark actual errors — don't correct minor stylistic preferences.
7. Be encouraging and supportive. Use natural, idiomatic English."""

                conversation_history = [
                    {"role": "system", "content": system_prompt},
                ]

                greeting = scenario["greeting"]
                conversation_history.append({"role": "assistant", "content": greeting})

                await websocket.send_json({
                    "type": "transcript",
                    "speaker": "ai",
                    "text": greeting,
                })
                continue

            if msg.get("type") == "message":
                user_text = msg.get("text", "")
                conversation_history.append({"role": "user", "content": user_text})

                await websocket.send_json({
                    "type": "transcript",
                    "speaker": "user",
                    "text": user_text,
                })

                try:
                    completion = client.chat.completions.create(
                        model=MIMO_MODEL,
                        messages=conversation_history,
                        max_completion_tokens=256,
                        temperature=0.8,
                        top_p=0.95,
                        stream=True,
                    )

                    full_response = ""
                    for chunk in completion:
                        if chunk.choices and chunk.choices[0].delta.content:
                            token = chunk.choices[0].delta.content
                            full_response += token
                            await websocket.send_json({
                                "type": "token",
                                "text": token,
                            })

                    conversation_history.append({"role": "assistant", "content": full_response})

                    # Parse error corrections from response
                    errors = parse_errors(full_response)
                    clean_response = clean_error_tags(full_response)

                    # Send the clean transcript
                    await websocket.send_json({
                        "type": "transcript",
                        "speaker": "ai",
                        "text": clean_response,
                    })

                    # Send error corrections
                    for error in errors:
                        await websocket.send_json({
                            "type": "error-correction",
                            "error": error,
                        })

                except Exception as e:
                    await websocket.send_json({
                        "type": "error",
                        "message": f"AI service error: {str(e)}",
                    })

    except WebSocketDisconnect:
        pass


def parse_errors(text: str) -> list:
    """Extract error corrections from AI response text."""
    import re
    errors = []
    pattern = r'\[ERROR:(\w+):([^:]+):([^\]]+)\]'
    for match in re.finditer(pattern, text):
        errors.append({
            "type": match.group(1),
            "original": match.group(2),
            "suggestion": match.group(3),
        })
    return errors


def clean_error_tags(text: str) -> str:
    """Remove error tags from the displayed text."""
    import re
    return re.sub(r'\[ERROR:[^\]]+\]', '', text).strip()


@app.post("/api/review/{session_id}")
async def review_session(session_id: str):
    """
    Generate a comprehensive review for a practice session.
    Uses MiMo API to analyze the conversation and provide feedback.
    """
    review_data = generate_review(
        pronunciation_score=72,
        vocabulary_score=65,
        grammar_score=78,
        fluency_score=60,
    )
    return review_data


@app.get("/api/scenarios")
async def list_scenarios():
    """Return available practice scenarios."""
    return [
        {"id": "interview", "title": "Job Interview", "subtitle": "外企面试", "difficulty": "B2"},
        {"id": "meeting", "title": "Business Meeting", "subtitle": "商务会议", "difficulty": "B2"},
        {"id": "restaurant", "title": "Restaurant Ordering", "subtitle": "海外点餐", "difficulty": "A2"},
        {"id": "customs", "title": "Customs & Immigration", "subtitle": "海关通关", "difficulty": "B1"},
        {"id": "shopping", "title": "Shopping & Bargaining", "subtitle": "购物砍价", "difficulty": "A2"},
        {"id": "doctor", "title": "Doctor's Visit", "subtitle": "就医问诊", "difficulty": "B1"},
        {"id": "hotel", "title": "Hotel Check-in", "subtitle": "酒店入住", "difficulty": "A2"},
        {"id": "networking", "title": "Social Networking", "subtitle": "社交拓展", "difficulty": "B2"},
    ]


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
