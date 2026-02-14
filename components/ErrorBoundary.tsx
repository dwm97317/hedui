import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null,
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('ErrorBoundary caught an error:', error, errorInfo);
    }

    private handleReset = () => {
        this.setState({ hasError: false, error: null });
        window.location.reload();
    };

    public render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }

            return (
                <div className="flex flex-col items-center justify-center min-h-screen bg-slate-900 text-white p-6">
                    <div className="max-w-md w-full bg-slate-800 rounded-2xl p-8 text-center">
                        <span className="material-icons text-red-500 text-6xl mb-4">error_outline</span>
                        <h1 className="text-2xl font-bold mb-2">出错了</h1>
                        <p className="text-slate-400 mb-6">
                            应用程序遇到了意外错误。请尝试刷新页面。
                        </p>
                        {this.state.error && (
                            <details className="mb-6 text-left">
                                <summary className="cursor-pointer text-sm text-slate-500 hover:text-slate-300">
                                    技术详情
                                </summary>
                                <pre className="mt-2 text-xs bg-slate-900 p-3 rounded overflow-auto max-h-40">
                                    {this.state.error.toString()}
                                </pre>
                            </details>
                        )}
                        <button
                            onClick={this.handleReset}
                            className="w-full py-3 bg-primary hover:bg-primary/90 rounded-xl font-bold transition-colors"
                        >
                            刷新页面
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
