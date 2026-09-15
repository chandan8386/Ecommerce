import { Component } from 'react';

/** Keeps a rendering error from blanking the whole admin dashboard. */
export default class ErrorBoundary extends Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error('Admin crashed:', error, info.componentStack);
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-6 text-center">
        <h1 className="text-2xl font-semibold text-slate-900">Something went wrong</h1>
        <p className="mt-2 max-w-md text-sm text-slate-600">{String(this.state.error?.message || 'Unexpected error')}</p>
        <button type="button" className="btn-primary mt-6" onClick={() => window.location.reload()}>
          Reload
        </button>
      </div>
    );
  }
}
