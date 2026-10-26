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
      <main className="flex min-h-screen items-center justify-center bg-canvas px-5">
        <section role="alert" className="w-full max-w-sm text-center">
          <h1 className="display text-xl text-ink">Esta tela não carregou</h1>
          <p className="mt-2 text-sm text-ink-2">
            Ocorreu um erro ao exibir os dados. Recarregue para tentar de novo.
          </p>
          <button
            type="button"
            onClick={this.recarregarAplicacao}
            className="mt-6 h-10 rounded-lg bg-flare px-4 text-sm font-medium text-canvas transition-colors hover:bg-white"
          >
            Recarregar
          </button>
        </section>
      </main>
    );
  }
}
