import { useState, type ReactNode } from 'react';
import { Bug, Check, Copy, Play, ShieldAlert, Trash2 } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { FIELD_INPUT_CLASS, FormField } from '@/components/common/FormField';
import { Switch } from '@/components/common/Switch';
import { GateStatus } from '@/components/common/GateStatus';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import {
  Skeleton,
  SkeletonCard,
  SkeletonStat,
  SkeletonTable,
  SkeletonText,
} from '@/components/common/Skeleton';
import { DonutChart } from '@/components/charts/DonutChart';
import { BarList } from '@/components/charts/BarList';
import { LineChart } from '@/components/charts/LineChart';
import { useToast } from '@/lib/toast/toast-context';
import type { ToastTone } from '@/lib/toast/toast-context';

interface SpecProps {
  name: string;
  file: string;
  usedBy: string;
  children: ReactNode;
}

function Spec({ name, file, usedBy, children }: SpecProps) {
  const [copied, setCopied] = useState(false);

  async function copyPath() {
    try {
      await navigator.clipboard.writeText(file);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1400);
    } catch {
      setCopied(false);
    }
  }

  return (
    <section className="overflow-hidden rounded-xl border border-border bg-surface">
      <header className="flex flex-wrap items-center gap-x-3 gap-y-1 border-b border-border px-5 py-3.5">
        <h2 className="text-sm font-semibold text-fg">{name}</h2>
        <button
          type="button"
          onClick={() => void copyPath()}
          title={file}
          className="inline-flex items-center gap-1.5 rounded-md bg-surface-2 px-2 py-0.5 font-mono text-[10px] text-muted transition-colors hover:text-fg"
        >
          {copied ? <Check size={10} className="text-success" /> : <Copy size={10} />}
          {file}
        </button>
        <span className="ml-auto font-mono text-[10px] uppercase tracking-[0.14em] text-faint">
          {usedBy}
        </span>
      </header>
      <div className="px-5 py-6">{children}</div>
    </section>
  );
}

function Row({ children }: { children: ReactNode }) {
  return <div className="flex flex-wrap items-center gap-3">{children}</div>;
}

const TONES: ToastTone[] = ['success', 'info', 'warning', 'error'];

const SEVERITY_SWATCHES = [
  { label: 'blocker', dot: 'bg-blocker', text: 'text-blocker' },
  { label: 'critical', dot: 'bg-critical', text: 'text-critical' },
  { label: 'major', dot: 'bg-major', text: 'text-major' },
  { label: 'minor', dot: 'bg-minor', text: 'text-minor' },
];

export function ComponentsPage() {
  const { showToast } = useToast();
  const [switchOn, setSwitchOn] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [text, setText] = useState('');

  return (
    <div className="space-y-4">
      <PageHeader
        title="Component library"
        subtitle="ทุกชิ้นส่วนที่ใช้ซ้ำในระบบ พร้อม path ของไฟล์ กดที่ path เพื่อคัดลอก"
      />

      <Spec name="Buttons" file="ปุ่มเขียนด้วย Tailwind ตรงที่ใช้" usedBy="ทุกหน้า">
        <Row>
          <button
            type="button"
            className="inline-flex h-9 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-fg transition hover:bg-primary-hover active:scale-[0.99]"
          >
            <Play size={15} />
            Primary
          </button>
          <button
            type="button"
            className="inline-flex h-9 items-center rounded-lg border border-border px-4 text-sm font-medium text-fg transition-colors hover:bg-surface-2"
          >
            Secondary
          </button>
          <button
            type="button"
            className="inline-flex h-9 items-center gap-2 rounded-lg bg-danger px-4 text-sm font-semibold text-white transition hover:brightness-110"
          >
            <Trash2 size={15} />
            Danger
          </button>
          <button
            type="button"
            disabled
            className="inline-flex h-9 items-center rounded-lg bg-primary px-4 text-sm font-semibold text-primary-fg opacity-60"
          >
            Disabled
          </button>
        </Row>
      </Spec>

      <Spec name="Badges" file="Tailwind utility" usedBy="Repositories / Issue / Scan">
        <Row>
          <span className="rounded-full bg-success/12 px-2.5 py-1 text-[11px] font-medium text-success">
            Active
          </span>
          <span className="rounded-full bg-primary-subtle px-2.5 py-1 text-[11px] font-medium text-primary">
            Analyzing
          </span>
          <span className="rounded-full bg-danger/12 px-2.5 py-1 text-[11px] font-medium text-danger">
            Error
          </span>
          <span className="rounded-full bg-warning/12 px-2.5 py-1 text-[11px] font-medium text-warning">
            In progress
          </span>
        </Row>
        <Row>
          {SEVERITY_SWATCHES.map((swatch) => (
            <span key={swatch.label} className="flex items-center gap-1.5 text-sm">
              <span className={`h-2 w-2 rounded-full ${swatch.dot}`} />
              <span className={`font-medium ${swatch.text}`}>{swatch.label}</span>
            </span>
          ))}
        </Row>
      </Spec>

      <Spec
        name="GateStatus"
        file="components/common/GateStatus.tsx"
        usedBy="Scan Result / Log Viewer"
      >
        <Row>
          <GateStatus tone="pass" namespace="SCAN_RESULT" />
          <GateStatus tone="warning" namespace="SCAN_RESULT" />
          <GateStatus tone="fail" namespace="SCAN_RESULT" />
          <GateStatus tone="pending" namespace="SCAN_RESULT" />
        </Row>
      </Spec>

      <Spec
        name="FormField + Switch"
        file="components/common/FormField.tsx · Switch.tsx"
        usedBy="ทุกฟอร์ม"
      >
        <div className="grid max-w-2xl gap-4 sm:grid-cols-2">
          <FormField id="demoField" label="Normal">
            <input
              id="demoField"
              className={FIELD_INPUT_CLASS}
              value={text}
              onChange={(event) => setText(event.target.value)}
              placeholder="พิมพ์อะไรก็ได้"
            />
          </FormField>
          <FormField id="demoError" label="With error" error="ต้องกรอกช่องนี้">
            <input id="demoError" className={FIELD_INPUT_CLASS} defaultValue="" />
          </FormField>
        </div>
        <div className="mt-4">
          <Switch
            id="demoSwitch"
            checked={switchOn}
            onChange={setSwitchOn}
            label="เปิดใช้งาน"
            description="สลับสถานะเพื่อดู transition"
          />
        </div>
      </Spec>

      <Spec name="Toast" file="lib/toast/ToastProvider.tsx" usedBy="ทุกหน้าที่มี action">
        <Row>
          {TONES.map((tone) => (
            <button
              key={tone}
              type="button"
              onClick={() =>
                showToast({
                  tone,
                  title: `Toast ${tone}`,
                  description: 'กดปุ่มเพื่อดูตัวอย่าง',
                })
              }
              className="inline-flex h-9 items-center rounded-lg border border-border px-4 text-sm font-medium text-fg transition-colors hover:bg-surface-2"
            >
              {tone}
            </button>
          ))}
        </Row>
      </Spec>

      <Spec
        name="ConfirmDialog"
        file="components/common/ConfirmDialog.tsx"
        usedBy="Logout / Delete repository"
      >
        <Row>
          <button
            type="button"
            onClick={() => setShowDialog(true)}
            className="inline-flex h-9 items-center rounded-lg border border-border px-4 text-sm font-medium text-fg transition-colors hover:bg-surface-2"
          >
            เปิด dialog
          </button>
          <span className="text-xs text-muted">
            render ผ่าน Portal ที่ body · ล็อก scroll · กด Escape ปิดได้
          </span>
        </Row>
      </Spec>

      <Spec
        name="Skeleton"
        file="components/common/Skeleton.tsx"
        usedBy="Repositories / Issue / Scan History"
      >
        <div className="grid gap-5 lg:grid-cols-2">
          <div>
            <p className="mb-2 font-mono text-[10px] uppercase tracking-wide text-faint">
              SkeletonStat
            </p>
            <div className="grid grid-cols-2 gap-3">
              <SkeletonStat />
              <SkeletonStat />
            </div>
          </div>
          <div>
            <p className="mb-2 font-mono text-[10px] uppercase tracking-wide text-faint">
              SkeletonCard
            </p>
            <SkeletonCard />
          </div>
          <div>
            <p className="mb-2 font-mono text-[10px] uppercase tracking-wide text-faint">
              SkeletonText
            </p>
            <SkeletonText lines={4} />
            <p className="mb-2 mt-5 font-mono text-[10px] uppercase tracking-wide text-faint">
              Skeleton
            </p>
            <Row>
              <Skeleton className="h-9 w-24 rounded-lg" />
              <Skeleton className="h-9 w-9 rounded-full" />
            </Row>
          </div>
          <div>
            <p className="mb-2 font-mono text-[10px] uppercase tracking-wide text-faint">
              SkeletonTable
            </p>
            <SkeletonTable rows={3} columns={4} />
          </div>
        </div>
      </Spec>

      <Spec name="Charts" file="components/charts/" usedBy="Dashboard / Security / Technical Debt">
        <div className="grid gap-6 lg:grid-cols-3">
          <div>
            <p className="mb-3 font-mono text-[10px] uppercase tracking-wide text-faint">
              DonutChart
            </p>
            <DonutChart
              data={[
                { label: 'Angular', value: 2, color: 'var(--color-primary)' },
                {
                  label: 'Spring Boot',
                  value: 10,
                  color: 'var(--color-accent)',
                },
              ]}
              centerValue="12"
              centerLabel="Projects"
            />
          </div>
          <div>
            <p className="mb-3 font-mono text-[10px] uppercase tracking-wide text-faint">BarList</p>
            <BarList
              items={[
                { label: 'payment-service', value: 42, display: '42' },
                { label: 'web-portal', value: 28, display: '28' },
                { label: 'auth-service', value: 11, display: '11' },
              ]}
              emptyLabel="ไม่มีข้อมูล"
            />
          </div>
          <div>
            <p className="mb-3 font-mono text-[10px] uppercase tracking-wide text-faint">
              LineChart
            </p>
            <LineChart
              height={160}
              suffix="%"
              maxValue={100}
              series={[
                {
                  name: 'Coverage',
                  color: 'var(--color-primary)',
                  points: [
                    { label: '1/7', value: 20 },
                    { label: '8/7', value: 44 },
                    { label: '15/7', value: 38 },
                    { label: '22/7', value: 61 },
                    { label: '26/7', value: 72 },
                  ],
                },
              ]}
              emptyLabel="ไม่มีข้อมูล"
            />
          </div>
        </div>
      </Spec>

      <Spec name="Metrics row" file="pages/RepositoriesPage.tsx" usedBy="Repository card">
        <Row>
          <span className="flex items-center gap-1.5">
            <Bug size={14} className="text-blocker" />
            <span className="text-sm font-medium text-fg">12</span>
          </span>
          <span className="flex items-center gap-1.5">
            <ShieldAlert size={14} className="text-major" />
            <span className="text-sm font-medium text-fg">3</span>
          </span>
          <span className="ml-4 text-xs text-muted">
            ค่าที่ยังไม่รู้ผลใช้ <span className="font-mono text-fg">—</span> ไม่ใช่{' '}
            <span className="font-mono text-danger">0</span>
          </span>
        </Row>
      </Spec>

      <Spec name="Design tokens" file="styles/index.css" usedBy="ทั้งระบบ">
        <div className="flex flex-wrap gap-3">
          {[
            ['bg-bg', 'bg'],
            ['bg-surface', 'surface'],
            ['bg-surface-2', 'surface-2'],
            ['bg-primary', 'primary'],
            ['bg-accent', 'accent'],
            ['bg-success', 'success'],
            ['bg-warning', 'warning'],
            ['bg-danger', 'danger'],
          ].map(([cls, label]) => (
            <div key={label} className="text-center">
              <div className={`h-12 w-20 rounded-lg border border-border ${cls}`} />
              <p className="mt-1.5 font-mono text-[10px] text-faint">{label}</p>
            </div>
          ))}
        </div>
      </Spec>

      {showDialog ? (
        <ConfirmDialog
          tone="danger"
          title="ตัวอย่าง dialog"
          message="กด Escape หรือคลิกพื้นหลังก็ปิดได้"
          confirmLabel="ยืนยัน"
          onConfirm={() => setShowDialog(false)}
          onCancel={() => setShowDialog(false)}
        />
      ) : null}
    </div>
  );
}
