"""
Refine router - Refine existing spec based on developer feedback
"""
import logging
from fastapi import APIRouter, HTTPException, Request
from models.schemas import RefineRequest, RefineResponse

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api", tags=["Refine"])


@router.post("/refine", response_model=RefineResponse)
async def refine_spec(request_data: RefineRequest, request: Request):
    """
    Refine existing architecture specification based on developer feedback

    Takes the current spec, conversation history, and a refinement message.
    Returns the complete updated spec (not streamed).

    The LLM incorporates the developer's feedback while maintaining the
    9-section structure and markdown formatting.
    """
    logger.info(f"Refining spec for session: {request_data.session_id}")
    logger.info(f"Refinement message: {request_data.message[:100]}...")

    try:
        api_client = request.app.state.api_client
        if not api_client:
            raise HTTPException(
                status_code=503,
                detail="API client not initialized. Check inference API configuration."
            )

        refined_spec = await api_client.refine_spec(
            current_spec=request_data.current_spec,
            history=request_data.history,
            message=request_data.message
        )

        logger.info("Spec refinement complete")

        return RefineResponse(
            spec=refined_spec,
            session_id=request_data.session_id
        )

    except ValueError as e:
        logger.error(f"Validation error: {e}")
        raise HTTPException(status_code=422, detail=str(e))
    except Exception as e:
        logger.error(f"Error refining spec: {e}", exc_info=True)
        raise HTTPException(
            status_code=502,
            detail="The AI service returned an error. Please try again."
        )
