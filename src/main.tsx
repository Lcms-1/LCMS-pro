import React, { Component, ErrorInfo, ReactNode, StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  public static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
    this.setState({ errorInfo });
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-900 text-white p-6 font-sans flex flex-col justify-center items-center">
          <div className="max-w-3xl w-full bg-slate-800 border border-slate-700 rounded-xl p-6 shadow-2xl space-y-4">
            <h1 className="text-xl font-bold text-rose-400">Runtime Error Caught</h1>
            <p className="text-sm text-slate-300">
              {this.state.error?.toString() || 'An unexpected runtime error occurred.'}
            </p>
            {this.state.errorInfo && (
              <pre className="p-4 bg-slate-950 rounded text-xs text-rose-300 overflow-x-auto max-h-64 whitespace-pre-wrap font-mono">
                {this.state.errorInfo.componentStack}
              </pre>
            )}
            <button
              onClick={() => this.setState({ hasError: false, error: null, errorInfo: null })}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-semibold transition"
            >
              Try Again
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);




