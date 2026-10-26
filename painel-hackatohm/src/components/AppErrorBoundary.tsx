import React from 'react';

interface AppErrorBoundaryProps {
  children: React.ReactNode;
}

interface AppErrorBoundaryState {
  hasError: boolean;
}

export class AppErrorBoundary extends React.Component<
  AppErrorBoundaryProps,
  AppErrorBoundaryState
> {
  state: AppErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): AppErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[Aplicação] Falha inesperada na interface.', error, errorInfo);
  }

  private recarregarAplicacao = () => {
    window.location.reload();
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
        <section
          role="alert"
          className="w-full max-w-lg rounded-2xl border border-rose-200 bg-white p-8 text-center shadow-sm"
        >
          <h1 className="text-xl font-bold text-slate-900">
            Não foi possível carregar esta tela
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">
            Ocorreu um erro inesperado ao exibir os dados. Recarregue a aplicação
            para tentar novamente.
          </p>
          <button
            type="button"
            onClick={this.recarregarAplicacao}
            className="mt-6 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700"
          >
            Recarregar aplicação
          </button>
        </section>
      </main>
    );
  }
}
