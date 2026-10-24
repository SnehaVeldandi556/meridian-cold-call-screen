import React, { useState, useEffect } from 'react';
import { StageConfig, OutcomeDefinition, Call, CallStageRecord } from './types';
import { fetchStages, createCall, saveStageResult, closeCall, FALLBACK_STAGES, FALLBACK_OUTCOMES } from './api';
import { Header } from './components/Header';
import { StageStepper } from './components/StageStepper';
import { LiveCallerScreen } from './components/LiveCallerScreen';
import { PastCallsScreen } from './components/PastCallsScreen';
import { TranscriptSimulator } from './components/TranscriptSimulator';
import { CloseCallModal } from './components/CloseCallModal';
import { NewCallModal } from './components/NewCallModal';

export const App: React.FC = () => {
  const [stages, setStages] = useState<StageConfig[]>(FALLBACK_STAGES);
  const [outcomes, setOutcomes] = useState<OutcomeDefinition[]>(FALLBACK_OUTCOMES);
  const [currentTab, setCurrentTab] = useState<'caller' | 'history' | 'transcripts'>('caller');
  
  // Call session state
  const [currentCall, setCurrentCall] = useState<Call>({
    id: 'call-T001',
    prospect_name: 'Dev Sharma',
    prospect_role: 'Technical Services Director',
    company: 'Kalpana Chem Supplies (fictional)',
    company_kind: 'mid-size private company',
    caller_name: 'Priya, Meridian Growth Partners',
    phone: '+91 98201 44102',
    status: 'in_progress',
    current_stage: 2,
    stage_reached: 2,
    outcome: 'not_logged',
    duration_seconds: 75,
    created_at: new Date().toISOString(),
    stages: []
  });

  const [currentStageNumber, setCurrentStageNumber] = useState<number>(2);
  const [isCallActive, setIsCallActive] = useState<boolean>(true);
  const [callDuration, setCallDuration] = useState<number>(75);

  // Modals state
  const [isCloseModalOpen, setIsCloseModalOpen] = useState<boolean>(false);
  const [isNewCallModalOpen, setIsNewCallModalOpen] = useState<boolean>(false);

  // Load stages on startup
  useEffect(() => {
    async function init() {
      try {
        const res = await fetchStages();
        if (res.stages && res.stages.length > 0) setStages(res.stages);
        if (res.outcomes && res.outcomes.length > 0) setOutcomes(res.outcomes);
      } catch (e) {
        console.warn('Using default stages configuration:', e);
      }
    }
    init();
  }, []);

  // Timer tick effect
  useEffect(() => {
    let interval: any;
    if (isCallActive) {
      interval = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isCallActive]);

  // Format seconds to mm:ss
  const formatDuration = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Find stage record for current stage
  const currentStageRecord = currentCall.stages?.find(s => s.stage_number === currentStageNumber);

  // Save stage handler
  const handleSaveStage = async (stageNumber: number, tapResult: string, prospectWords: string, aiSuggestion?: string) => {
    try {
      const stageObj = stages.find(s => s.number === stageNumber);
      const updated = await saveStageResult(currentCall.id, {
        stage_number: stageNumber,
        stage_name: stageObj?.name || `Stage ${stageNumber}`,
        tap_result: tapResult,
        prospect_words: prospectWords,
        ai_suggestion: aiSuggestion
      });
      setCurrentCall(updated);
    } catch (err) {
      console.warn('Failed to sync stage with backend:', err);
    }
  };

  // Stage Navigation
  const handleSelectStage = (stageNum: number) => {
    setCurrentStageNumber(stageNum);
    setCurrentCall(prev => ({
      ...prev,
      current_stage: stageNum,
      stage_reached: Math.max(prev.stage_reached, stageNum)
    }));
  };

  const handleNextStage = () => {
    if (currentStageNumber < 8) {
      const nextNum = currentStageNumber + 1;
      handleSelectStage(nextNum);
    } else {
      setIsCloseModalOpen(true);
    }
  };

  const handlePrevStage = () => {
    if (currentStageNumber > 1) {
      handleSelectStage(currentStageNumber - 1);
    }
  };

  // Start a new call
  const handleStartNewCall = async (callData: Partial<Call>) => {
    try {
      const created = await createCall(callData);
      setCurrentCall(created);
      setCurrentStageNumber(1);
      setCallDuration(0);
      setIsCallActive(true);
      setIsNewCallModalOpen(false);
      setCurrentTab('caller');
    } catch (e) {
      console.error(e);
    }
  };

  // Load a transcript into the caller screen for practice
  const handleLoadTranscriptIntoCaller = async (prospect: Partial<Call>) => {
    await handleStartNewCall(prospect);
  };

  // Finalize and close call
  const handleSaveAndClose = async (closeData: any) => {
    try {
      const closed = await closeCall(currentCall.id, closeData);
      setCurrentCall(closed);
      setIsCallActive(false);
      setIsCloseModalOpen(false);
      // Switch to past calls view to see it logged!
      setCurrentTab('history');
    } catch (e) {
      console.error(e);
    }
  };

  const currentStageConfig = stages.find(s => s.number === currentStageNumber) || stages[0];

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-sans">
      {/* 1. Global Navigation Header */}
      <Header
        currentTab={currentTab}
        onTabChange={setCurrentTab}
        callDuration={callDuration}
        isCallActive={isCallActive}
        onNewCallClick={() => setIsNewCallModalOpen(true)}
        prospectName={currentCall.prospect_name}
        companyName={currentCall.company}
      />

      {/* 2. Main Content Area */}
      <main className="flex-1">
        {currentTab === 'caller' && (
          <div className="space-y-0">
            {/* 8-Stage Progress Stepper */}
            <StageStepper
              stages={stages}
              currentStageNumber={currentStageNumber}
              highestStageReached={currentCall.stage_reached}
              onSelectStage={handleSelectStage}
            />

            {/* The Caller Surface */}
            <LiveCallerScreen
              currentStage={currentStageConfig}
              allStages={stages}
              currentCall={currentCall}
              stageRecord={currentStageRecord}
              onSaveStage={handleSaveStage}
              onNextStage={handleNextStage}
              onPrevStage={handlePrevStage}
              onEndCallEarly={() => setIsCloseModalOpen(true)}
              formatDuration={formatDuration}
              callDuration={callDuration}
            />
          </div>
        )}

        {currentTab === 'history' && (
          <PastCallsScreen
            stages={stages}
            outcomes={outcomes}
          />
        )}

        {currentTab === 'transcripts' && (
          <TranscriptSimulator
            onLoadTranscriptIntoCaller={handleLoadTranscriptIntoCaller}
          />
        )}
      </main>

      {/* 3. Modals */}
      <CloseCallModal
        isOpen={isCloseModalOpen}
        onClose={() => setIsCloseModalOpen(false)}
        onSaveAndClose={handleSaveAndClose}
        currentCall={currentCall}
        currentStageNumber={currentStageNumber}
        allStages={stages}
        outcomes={outcomes}
        callDuration={callDuration}
        formatDuration={formatDuration}
      />

      <NewCallModal
        isOpen={isNewCallModalOpen}
        onClose={() => setIsNewCallModalOpen(false)}
        onStartCall={handleStartNewCall}
      />
    </div>
  );
};

export default App;
