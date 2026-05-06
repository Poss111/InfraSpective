import { useEffect } from 'react';
import sampleState from '../testdata/sample.tfstate.json';
import samplePlan from '../testdata/sample.plan.json';
import { Dashboard } from '../components/layout/Dashboard';
import { PlanDashboard } from '../components/plan/PlanDashboard';
import { StateUploader } from '../components/upload/StateUploader';
import { MarketingPages } from '../components/marketing/MarketingPages';
import { initAnalytics, trackPageView } from '../analytics/googleAnalytics';
import { useInfraStore } from '../state/useInfraStore';

export function App() {
  const path = window.location.pathname.replace(/\/$/, '') || '/';
  const activeView = useInfraStore((store) => store.activeView);
  const resourceCount = useInfraStore((store) => store.resources.length);
  const planChangeCount = useInfraStore((store) => store.planChanges.length);
  const loadStateJson = useInfraStore((store) => store.loadStateJson);
  const loadPlanJson = useInfraStore((store) => store.loadPlanJson);

  useEffect(() => {
    initAnalytics();
    trackPageView(path);
  }, [path]);

  if (activeView === 'plan' && planChangeCount > 0) {
    return <PlanDashboard />;
  }

  if (activeView === 'state' && resourceCount > 0) {
    return <Dashboard />;
  }

  if (path === '/app') {
    return (
      <StateUploader
        onLoadState={loadStateJson}
        onLoadPlan={loadPlanJson}
        onLoadDemoState={() => loadStateJson(sampleState)}
        onLoadDemoPlan={() => loadPlanJson(samplePlan)}
      />
    );
  }

  if (path === '/terraform-state-visualizer') {
    return <MarketingPages page="state" />;
  }

  if (path === '/terraform-plan-visualizer') {
    return <MarketingPages page="plan" />;
  }

  if (path === '/docs/how-to-generate-terraform-plan-json') {
    return <MarketingPages page="plan-json" />;
  }

  if (path === '/privacy') {
    return <MarketingPages page="privacy" />;
  }

  return <MarketingPages page="home" />;
}

export function ToolApp() {
  const loadStateJson = useInfraStore((store) => store.loadStateJson);
  const loadPlanJson = useInfraStore((store) => store.loadPlanJson);

  return (
    <StateUploader
      onLoadState={loadStateJson}
      onLoadPlan={loadPlanJson}
      onLoadDemoState={() => loadStateJson(sampleState)}
      onLoadDemoPlan={() => loadPlanJson(samplePlan)}
    />
  );
}
