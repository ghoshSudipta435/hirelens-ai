'use client';

import { useQuery } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import { useCallback, useState, useRef, useEffect } from 'react';

import { ProtectedRoute } from '@/components/auth/protected-route';
import { ErrorState } from '@/components/feedback/error-state';
import { LoadingState } from '@/components/feedback/loading-state';
import { AppShell } from '@/components/layout/app-shell';
import { PageShell } from '@/components/layout/page-shell';
import * as interviewService from '@/services/interview.service';
import { useAuthStore } from '@/stores/auth.store';

type Message = {
  id: string;
  role: 'system' | 'user' | 'interviewer';
  content: string;
};

export default function InterviewDetailPage() {
  const params = useParams();
  const user = useAuthStore((state) => state.user);
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [inputValue, setInputValue] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  const fetchQuestions = useCallback(async () => {
    return interviewService.getQuestionSet(params.id as string);
  }, [params.id]);

  const { data: questionSet, isLoading, isError, error } = useQuery({
    queryKey: ['interview-questions', params.id],
    queryFn: fetchQuestions,
  });

  // Initialize chat when questions load
  useEffect(() => {
    if (questionSet && messages.length === 0) {
      setMessages([
        { id: 'sys-1', role: 'system', content: 'Mock interview session started. The AI will ask you questions based on your resume and the job description.' },
        { id: 'q-0', role: 'interviewer', content: questionSet.questions[0]?.question ?? 'No questions available.' }
      ]);
    }
  }, [questionSet, messages.length]);

  // Scroll to bottom on new message
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: inputValue };
    setMessages(prev => [...prev, userMsg]);
    setInputValue('');

    // Simulate AI response/next question
    setTimeout(() => {
      const nextIdx = currentQuestionIdx + 1;
      if (questionSet && nextIdx < questionSet.questions.length) {
        setMessages(prev => [
          ...prev,
          { id: `q-${nextIdx}`, role: 'interviewer', content: questionSet?.questions[nextIdx]?.question ?? '' }
        ]);
        setCurrentQuestionIdx(nextIdx);
      } else {
        setMessages(prev => [
          ...prev,
          { id: 'sys-end', role: 'system', content: 'Interview completed! The recruiter will review your responses.' }
        ]);
      }
    }, 1000);
  };

  if (isLoading) {
    return (
      <ProtectedRoute>
        <AppShell>
          <LoadingState label="Preparing your interview..." />
        </AppShell>
      </ProtectedRoute>
    );
  }

  if (isError || !questionSet) {
    return (
      <ProtectedRoute>
        <AppShell>
          <ErrorState message={error instanceof Error ? error.message : 'Question set not found'} />
        </AppShell>
      </ProtectedRoute>
    );
  }

  const isRecruiter = user?.role === 'RECRUITER';

  return (
    <ProtectedRoute>
      <AppShell>
        <PageShell
          eyebrow="Mock Interview"
          title="Interview Simulator"
          description={isRecruiter ? 'Reviewing generated questions for this candidate' : 'Practice your answers with our AI interviewer'}
        >
          {isRecruiter ? (
            // Recruiter View: Just list the questions statically
            <div className="space-y-4 pt-4">
              {questionSet.questions.map((q, i) => (
                <div key={q.id} className="rounded-xl border border-border bg-surface p-5 shadow-sm">
                  <div className="mb-2 flex items-center gap-2">
                    <span className="text-xs font-bold text-muted">Q{i + 1}</span>
                    <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                      q.difficulty === 'EASY' ? 'bg-emerald-100 text-emerald-700' :
                      q.difficulty === 'MEDIUM' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {q.difficulty}
                    </span>
                    <span className="rounded-full bg-accent/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-accent">
                      {q.category}
                    </span>
                  </div>
                  <p className="text-sm font-medium leading-relaxed text-foreground">{q.question}</p>
                </div>
              ))}
            </div>
          ) : (
            // Student View: Interactive Chat
            <div className="flex flex-col h-[calc(100vh-250px)] min-h-[500px] rounded-2xl border border-border bg-surface shadow-lg overflow-hidden mt-4">
              
              {/* Chat Header */}
              <div className="px-6 py-4 border-b border-border bg-surface flex items-center justify-between z-10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center text-accent">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-foreground">AI Interviewer</h3>
                    <p className="text-xs text-muted flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Online
                    </p>
                  </div>
                </div>
                <div className="text-xs font-medium text-muted bg-background px-3 py-1 rounded-full">
                  Question {Math.min(currentQuestionIdx + 1, questionSet.questions.length)} of {questionSet.questions.length}
                </div>
              </div>

              {/* Chat Messages */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-background/30 no-scrollbar">
                {messages.map((msg) => (
                  <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    {msg.role === 'system' ? (
                      <div className="w-full text-center">
                        <span className="inline-block px-4 py-1.5 rounded-full bg-border/50 text-[10px] font-bold text-muted uppercase tracking-wider">
                          {msg.content}
                        </span>
                      </div>
                    ) : (
                      <div className={`max-w-[80%] rounded-2xl px-5 py-3.5 shadow-sm text-sm leading-relaxed ${
                        msg.role === 'user' 
                          ? 'bg-accent text-white rounded-tr-sm' 
                          : 'bg-surface border border-border text-foreground rounded-tl-sm'
                      }`}>
                        {msg.content}
                      </div>
                    )}
                  </div>
                ))}
                <div ref={chatEndRef} />
              </div>

              {/* Chat Input */}
              <div className="p-4 bg-surface border-t border-border">
                <form onSubmit={handleSendMessage} className="flex gap-3">
                  <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder="Type your answer here..."
                    disabled={currentQuestionIdx >= questionSet.questions.length}
                    className="flex-1 rounded-xl border border-border bg-background px-4 py-3 text-sm focus:border-accent outline-none disabled:opacity-50 transition-colors"
                  />
                  <button
                    type="submit"
                    disabled={!inputValue.trim() || currentQuestionIdx >= questionSet.questions.length}
                    className="rounded-xl bg-accent px-6 py-3 text-sm font-bold text-white hover:opacity-90 disabled:opacity-50 transition-all flex items-center justify-center min-w-[100px]"
                  >
                    Send
                  </button>
                </form>
              </div>

            </div>
          )}
        </PageShell>
      </AppShell>
    </ProtectedRoute>
  );
}
