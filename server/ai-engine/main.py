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
        "greeting": "Good morning! Thank you for coming in today. Please have a seat. Let's start with — could you tell me a little bit about yourself?",
        "greeting_zh": "早上好！感谢您今天来面试。请坐。我们先从——您能简单介绍一下自己吗？"
    },
    "meeting": {
        "role": "You are a project manager leading a business meeting with your team. Discuss project progress, address concerns, and assign action items. Be professional and collaborative.",
        "greeting": "Thanks everyone for joining today's meeting. Let's get started. First, I'd like to go over our current project status. Does anyone have updates to share?",
        "greeting_zh": "感谢大家参加今天的会议。我们开始吧。首先，我想回顾一下项目的当前状态。有人要分享进展吗？"
    },
    "restaurant": {
        "role": "You are a waiter at a nice restaurant in New York. Be polite and helpful. Take the customer's order, answer questions about the menu, and make recommendations.",
        "greeting": "Good evening! Welcome to The Golden Fork. May I start you off with something to drink? And here's our menu for tonight.",
        "greeting_zh": "晚上好！欢迎来到金叉餐厅。需要先来点饮品吗？这是今晚的菜单。"
    },
    "customs": {
        "role": "You are a customs officer at an international airport. Be formal and thorough. Ask standard customs and immigration questions about the traveler's purpose of visit, duration, and belongings.",
        "greeting": "Passport, please. What is the purpose of your visit to the United States?",
        "greeting_zh": "请出示护照。您来美国的目的是什么？"
    },
    "shopping": {
        "role": "You are a shopkeeper at a busy market. Be friendly but shrewd. Engage in bargaining with the customer. Offer deals but try to maintain good prices.",
        "greeting": "Hey there! Welcome to my shop! We've got the best deals in town. What are you looking for today?",
        "greeting_zh": "嘿！欢迎光临！我们这里有全城最优惠的价格。您今天想找点什么？"
    },
    "doctor": {
        "role": "You are a doctor at a clinic. Be caring and professional. Ask about the patient's symptoms, medical history, and provide medical advice. Use clear, simple language.",
        "greeting": "Hi there, I'm Dr. Smith. What brings you in today? How long have you been experiencing these symptoms?",
        "greeting_zh": "你好，我是史密斯医生。今天哪里不舒服？这些症状持续多久了？"
    },
    "hotel": {
        "role": "You are a hotel receptionist at a 4-star hotel. Be professional and accommodating. Help the guest with check-in, explain hotel amenities, and answer questions.",
        "greeting": "Welcome to the Grand Horizon Hotel! Do you have a reservation? May I have your name, please?",
        "greeting_zh": "欢迎来到地平线大酒店！请问有预订吗？能告诉我您的名字吗？"
    },
    "networking": {
        "role": "You are an outgoing professional at a networking event. Be friendly and engaging. Ask about the other person's work, share your own experiences, and suggest keeping in touch.",
        "greeting": "Hey! I don't think we've met. I'm Alex, I work in marketing. What brings you to this event tonight?",
        "greeting_zh": "嘿！我觉得我们没见过。我是Alex，做市场营销的。你今晚来参加这个活动是为什么？"
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
7. Be encouraging and supportive. Use natural, idiomatic English.
8. At the very end of your response, add a Chinese translation of your English response in this format: [ZH:中文翻译内容]
9. The Chinese translation should be natural and accurate, not word-for-word."""

                conversation_history = [
                    {"role": "system", "content": system_prompt},
                ]

                greeting = scenario["greeting"]
                greeting_zh = scenario.get("greeting_zh", "")
                conversation_history.append({"role": "assistant", "content": greeting})

                await websocket.send_json({
                    "type": "transcript",
                    "speaker": "ai",
                    "text": greeting,
                    "translation": greeting_zh,
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
                    translation = parse_translation(full_response)
                    clean_response = clean_translation_tags(clean_response)

                    # Send the clean transcript
                    await websocket.send_json({
                        "type": "transcript",
                        "speaker": "ai",
                        "text": clean_response,
                        "translation": translation,
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


def parse_translation(text: str) -> str:
    """Extract Chinese translation from AI response."""
    import re
    match = re.search(r'\[ZH:(.+?)\]', text)
    return match.group(1) if match else ""


def clean_translation_tags(text: str) -> str:
    """Remove translation tags from the displayed text."""
    import re
    return re.sub(r'\[ZH:[^\]]+\]', '', text).strip()


@app.post("/api/review/{session_id}")
async def review_session(session_id: str, body: dict = None):
    """
    Generate a comprehensive review for a practice session.
    Uses MiMo API to analyze the conversation and provide feedback.
    """
    transcript = (body or {}).get("transcript", [])
    errors = (body or {}).get("errors", [])

    # Build conversation text for LLM analysis
    conversation_text = ""
    for msg in transcript:
        speaker = "AI" if msg.get("speaker") == "ai" else "User"
        conversation_text += f"{speaker}: {msg.get('text', '')}\n"

    error_text = ""
    for err in errors:
        error_text += f"- {err.get('type', '')}: {err.get('original', '')} -> {err.get('suggestion', '')}\n"

    if not conversation_text.strip():
        return generate_review(72, 65, 78, 60)

    # Use MiMo to generate review scores and polished sentences
    review_prompt = f"""You are an English language assessment expert. Analyze the following conversation between an English learner and an AI tutor.

Conversation:
{conversation_text}

Errors detected:
{error_text if error_text else "No errors detected."}

Please provide your assessment in the following JSON format (no markdown, just raw JSON):
{{
  "pronunciation": <score 0-100>,
  "vocabulary": <score 0-100>,
  "grammar": <score 0-100>,
  "fluency": <score 0-100>,
  "polishedSentences": [
    {{"original": "<a sentence from the user that could be improved>", "polished": "<the improved version>"}}
  ]
}}

Scoring guidelines:
- pronunciation: Based on word choice complexity and natural phrasing (proxy since we can't hear audio)
- vocabulary: Range and appropriateness of vocabulary used by the learner
- grammar: Grammatical accuracy of the learner's sentences
- fluency: How natural and flowing the learner's expressions are
- Include 2-5 polished sentences showing how the learner's sentences could be improved
- Only polish sentences that actually need improvement"""

    try:
        completion = client.chat.completions.create(
            model=MIMO_MODEL,
            messages=[
                {"role": "system", "content": "You are an English language assessment expert. Respond only with valid JSON."},
                {"role": "user", "content": review_prompt},
            ],
            max_completion_tokens=1024,
            temperature=0.3,
            stream=False,
        )

        result_text = completion.choices[0].message.content.strip()
        # Try to parse JSON from the response
        import re
        json_match = re.search(r'\{[\s\S]*\}', result_text)
        if json_match:
            result = json.loads(json_match.group())
            return {
                "pronunciation": result.get("pronunciation", 70),
                "vocabulary": result.get("vocabulary", 65),
                "grammar": result.get("grammar", 75),
                "fluency": result.get("fluency", 60),
                "cefrLevel": _determine_cefr_level(
                    (result.get("pronunciation", 70) + result.get("vocabulary", 65) +
                     result.get("grammar", 75) + result.get("fluency", 60)) // 4
                ),
                "polishedSentences": result.get("polishedSentences", []),
            }
    except Exception as e:
        print(f"Review generation error: {e}")

    return generate_review(72, 65, 78, 60)


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
