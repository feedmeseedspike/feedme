"use client";

import React from "react";
import { AlertCircle } from "lucide-react";

interface Props {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error to an error reporting service
    console.error("Error caught by boundary:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] p-6 bg-[#F7FAF7]">
          <div className="bg-white shadow-lg rounded-xl p-8 flex flex-col items-center max-w-md w-full border border-[#E6F4EA]">
            <AlertCircle className="w-14 h-14 text-[#1B6013] mb-4" />
            <h2 className="text-2xl font-bold mb-2 text-[#1B6013]">
              Something went wrong
            </h2>
            <p className="text-gray-600 mb-6 text-base">
              We apologize for the inconvenience.
              <br />
              Please try refreshing the page or come back later.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-2 bg-[#1B6013] text-white rounded-lg font-semibold shadow hover:bg-[#174d10] transition-colors text-base"
            >
              Refresh Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
