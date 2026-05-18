import { ChangeEvent, DragEvent, useRef, useState } from 'react';
import { AlertTriangle, ArrowRight, Eye, FileJson, Github, HardDrive, LockKeyhole, Newspaper, ShieldCheck, Terminal, Upload, WifiOff } from 'lucide-react';
import { useInfraStore } from '../../state/useInfraStore';
import { cn } from '../../lib/cn';
import { trackButtonClick, trackEvent } from '../../analytics/googleAnalytics';
import type { UploadMode } from '../../state/useInfraStore';
import { currentAppVersion } from '../../content/changelog';

type StateUploaderProps = {
  onLoadState: (json: unknown) => void;
  onLoadPlan: (json: unknown) => void;
  onLoadKnowledgeFiles: (files: { name: string; contents: string }[]) => void;
  onLoadDemoKnowledge: () => void;
  onLoadDemoState: () => void;
  onLoadDemoPlan: () => void;
};

export function StateUploader({
  onLoadState,
  onLoadPlan,
  onLoadKnowledgeFiles,
  onLoadDemoKnowledge,
  onLoadDemoState,
  onLoadDemoPlan,
}: StateUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);
  const [uploadMode, setUploadMode] = useState<UploadMode>('knowledge');
  const error = useInfraStore((store) => store.error);

  async function readFiles(fileList?: FileList | null) {
    const files = [...(fileList ?? [])];
    if (!files.length) return;
    try {
      trackEvent('file_selected', { upload_mode: uploadMode });
      if (uploadMode === 'knowledge') {
        const graphFiles = await Promise.all(files.map(async (file) => ({ name: file.name, contents: await file.text() })));
        onLoadKnowledgeFiles(graphFiles);
        return;
      }

      const text = await files[0].text();
      const json = JSON.parse(text);
      if (uploadMode === 'plan') {
        onLoadPlan(json);
      } else {
        onLoadState(json);
      }
    } catch {
      useInfraStore.setState({ error: uploadMode === 'knowledge' ? 'These files could not be parsed.' : 'This file is not valid JSON.' });
    } finally {
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragActive(false);
    void readFiles(event.dataTransfer.files);
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    void readFiles(event.target.files);
  }

  return (
    <main className="min-h-screen overflow-hidden bg-background text-slate-100">
      <div className="absolute inset-0 opacity-30 [background-image:linear-gradient(#334049_1px,transparent_1px),linear-gradient(90deg,#334049_1px,transparent_1px)] [background-size:32px_32px]" />
      <section className="relative mx-auto grid min-h-screen w-full max-w-7xl items-center gap-8 px-5 py-8 lg:grid-cols-[0.9fr_1.1fr] lg:px-8">
        <div className="max-w-2xl">
          <div className="mb-5 inline-flex items-center gap-2 rounded-md border border-accent/40 bg-accent/10 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-accent">
            <ShieldCheck className="h-4 w-4" aria-hidden />
            Local-first infrastructure intelligence
          </div>
          <h1 className="text-5xl font-semibold tracking-normal text-slate-50 sm:text-6xl">InfraSpective</h1>
          <p className="mt-4 max-w-xl text-lg leading-8 text-slate-300">
            Build a normalized infrastructure graph from Terraform, Kubernetes, and Helm files without sending sensitive data anywhere.
          </p>

          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            <TrustSignal icon={<WifiOff />} title="No upload" body="Files stay in the browser session." />
            <TrustSignal icon={<HardDrive />} title="No storage" body="No localStorage or server copy." />
            <TrustSignal icon={<LockKeyhole />} title="Redacted" body="Secret-looking values are masked." />
          </div>

          <div className="mt-8 rounded-md border border-borderSoft bg-panel/85 p-4 shadow-2xl">
            <div className="flex items-center gap-3 border-b border-borderSoft pb-3">
              <Eye className="h-5 w-5 text-accent" aria-hidden />
              <div>
                <div className="text-sm font-semibold">Browser-only parsing</div>
                <div className="text-xs text-slate-400">The hosted page loads the app. Your file contents never leave this device.</div>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2 text-xs">
            <MiniMetric label="Graph" value="Unified" />
            <MiniMetric label="Sources" value="Local" />
            <MiniMetric label="Secrets" value="Masked" />
            </div>
          </div>

          <div className="mt-4 rounded-md border border-accent/35 bg-accent/10 p-4">
            <div className="flex items-start gap-3">
              <Terminal className="mt-0.5 h-5 w-5 flex-none text-accent" aria-hidden />
              <div>
                <div className="text-sm font-semibold text-slate-100">Now available for CLI and CI</div>
                <p className="mt-1 text-sm leading-6 text-slate-300">
                  Run the same sanitized analysis on a local machine or in GitHub Actions without uploading Terraform data.
                </p>
                <div className="mt-3 flex flex-wrap gap-3 text-sm">
                  <a
                    className="inline-flex items-center gap-1.5 font-semibold text-accent hover:underline"
                    href="/docs/cli"
                    onClick={() => trackButtonClick('open_cli_docs', { area: 'upload_announcement' })}
                  >
                    CLI docs
                    <ArrowRight className="h-3.5 w-3.5" aria-hidden />
                  </a>
                  <a
                    className="inline-flex items-center gap-1.5 font-semibold text-accent hover:underline"
                    href="/docs/github-action"
                    onClick={() => trackButtonClick('open_github_action_docs', { area: 'upload_announcement' })}
                  >
                    GitHub Action TBA
                    <ArrowRight className="h-3.5 w-3.5" aria-hidden />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-borderSoft bg-panel p-5 shadow-2xl">
          <div className="mb-4 grid grid-cols-3 gap-2 rounded-md border border-borderSoft bg-background p-1">
            <button
              className={cn(
                'rounded px-3 py-2 text-sm font-semibold',
                uploadMode === 'knowledge' ? 'bg-accent text-slate-950' : 'text-slate-300 hover:bg-panelMuted',
              )}
              onClick={() => {
                setUploadMode('knowledge');
                trackButtonClick('upload_mode_knowledge', { area: 'upload' });
                trackEvent('upload_mode_changed', { upload_mode: 'knowledge' });
              }}
              type="button"
            >
              Graph
            </button>
            <button
              className={cn(
                'rounded px-3 py-2 text-sm font-semibold',
                uploadMode === 'state' ? 'bg-accent text-slate-950' : 'text-slate-300 hover:bg-panelMuted',
              )}
              onClick={() => {
                setUploadMode('state');
                trackButtonClick('upload_mode_state', { area: 'upload' });
                trackEvent('upload_mode_changed', { upload_mode: 'state' });
              }}
              type="button"
            >
              State file
            </button>
            <button
              className={cn(
                'rounded px-3 py-2 text-sm font-semibold',
                uploadMode === 'plan' ? 'bg-accent text-slate-950' : 'text-slate-300 hover:bg-panelMuted',
              )}
              onClick={() => {
                setUploadMode('plan');
                trackButtonClick('upload_mode_plan', { area: 'upload' });
                trackEvent('upload_mode_changed', { upload_mode: 'plan' });
              }}
              type="button"
            >
              Plan JSON
            </button>
          </div>

          <div
            className={cn(
              'flex min-h-80 flex-col items-center justify-center rounded-md border border-dashed p-8 text-center transition',
              dragActive ? 'border-accent bg-accent/10' : 'border-borderSoft bg-panelMuted',
            )}
            onDragOver={(event) => {
              event.preventDefault();
              setDragActive(true);
            }}
            onDragLeave={() => setDragActive(false)}
            onDrop={handleDrop}
          >
            <FileJson className="mb-4 h-12 w-12 text-accent" aria-hidden />
            <h2 className="text-xl font-semibold">{headingFor(uploadMode)}</h2>
            {uploadMode === 'knowledge' ? (
              <p className="mt-2 max-w-xl text-sm leading-6 text-slate-300">
                Select one or more Terraform JSON, Kubernetes YAML, or Helm-rendered manifest files to build a local infrastructure knowledge graph.
              </p>
            ) : uploadMode === 'plan' ? (
              <div className="mt-2 max-w-xl text-sm leading-6 text-slate-300">
                <p>Generate plan JSON locally, then inspect the proposed creates, updates, deletes, and replacements here.</p>
                <pre className="mt-3 rounded-md border border-borderSoft bg-background p-3 text-left font-mono text-xs leading-5 text-slate-300">
                  terraform plan -out=plan.out{'\n'}terraform show -json plan.out &gt; plan.json
                </pre>
              </div>
            ) : (
              <p className="mt-2 max-w-xl text-sm leading-6 text-slate-300">
                Drop in a state file to map resources, dependencies, modules, outputs, and findings. Everything is parsed locally.
              </p>
            )}
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <button
                className="inline-flex items-center gap-2 rounded-md bg-accent px-4 py-2 text-sm font-semibold text-slate-950"
                onClick={() => {
                  trackButtonClick('choose_file', { area: 'upload', upload_mode: uploadMode });
                  inputRef.current?.click();
                }}
                type="button"
              >
                <Upload className="h-4 w-4" aria-hidden />
                Choose file
              </button>
              <button
                className="rounded-md border border-borderSoft px-4 py-2 text-sm font-semibold text-slate-100 hover:bg-panel"
                onClick={() => {
                  trackButtonClick(uploadMode === 'plan' ? 'load_demo_plan' : 'load_demo_state', {
                    area: 'upload',
                    upload_mode: uploadMode,
                  });
                  trackEvent('demo_loaded', { upload_mode: uploadMode });
                  if (uploadMode === 'knowledge') {
                    onLoadDemoKnowledge();
                  } else if (uploadMode === 'plan') {
                    onLoadDemoPlan();
                  } else {
                    onLoadDemoState();
                  }
                }}
                type="button"
              >
                {demoLabelFor(uploadMode)}
              </button>
            </div>
            <input
              ref={inputRef}
              className="hidden"
              type="file"
              multiple={uploadMode === 'knowledge'}
              accept=".json,.tfstate,.yaml,.yml,application/json,text/yaml,application/yaml"
              onChange={handleFileChange}
            />
          </div>

          {error ? (
            <div className="mt-4 flex items-start gap-3 rounded-md border border-danger/50 bg-danger/10 p-3 text-sm text-red-100">
              <AlertTriangle className="mt-0.5 h-4 w-4 flex-none text-danger" aria-hidden />
              <span>{error}</span>
            </div>
          ) : null}

          <div className="mt-4 flex flex-wrap items-center justify-center gap-x-3 gap-y-2 text-center text-xs text-slate-500">
            <span className="inline-flex items-center gap-1.5">
              Built by{' '}
              <a
                className="inline-flex items-center gap-1 text-accent hover:underline"
                href="https://github.com/Poss111"
                rel="noreferrer"
                target="_blank"
              >
                <Github className="h-3.5 w-3.5" aria-hidden />
                Poss111
              </a>
            </span>
            <a
              className="inline-flex items-center gap-1 text-accent hover:underline"
              href="/changelog"
              onClick={() => trackButtonClick('open_changelog', { area: 'upload' })}
            >
              <Newspaper className="h-3.5 w-3.5" aria-hidden />
              What's new in {currentAppVersion}
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}

function headingFor(uploadMode: UploadMode): string {
  if (uploadMode === 'knowledge') return 'Build an infrastructure graph';
  if (uploadMode === 'plan') return 'Upload Terraform plan JSON';
  return 'Upload terraform.tfstate';
}

function demoLabelFor(uploadMode: UploadMode): string {
  if (uploadMode === 'knowledge') return 'Load demo graph';
  if (uploadMode === 'plan') return 'Load demo plan';
  return 'Load demo state';
}

function TrustSignal({ icon, title, body }: { icon: React.ReactElement; title: string; body: string }) {
  return (
    <div className="rounded-md border border-borderSoft bg-panel/80 p-3">
      <div className="mb-2 text-accent">{icon}</div>
      <div className="text-sm font-semibold text-slate-100">{title}</div>
      <div className="mt-1 text-xs leading-5 text-slate-400">{body}</div>
    </div>
  );
}

function MiniMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-borderSoft bg-background p-3">
      <div className="text-xs uppercase tracking-wide text-slate-500">{label}</div>
      <div className="mt-1 text-sm font-semibold text-slate-200">{value}</div>
    </div>
  );
}
