import { Component } from 'react';

/** Keeps a rendering error from blanking the whole storefront. */
export default class ErrorBoundary extends Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error('Storefront crashed:', error, info.componentStack);
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-cream px-6 text-center">
        <p className="font-display text-4xl font-bold">AURUM<span className="text-gold-500">.</span></p>
        <h1 className="mt-6 text-3xl font-semibold">Something went wrong</h1>
        <p className="mt-2 max-w-md text-stone-600">We couldn't load this page. Please try again in a moment.</p>
        <button type="button" className="btn-primary mt-8" onClick={() => window.location.reload()}>
          Reload page
        </button>
      </div>
    );
  }
}
