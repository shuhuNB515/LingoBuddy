"""Review generation module - combines all analyzer outputs into a comprehensive review."""

from typing import List


def _determine_cefr_level(avg_score: int) -> str:
    """Map average score to CEFR level."""
    if avg_score >= 90:
        return "C2"
    elif avg_score >= 80:
        return "C1"
    elif avg_score >= 70:
        return "B2"
    elif avg_score >= 55:
        return "B1"
    elif avg_score >= 40:
        return "A2"
    else:
        return "A1"


def generate_review(
    pronunciation_score: int,
    vocabulary_score: int,
    grammar_score: int,
    fluency_score: int,
) -> dict:
    """
    Generate a comprehensive review with CEFR level, radar chart data,
    and polished sentence suggestions.

    TODO: Integrate with LLM for generating contextual polished versions.
    """
    avg_score = (pronunciation_score + vocabulary_score + grammar_score + fluency_score) // 4
    cefr_level = _determine_cefr_level(avg_score)

    polished_sentences: List[dict] = [
        {"original": "I want go to restaurant", "polished": "I'd like to go to a restaurant"},
        {"original": "The food is very deliciously", "polished": "The food was absolutely delicious"},
        {"original": "Can I have check please", "polished": "Could I have the check, please?"},
    ]

    return {
        "pronunciation": pronunciation_score,
        "vocabulary": vocabulary_score,
        "grammar": grammar_score,
        "fluency": fluency_score,
        "cefrLevel": cefr_level,
        "polishedSentences": polished_sentences,
    }
