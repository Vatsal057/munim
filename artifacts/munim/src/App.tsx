import { type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MotionConfig } from 'framer-motion';
import { ErrorBoundary, type ErrorFallbackProps } from '@/components/error-boundary';
import { ErrorView } from '@/components/munim/ui';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import Landing from '@/pages/landing';
import Signup from '@/pages/signup';
import Demo from '@/pages/demo';
import Home from '@/pages/home';
import Tell from '@/pages/tell';
import Ledger from '@/pages/ledger';
import Customer from '@/pages/customer';
import Activity from '@/pages/activity';
import Reminders from '@/pages/reminders';
import Pay from '@/pages/pay';
import Admin from '@/pages/admin';
import {
  Route,
  Switch,
  useLocation,
  Router as WouterRouter,
} from 'wouter';

const queryClient = new QueryClient({
  defaultOptions: { queries: { refetchOnWindowFocus: true, staleTime: 5_000 } },
});

function Router() {
  return (
    <RoutedErrorBoundary>
      <Switch>
        <Route path="/" component={Landing} />
        <Route path="/signup" component={Signup} />
        <Route path="/demo" component={Demo} />
        <Route path="/app" component={Home} />
        <Route path="/app/tell" component={Tell} />
        <Route path="/app/ledger" component={Ledger} />
        <Route path="/app/customers/:id" component={Customer} />
        <Route path="/app/activity" component={Activity} />
        <Route path="/app/reminders" component={Reminders} />
        <Route path="/p/:token" component={Pay} />
        <Route path="/admin" component={Admin} />
        <Route component={NotFound} />
      </Switch>
    </RoutedErrorBoundary>
  );
}

function ErrorFallback({ resetError }: ErrorFallbackProps) {
  return <ErrorView onRetry={resetError} />;
}

function RoutedErrorBoundary({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  return (
    <ErrorBoundary resetKey={location} FallbackComponent={ErrorFallback}>
      {children}
    </ErrorBoundary>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <MotionConfig reducedMotion="user">
        <TooltipProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
            <Router />
          </WouterRouter>
          <Toaster />
        </TooltipProvider>
      </MotionConfig>
    </QueryClientProvider>
  );
}

export default App;
