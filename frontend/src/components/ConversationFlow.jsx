import { useState, useRef, useEffect } from 'react';
import MessageBubble from './MessageBubble';
import QuestionChips from './QuestionChips';
import GeneratingState from './GeneratingState';
import * as api from '../utils/api';
import './ConversationFlow.css';

const STATES = {
  GREETING: 'greeting',
  IDEA_INPUT: 'idea_input',
  FETCHING_QUESTIONS: 'fetching_questions',
  ASKING_QUESTION: 'asking_question',
  GENERATING_SPEC: 'generating_spec',
  SPEC_DISPLAY: 'spec_display',
  ERROR: 'error',
};

const acknowledgements = [
  "Got it.",
  "Makes sense.",
  "Understood.",
  "Perfect.",
  "Great.",
  "Thanks.",
];

export default function ConversationFlow({ onSpecGenerated }) {
  const [state, setState] = useState(STATES.IDEA_INPUT);
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: "Hi, I'm SpecForge. Tell me what you want to build — describe your idea in plain language. Don't worry about technical details yet, just tell me what it does and who it's for."
    }
  ]);
  const [idea, setIdea] = useState('');
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [generatedSpec, setGeneratedSpec] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [error, setError] = useState(null);
  const [isTyping, setIsTyping] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [isSpecComplete, setIsSpecComplete] = useState(false);
  const [refinementHistory, setRefinementHistory] = useState([]);
  const [sessionId, setSessionId] = useState(null);

  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const addAssistantMessage = (content) => {
    setMessages((prev) => [...prev, { role: 'assistant', content }]);
  };

  const addUserMessage = (content) => {
    setMessages((prev) => [...prev, { role: 'user', content }]);
  };

  const getRandomAcknowledgement = () => {
    return acknowledgements[Math.floor(Math.random() * acknowledgements.length)];
  };

  const handleIdeaSubmit = async (e) => {
    e.preventDefault();
    const trimmedIdea = idea.trim();
    if (!trimmedIdea) return;

    addUserMessage(trimmedIdea);
    setIdea('');
    setState(STATES.FETCHING_QUESTIONS);
    setIsTyping(true);

    try {
      const response = await api.getQuestions(trimmedIdea);
      setQuestions(response.questions);
      setIsTyping(false);

      setTimeout(() => {
        if (response.questions && response.questions.length > 0) {
          const firstQuestion = response.questions[0];
          addAssistantMessage(firstQuestion.text);
          setState(STATES.ASKING_QUESTION);
          setCurrentQuestionIndex(0);
        }
      }, 600);
    } catch (err) {
      setIsTyping(false);
      setError(err.message);
      setState(STATES.ERROR);
      addAssistantMessage(
        "I'm sorry, I encountered an error while processing your request. Please try again."
      );
    }
  };

  const handleAnswerSubmit = (answer) => {
    addUserMessage(answer);
    setInputValue('');

    const newAnswers = [...answers, {
      question: questions[currentQuestionIndex].text,
      answer: answer,
    }];
    setAnswers(newAnswers);

    if (currentQuestionIndex < questions.length - 1) {
      setIsTyping(true);
      setTimeout(() => {
        addAssistantMessage(getRandomAcknowledgement());
        setIsTyping(false);

        setTimeout(() => {
          const nextQuestion = questions[currentQuestionIndex + 1];
          addAssistantMessage(nextQuestion.text);
          setCurrentQuestionIndex(currentQuestionIndex + 1);
        }, 600);
      }, 400);
    } else {
      setIsTyping(true);
      setTimeout(() => {
        addAssistantMessage(getRandomAcknowledgement());
        setIsTyping(false);

        setTimeout(() => {
          addAssistantMessage(
            "I have everything I need. Generating your architecture spec now — this takes about 20 to 30 seconds."
          );

          setTimeout(() => {
            startSpecGeneration(newAnswers);
          }, 1000);
        }, 600);
      }, 400);
    }
  };

  const startSpecGeneration = (finalAnswers) => {
    setState(STATES.GENERATING_SPEC);
    setStatusMessage('Analysing your requirements...');

    let accumulatedSpec = '';

    const cleanup = api.generateSpec(
      idea,
      finalAnswers,
      (status) => {
        setStatusMessage(status);
      },
      (token) => {
        accumulatedSpec += token;
        setGeneratedSpec(accumulatedSpec);
      },
      (finalSpec, receivedSessionId) => {
        setGeneratedSpec(finalSpec);
        setSessionId(receivedSessionId);
        setIsSpecComplete(true);
        setState(STATES.SPEC_DISPLAY);
        if (onSpecGenerated) {
          onSpecGenerated(finalSpec);
        }
      },
      (err) => {
        setError(err.message || 'Generation failed');
        setState(STATES.ERROR);
        addAssistantMessage(
          "I'm sorry, something went wrong during generation. Please try again."
        );
      }
    );

    return cleanup;
  };

  const handleRefine = async (message) => {
    try {
      setRefinementHistory([...refinementHistory, { role: 'user', content: message }]);
      setIsSpecComplete(false);
      setStatusMessage('Refining your specification...');

      const response = await api.refineSpec(sessionId, generatedSpec, refinementHistory, message);

      setGeneratedSpec(response.spec);
      setRefinementHistory([
        ...refinementHistory,
        { role: 'user', content: message },
        { role: 'assistant', content: response.spec }
      ]);
      setIsSpecComplete(true);
      setStatusMessage('Specification updated');
    } catch (error) {
      console.error('Refinement error:', error);
      setError(error.message);
      setIsSpecComplete(true);
    }
  };

  if (state === STATES.SPEC_DISPLAY) {
    return (
      <div className="spec-display-view">
        <GeneratingState
          statusMessage={statusMessage}
          spec={generatedSpec}
          isComplete={isSpecComplete}
          onRefine={handleRefine}
          sessionId={sessionId}
        />
      </div>
    );
  }

  if (state === STATES.GENERATING_SPEC) {
    return (
      <div className="generating-view">
        <div className="generating-spinner-large">
          <div className="spinner-ring"></div>
          <div className="spinner-ring"></div>
          <div className="spinner-ring"></div>
        </div>
        <p className="generating-status">{statusMessage || 'Generating your specification...'}</p>
      </div>
    );
  }

  return (
    <div className="conversation-wrapper">
      <div className="messages-list">
        {messages.map((msg, index) => (
          <MessageBubble key={index} role={msg.role} content={msg.content} />
        ))}

        {isTyping && <MessageBubble role="assistant" isTyping={true} />}

        {state === STATES.ASKING_QUESTION && !isTyping && (
          <QuestionChips
            question={questions[currentQuestionIndex]}
            onAnswer={handleAnswerSubmit}
          />
        )}

        <div ref={messagesEndRef} />
      </div>

      {state === STATES.IDEA_INPUT && (
        <div className="input-area">
          <textarea
            className="idea-input"
            placeholder="Describe your app idea in a few sentences..."
            value={idea}
            onChange={(e) => setIdea(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleIdeaSubmit(e);
              }
            }}
            autoFocus
          />
          <button
            type="submit"
            className="send-btn"
            disabled={!idea.trim()}
            onClick={handleIdeaSubmit}
          >
            <span>Send</span>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13"></line>
              <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}
