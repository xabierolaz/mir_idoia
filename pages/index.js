import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Header from '../components/Header';
import HomeScreen from '../components/HomeScreen';
import QuizScreen from '../components/QuizScreen';
import ResultsScreen from '../components/ResultsScreen';
import HistoryScreen from '../components/HistoryScreen';
import StatsScreen from '../components/StatsScreen';
import ReviewScreen from '../components/ReviewScreen';
import SettingsScreen from '../components/SettingsScreen';
import AboutScreen from '../components/AboutScreen';

export default function Home() {
  const [mode, setMode] = useState('loading');
  const [progress, setProgress] = useState({});
  const [stats, setStats] = useState({});
  const [testResults, setTestResults] = useState(null);
  const [config, setConfig] = useState({});
  
  useEffect(() => {
    initializeApp();
  }, []);
  
  const initializeApp = async () => {
    try {
      const response = await fetch('/api/init');
      const data = await response.json();
      
      setProgress(data.progress || {});
      setStats(data.stats || {
        total_tests: 0,
        average_score: 0,
        last_test: null,
        total_questions_seen: 0
      });
      setConfig(data.config || {
        questions_per_test: 100
      });
      
      setMode('home');
    } catch (error) {
      console.error('Error initializing app:', error);
      // Continuar con valores por defecto
      setMode('home');
    }
  };
  
  const handleStartQuiz = () => {
    setMode('quiz');
  };
  
  const handleQuizComplete = (results) => {
    setTestResults(results);
    setMode('results');
    // Recargar estadísticas
    initializeApp();
  };
  
  const handleShowStats = () => {
    setMode('history');
  };
  
  const handleShowDetailedStats = () => {
    setMode('stats');
  };
  
  const handleReviewTest = () => {
    setMode('review');
  };
  
  const handleShowSettings = () => {
    setMode('settings');
  };
  
  const handleBackHome = () => {
    setMode('home');
    initializeApp();
  };
  
  const handleNavigation = (newMode) => {
    if (['quiz', 'results', 'review'].includes(mode) && newMode !== mode) {
      if (!confirm('¿Estás seguro de que quieres salir? Se perderá el progreso actual.')) {
        return;
      }
    }
    setMode(newMode);
  };
  
  const renderContent = () => {
    switch (mode) {
      case 'loading':
        return (
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Cargando sistema de estudio...</p>
          </div>
        );
        
      case 'home':
        return (
          <HomeScreen 
            progress={progress}
            stats={stats}
            config={config}
            onStartQuiz={handleStartQuiz}
            onShowStats={handleShowStats}
            onShowDetailedStats={handleShowDetailedStats}
            onShowSettings={handleShowSettings}
          />
        );
        
      case 'quiz':
        return (
          <QuizScreen 
            onComplete={handleQuizComplete}
          />
        );
        
      case 'results':
        return (
          <ResultsScreen 
            results={testResults}
            onHome={handleBackHome}
            onNewTest={handleStartQuiz}
            onReview={handleReviewTest}
          />
        );
        
      case 'history':
        return (
          <HistoryScreen
            onBack={handleBackHome}
          />
        );
        
      case 'stats':
        return (
          <StatsScreen
            onBack={handleBackHome}
          />
        );
        
      case 'review':
        return (
          <ReviewScreen
            questions={testResults?.questions || []}
            answers={testResults?.answers || {}}
            onBack={() => setMode('results')}
          />
        );
        
      case 'settings':
        return (
          <SettingsScreen
            onBack={handleBackHome}
          />
        );
        
      case 'about':
        return (
          <AboutScreen
            onBack={handleBackHome}
          />
        );
        
      default:
        return null;
    }
  };
  
  return (
    <>
      <Head>
        <title>OPE Medicina Preventiva - Sistema de Estudio</title>
        <meta name="description" content="Sistema de estudio para OPE Medicina Preventiva con 1512 preguntas y seguimiento de progreso" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" type="image/svg+xml" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='50%' x='50%' text-anchor='middle' font-size='80'>🏥</text></svg>" />
      </Head>
      
      <main>
        {mode !== 'loading' && mode !== 'quiz' && (
          <Header 
            currentMode={mode}
            onNavigate={handleNavigation}
          />
        )}
        {renderContent()}
      </main>
    </>
  );
}