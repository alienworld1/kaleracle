'use client';

import { useState, useEffect } from 'react';

const PredictionOrb = ({
  prediction,
  delay = 0,
  position,
}: {
  prediction: string;
  delay?: number;
  position: { x: number; y: number };
}) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  return (
    <div
      className={`absolute transition-all duration-1000 ease-out ${
        isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-50'
      }`}
      style={{
        left: `${position.x}%`,
        top: `${position.y}%`,
        animationDelay: `${delay}ms`,
      }}
    >
      <div className="relative group">
        <div className="absolute inset-0 bg-gradient-to-r from-[#ff3366] to-[#cc1144] rounded-full blur-md opacity-50 group-hover:opacity-75 transition-opacity duration-300"></div>
        <div className="relative bg-[rgba(255,255,255,0.1)] backdrop-blur-sm border border-[rgba(255,255,255,0.15)] rounded-full px-3 py-1 text-xs text-white hover:border-[#ff3366] transition-colors duration-300">
          {prediction}
        </div>
      </div>
    </div>
  );
};

const FloatingPredictions = () => {
  const predictions = [
    'BTC ↗ $95K',
    'ETH ↘ $3.2K',
    'EUR/USD ↗',
    'AAPL ↗ $240',
    'TEAM ALPHA',
    'GOLD ↘ $2K',
    'OIL ↗ $80',
    'TEAM BETA',
  ];

  // Stable positions for each prediction orb
  const positions = [
    { x: 15, y: 20 },
    { x: 85, y: 30 },
    { x: 25, y: 70 },
    { x: 75, y: 15 },
    { x: 10, y: 85 },
    { x: 90, y: 60 },
    { x: 45, y: 25 },
    { x: 65, y: 80 },
  ];

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {predictions.map((prediction, index) => (
        <PredictionOrb
          key={index}
          prediction={prediction}
          delay={index * 800}
          position={positions[index]}
        />
      ))}
    </div>
  );
};

const GlitchText = ({
  children,
  className = '',
}: {
  children: string;
  className?: string;
}) => {
  const [isGlitching, setIsGlitching] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsGlitching(true);
      setTimeout(() => setIsGlitching(false), 100);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <span className={`${className} ${isGlitching ? 'animate-pulse' : ''}`}>
      {children}
    </span>
  );
};

export default function Home() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [currentPrediction, setCurrentPrediction] = useState(0);
  const [isClient, setIsClient] = useState(false);

  const predictions = [
    'Collective Intelligence',
    'Shared Rewards',
    'Team Predictions',
    'Oracle Truth',
  ];

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient) return;

    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({
        x: (e.clientX / window.innerWidth - 0.5) * 20,
        y: (e.clientY / window.innerHeight - 0.5) * 20,
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [isClient]);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentPrediction(prev => (prev + 1) % predictions.length);
    }, 2000);
    return () => clearInterval(interval);
  }, [predictions.length]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0a0a] via-[#1a1a1a] to-[#0a0a0a] overflow-hidden relative">
      {/* Animated Background Grid */}
      <div
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255,51,102,0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,51,102,0.1) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px',
          transform: isClient
            ? `translate(${mousePosition.x}px, ${mousePosition.y}px)`
            : 'translate(0px, 0px)',
        }}
      />

      {/* Radial Accent Gradients */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-radial from-[rgba(255,51,102,0.1)] to-transparent rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gradient-radial from-[rgba(204,17,68,0.08)] to-transparent rounded-full blur-3xl" />

      {/* Floating Predictions */}
      {isClient && <FloatingPredictions />}

      {/* Main Content */}
      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-4">
        {/* Hero Section */}
        <div className="text-center space-y-8 max-w-4xl mx-auto">
          {/* Logo/Brand */}
          <div className="space-y-2">
            <h1 className="text-6xl md:text-8xl font-bold tracking-tight">
              <GlitchText className="bg-gradient-to-r from-white via-[#ff3366] to-white bg-clip-text text-transparent">
                KALERACLE
              </GlitchText>
            </h1>
            <div className="text-[#b0b0b0] text-lg tracking-[0.2em] uppercase font-mono">
              Collaborative Price Prediction DAO
            </div>
          </div>

          {/* Dynamic Tagline */}
          <div className="h-16 flex items-center justify-center">
            <div className="text-2xl md:text-3xl font-medium text-white transition-all duration-500">
              Where{' '}
              <span className="text-[#ff3366] font-bold">
                {predictions[currentPrediction]}
              </span>{' '}
              Shapes Tomorrow
            </div>
          </div>

          {/* Glass Morphism Feature Cards */}
          <div className="grid md:grid-cols-3 gap-6 mt-16 mb-12">
            {[
              {
                icon: '🤝',
                title: 'Team Formation',
                desc: 'Join forces with other predictors',
              },
              {
                icon: '⚡',
                title: 'Stake KALE',
                desc: 'Put your tokens where your prediction is',
              },
              {
                icon: '🎯',
                title: 'Oracle Resolution',
                desc: 'Reflector feeds determine truth',
              },
            ].map((feature, index) => (
              <div
                key={index}
                className="group relative p-6 bg-[rgba(26,26,26,0.8)] backdrop-blur-[20px] border border-[rgba(255,255,255,0.1)] rounded-xl hover:border-[rgba(255,51,102,0.3)] transition-all duration-300 hover:-translate-y-1"
                style={{ animationDelay: `${index * 200}ms` }}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-[rgba(255,51,102,0.05)] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl" />
                <div className="relative z-10">
                  <div className="text-3xl mb-3">{feature.icon}</div>
                  <h3 className="text-lg font-semibold text-white mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-[#b0b0b0] text-sm">{feature.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-center">
            <button className="group relative px-8 py-4 bg-gradient-to-r from-[#ff3366] to-[#cc1144] border border-[rgba(255,51,102,0.3)] rounded-lg font-semibold text-white transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_6px_20px_rgba(255,51,102,0.3)]">
              <div className="absolute inset-0 bg-gradient-to-r from-[#ff3366] to-[#cc1144] rounded-lg blur opacity-50 group-hover:opacity-75 transition-opacity duration-300" />
              <span className="relative">Enter the Oracle</span>
            </button>

            <button className="px-8 py-4 bg-[rgba(255,255,255,0.1)] backdrop-blur-[20px] border border-[rgba(255,255,255,0.15)] rounded-lg font-semibold text-white hover:border-[#ff3366] transition-all duration-300 hover:-translate-y-1">
              View Predictions
            </button>
          </div>

          {/* Stats Section */}
          <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { value: '∞', label: 'Possibilities' },
              { value: '42', label: 'Active Teams' },
              { value: '1337', label: 'Predictions' },
              { value: '95%', label: 'Accuracy' },
            ].map((stat, index) => (
              <div key={index} className="text-center space-y-1">
                <div className="text-2xl md:text-3xl font-bold text-[#ff3366] font-mono">
                  {stat.value}
                </div>
                <div className="text-sm text-[#666666] uppercase tracking-wide">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
          <div className="w-6 h-10 border-2 border-[rgba(255,255,255,0.3)] rounded-full flex justify-center">
            <div className="w-1 h-3 bg-[#ff3366] rounded-full mt-2 animate-pulse" />
          </div>
        </div>
      </div>

      {/* Bottom Glow */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#ff3366] to-transparent opacity-50" />
    </div>
  );
}
