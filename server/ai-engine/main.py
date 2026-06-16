import os
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

from analyzers.pronunciation import analyze_pronunciation
from analyzers.vocabulary import analyze_vocabulary
from analyzers.grammar import analyze_grammar
from analyzers.fluency import analyze_fluency
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

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")


@app.get("/health")
async def health():
    return {"status": "ok"}


@app.websocket("/ws/audio")
async def audio_stream(websocket: WebSocket):
    """
    Receive streaming audio from the signaling server,
    process through the speech-to-speech pipeline,
    and return AI audio response + error corrections.
    """
    await websocket.accept()
    try:
        while True:
            data = await websocket.receive_bytes()

            # TODO: Integrate with real speech model pipeline
            # 1. STT: Convert audio to text
            # 2. NLU: Understand intent & detect errors
            # 3. TTS: Generate AI response audio
            # 4. Send back audio + corrections

            # Placeholder: echo back with mock corrections
            await websocket.send_json({
                "type": "transcript",
                "text": "[processed text placeholder]",
            })

    except WebSocketDisconnect:
        pass


@app.post("/api/review/{session_id}")
async def review_session(session_id: str):
    """
    Generate a comprehensive review for a practice session.
    Returns CEFR level, radar chart data, and polished suggestions.
    """
    # TODO: Fetch actual session data from database
    review_data = generate_review(
        pronunciation_score=analyze_pronunciation(),
        vocabulary_score=analyze_vocabulary(),
        grammar_score=analyze_grammar(),
        fluency_score=analyze_fluency(),
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
