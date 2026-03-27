"""
Questions router - Generate clarifying questions based on user's idea
"""
import logging
from fastapi import APIRouter, HTTPException, Request
from models.schemas import QuestionsRequest, QuestionsResponse, Question

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api", tags=["Questions"])


@router.post("/questions", response_model=QuestionsResponse)
async def generate_questions(request_data: QuestionsRequest, request: Request):
    """
    Generate 5 targeted follow-up questions based on the user's idea

    The questions are specific to what the user described, with quick-pick
    answer chips and help text explaining why each question matters.
    """
    logger.info(f"Generating questions for idea: {request_data.idea[:50]}...")

    try:
        api_client = request.app.state.api_client
        if not api_client:
            raise HTTPException(
                status_code=503,
                detail="API client not initialized. Check inference API configuration."
            )

        questions = await api_client.get_questions(request_data.idea)

        if len(questions) != 5:
            logger.warning(f"Expected 5 questions, got {len(questions)}")

        question_models = [
            Question(
                id=q["id"],
                text=q["text"],
                help_text=q["help_text"],
                chips=q["chips"],
                allow_free_text=q.get("allow_free_text", True)
            )
            for q in questions
        ]

        logger.info(f"Successfully generated {len(question_models)} questions")
        return QuestionsResponse(questions=question_models)

    except ValueError as e:
        logger.error(f"Validation error: {e}")
        raise HTTPException(status_code=422, detail=str(e))
    except Exception as e:
        logger.error(f"Error generating questions: {e}", exc_info=True)
        raise HTTPException(
            status_code=502,
            detail="The AI service returned an error. Please try again."
        )
