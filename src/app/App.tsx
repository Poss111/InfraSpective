import { useEffect } from 'react';
import sampleState from '../testdata/sample.tfstate.json';
import samplePlan from '../testdata/sample.plan.json';
import { Dashboard } from '../components/layout/Dashboard';
import { PlanDashboard } from '../components/plan/PlanDashboard';
import { StateUploader } from '../components/upload/StateUploader';
import { MarketingPages } from '../components/marketing/MarketingPages';
import { KnowledgeDashboard } from '../components/knowledge/KnowledgeDashboard';
import { initAnalytics, trackPageView } from '../analytics/googleAnalytics';
import { initAdsense } from '../ads/googleAdsense';
import { useInfraStore } from '../state/useInfraStore';

export function App() {
  const path = window.location.pathname.replace(/\/$/, '') || '/';
  const activeView = useInfraStore((store) => store.activeView);
  const knowledgeGraph = useInfraStore((store) => store.knowledgeGraph);
  const resourceCount = useInfraStore((store) => store.resources.length);
  const planChangeCount = useInfraStore((store) => store.planChanges.length);
  const loadKnowledgeFiles = useInfraStore((store) => store.loadKnowledgeFiles);
  const loadStateJson = useInfraStore((store) => store.loadStateJson);
  const loadPlanJson = useInfraStore((store) => store.loadPlanJson);

  useEffect(() => {
    initAnalytics();
    initAdsense(path);
    trackPageView(path);
  }, [path]);

  if (activeView === 'knowledge' && knowledgeGraph && knowledgeGraph.entities.length > 0) {
    return <KnowledgeDashboard />;
  }

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
        onLoadKnowledgeFiles={loadKnowledgeFiles}
        onLoadDemoKnowledge={() =>
          loadKnowledgeFiles([
            { name: 'sample.tfstate.json', contents: JSON.stringify(sampleState) },
            { name: 'sample.plan.json', contents: JSON.stringify(samplePlan) },
            {
              name: 'sample-kubernetes.yaml',
              contents:
                'apiVersion: v1\nkind: Namespace\nmetadata:\n  name: platform\n  labels:\n    owner: platform-team\n---\napiVersion: apps/v1\nkind: Deployment\nmetadata:\n  name: api\n  namespace: platform\n  labels:\n    app.kubernetes.io/instance: platform-api\n    helm.sh/chart: api-1.2.0\nspec:\n  template:\n    spec:\n      serviceAccountName: api\n      containers:\n        - name: api\n          image: example/api:latest\n          envFrom:\n            - secretRef:\n                name: api-secrets\n---\napiVersion: v1\nkind: Secret\nmetadata:\n  name: api-secrets\n  namespace: platform\n',
            },
          ])
        }
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

  if (path === '/docs/cli') {
    return <MarketingPages page="cli" />;
  }

  if (path === '/docs/github-action') {
    return <MarketingPages page="github-action" />;
  }

  if (path === '/privacy') {
    return <MarketingPages page="privacy" />;
  }

  if (path === '/changelog') {
    return <MarketingPages page="changelog" />;
  }

  return <MarketingPages page="home" />;
}

export function ToolApp() {
  const loadStateJson = useInfraStore((store) => store.loadStateJson);
  const loadPlanJson = useInfraStore((store) => store.loadPlanJson);
  const loadKnowledgeFiles = useInfraStore((store) => store.loadKnowledgeFiles);

  return (
    <StateUploader
      onLoadState={loadStateJson}
      onLoadPlan={loadPlanJson}
      onLoadKnowledgeFiles={loadKnowledgeFiles}
      onLoadDemoKnowledge={() =>
        loadKnowledgeFiles([
          { name: 'sample.tfstate.json', contents: JSON.stringify(sampleState) },
          { name: 'sample.plan.json', contents: JSON.stringify(samplePlan) },
        ])
      }
      onLoadDemoState={() => loadStateJson(sampleState)}
      onLoadDemoPlan={() => loadPlanJson(samplePlan)}
    />
  );
}
