import { useState } from 'react';
import Header from './components/Header';
import CosmicBackground from './components/CosmicBackground';
import LandingPage from './components/LandingPage';
import ConversationFlow from './components/ConversationFlow';
import './App.css';

function App() {
  const [showLanding, setShowLanding] = useState(true);
  const [generatedSpec, setGeneratedSpec] = useState(null);

  const handleSpecGenerated = (spec) => {
    setGeneratedSpec(spec);
  };

  const handleGetStarted = () => {
    setShowLanding(false);
  };

  return (
    <div className="app">
      <CosmicBackground />
      <Header />
      <main className="main-content">
        {showLanding ? (
          <LandingPage onGetStarted={handleGetStarted} />
        ) : (
          <ConversationFlow onSpecGenerated={handleSpecGenerated} />
        )}
      </main>
    </div>
  );
}

export default App;
