"""
API Client for inference API calls - supports remote OpenAI-compatible APIs and local Ollama
Handles spec generation, questions generation, and refinement
"""

import os
import json
import logging
import httpx
from typing import List, Dict, AsyncGenerator
from datetime import datetime
import config

logger = logging.getLogger(__name__)


def _load_prompt(filename: str) -> str:
    """Load prompt template from prompts directory"""
    prompt_path = os.path.join(os.path.dirname(__file__), "..", "prompts", filename)
    with open(prompt_path, "r", encoding="utf-8") as f:
        return f.read()


class APIClient:
    """
    Client for handling inference API calls.
    Supports remote OpenAI-compatible APIs and local Ollama instances.
    """

    def __init__(self):
        self.endpoint = config.INFERENCE_API_ENDPOINT
        self.token = config.INFERENCE_API_TOKEN
        self.provider = config.INFERENCE_PROVIDER
        self.model = config.INFERENCE_MODEL_NAME
        self.http_client = httpx.Client(verify=config.VERIFY_SSL)

    def get_inference_client(self):
        """
        Get OpenAI-compatible client configured for the active provider
        """
        from openai import OpenAI

        api_key = self.token if self.token else "ollama"
        return OpenAI(
            api_key=api_key,
            base_url=f"{self.endpoint}/v1",
            http_client=self.http_client
        )

    async def get_questions(self, idea: str) -> List[Dict]:
        """
        Generate comprehensive follow-up questions based on the user's idea
        Returns list of question dicts with id, text, help_text, chips, allow_free_text
        """
        client = self.get_inference_client()
        prompt_template = _load_prompt("generate_questions.txt")
        prompt = prompt_template.replace("{idea}", idea)

        logger.info(f"Generating questions with {self.provider} provider")

        if self.provider == "ollama":
            response = client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "user", "content": prompt}
                ],
                max_tokens=2000,
                temperature=config.LLM_TEMPERATURE
            )
            content = response.choices[0].message.content
        else:
            response = client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "user", "content": prompt}
                ],
                max_tokens=2000,
                temperature=config.LLM_TEMPERATURE
            )
            content = response.choices[0].message.content

        logger.debug(f"Provider response: {content}")

        try:
            data = json.loads(content)
            questions = data.get("questions", [])
            logger.info(f"Generated {len(questions)} questions")
            return questions
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse response as JSON: {e}")
            logger.error(f"Response was: {content}")
            raise ValueError("The AI service returned an invalid response")

    async def generate_spec_stream(self, idea: str, answers: List[Dict]) -> AsyncGenerator[Dict, None]:
        """
        Generate architecture spec with streaming
        Yields SSE events: {type: 'status'|'token'|'done', data: ...}
        """
        client = self.get_inference_client()
        prompt_template = _load_prompt("generate_spec.txt")

        answers_text = "\n".join([
            f"Q: {ans['question']}\nA: {ans['answer']}"
            for ans in answers
        ])

        prompt = prompt_template.replace("{idea}", idea).replace("{answers}", answers_text)

        logger.info(f"Starting streaming spec generation with {self.provider} provider")

        yield {"type": "status", "message": "Analysing your requirements..."}
        yield {"type": "status", "message": "Designing your architecture..."}
        yield {"type": "status", "message": "Writing your spec..."}

        if self.provider == "ollama":
            stream = client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "user", "content": prompt}
                ],
                max_tokens=config.LLM_MAX_TOKENS,
                temperature=config.LLM_TEMPERATURE,
                stream=True
            )

            for chunk in stream:
                if chunk.choices[0].delta.content:
                    yield {"type": "token", "content": chunk.choices[0].delta.content}
        else:
            stream = client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "user", "content": prompt}
                ],
                max_tokens=config.LLM_MAX_TOKENS,
                temperature=config.LLM_TEMPERATURE,
                stream=True
            )

            for chunk in stream:
                if chunk.choices[0].delta.content:
                    yield {"type": "token", "content": chunk.choices[0].delta.content}

        session_id = f"session_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
        logger.info(f"Spec generation complete: {session_id}")
        yield {"type": "done", "session_id": session_id}

    async def refine_spec(self, current_spec: str, history: List[Dict], message: str) -> str:
        """
        Refine existing spec based on developer feedback
        Returns updated spec as string
        """
        client = self.get_inference_client()
        prompt_template = _load_prompt("refine_spec.txt")

        history_text = "\n".join([
            f"{msg['role']}: {msg['content']}"
            for msg in history
        ])

        prompt = (prompt_template
                  .replace("{current_spec}", current_spec)
                  .replace("{history}", history_text)
                  .replace("{message}", message))

        logger.info(f"Refining spec with {self.provider} provider")

        response = client.chat.completions.create(
            model=self.model,
            messages=[
                {"role": "user", "content": prompt}
            ],
            max_tokens=config.LLM_MAX_TOKENS,
            temperature=config.LLM_TEMPERATURE
        )

        refined_spec = response.choices[0].message.content
        logger.info("Spec refinement complete")

        return refined_spec

    async def ask_question(self, current_spec: str, message: str) -> str:
        """
        Answer questions about the spec without modifying it
        Returns answer as string
        """
        client = self.get_inference_client()

        prompt = f"""You are a helpful assistant analyzing a system design specification.

Current Specification:
{current_spec}

User Question: {message}

Provide a clear, concise answer based on the specification above. If the information isn't in the spec, say so politely and suggest what might be needed."""

        logger.info(f"Answering question with {self.provider} provider")

        response = client.chat.completions.create(
            model=self.model,
            messages=[
                {"role": "user", "content": prompt}
            ],
            max_tokens=1000,
            temperature=0.7
        )

        answer = response.choices[0].message.content
        logger.info("Question answered")

        return answer

    def is_authenticated(self) -> bool:
        """For Ollama, always returns True. For remote, checks token."""
        if self.provider == "ollama":
            return True
        return self.token is not None

    def __del__(self):
        if self.http_client:
            self.http_client.close()


_api_client = None


def get_api_client() -> APIClient:
    global _api_client
    if _api_client is None:
        _api_client = APIClient()
    return _api_client
