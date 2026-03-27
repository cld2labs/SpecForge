"""
Chat router - Ask questions about the spec without modifying it
"""
import logging
from fastapi import APIRouter, HTTPException, Request
from models.schemas import ChatRequest, ChatResponse

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api", tags=["Chat"])


@router.post("/chat", response_model=ChatResponse)
async def chat_about_spec(request_data: ChatRequest, request: Request):
    """
    Answer questions about the architecture specification without modifying it

    Takes the current spec and a question.
    Returns an answer based on the spec content.

    This allows users to understand the spec better without changing it.
    """
    logger.info(f"Answering question for session: {request_data.session_id}")
    logger.info(f"Question: {request_data.message[:100]}...")

    try:
        api_client = request.app.state.api_client
        if not api_client:
            raise HTTPException(
                status_code=503,
                detail="API client not initialized. Check inference API configuration."
            )

        answer = await api_client.ask_question(
            current_spec=request_data.current_spec,
            message=request_data.message
        )

        logger.info("Question answered successfully")

        return ChatResponse(
            answer=answer,
            session_id=request_data.session_id
        )

    except ValueError as e:
        logger.error(f"Validation error: {e}")
        raise HTTPException(status_code=422, detail=str(e))
    except Exception as e:
        logger.error(f"Error answering question: {e}", exc_info=True)
        raise HTTPException(
            status_code=502,
            detail="The AI service returned an error. Please try again."
        )
