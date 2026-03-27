"""
Generate router - Stream architecture spec generation via SSE
"""
import json
import logging
from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import StreamingResponse
from models.schemas import GenerateRequest

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api", tags=["Generate"])


@router.post("/generate")
async def generate_spec(request_data: GenerateRequest, request: Request):
    """
    Generate architecture specification with Server-Sent Events streaming

    SSE event types:
    - status: Status update messages (e.g. "Analysing your requirements...")
    - token: Individual content tokens as they arrive from LLM
    - done: Generation complete, includes session_id
    - error: Error occurred during generation

    The spec streams token by token for real-time rendering in the frontend.
    """
    logger.info(f"Starting spec generation for idea: {request_data.idea[:50]}...")
    logger.info(f"Received {len(request_data.answers)} answers")

    async def event_generator():
        """Generate SSE events"""
        try:
            api_client = request.app.state.api_client
            if not api_client:
                error_data = json.dumps({"error": "API client not initialized. Check inference API configuration."})
                yield f"event: error\ndata: {error_data}\n\n"
                return

            answers_list = [
                {"question": ans.question, "answer": ans.answer}
                for ans in request_data.answers
            ]

            async for event in api_client.generate_spec_stream(request_data.idea, answers_list):
                event_type = event["type"]

                if event_type == "status":
                    yield f"event: status\ndata: {json.dumps({'message': event['message']})}\n\n"

                elif event_type == "token":
                    yield f"event: token\ndata: {json.dumps({'content': event['content']})}\n\n"

                elif event_type == "done":
                    yield f"event: done\ndata: {json.dumps({'session_id': event['session_id']})}\n\n"

        except ValueError as e:
            logger.error(f"Validation error: {e}")
            error_data = json.dumps({"error": str(e)})
            yield f"event: error\ndata: {error_data}\n\n"

        except Exception as e:
            logger.error(f"Error during spec generation: {e}", exc_info=True)
            error_data = json.dumps({"error": "The AI service returned an error. Please try again."})
            yield f"event: error\ndata: {error_data}\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no"
        }
    )
