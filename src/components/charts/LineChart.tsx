export interface LinePoint {
  label: string;
  value: number;
}

export interface LineSeries {
  name: string;
  color: string;
  points: LinePoint[];
}

interface LineChartProps {
  series: LineSeries[];
  height?: number;
  suffix?: string;
  maxValue?: number;
  emptyLabel: string;
}

const PADDING_X = 44;
const PADDING_TOP = 12;
const PADDING_BOTTOM = 26;
const VIEW_WIDTH = 720;
const TICKS = 4;

function formatTick(value: number): string {
  if (Math.abs(value) >= 1000) {
    return `${Math.round(value / 100) / 10}k`;
  }
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

export function LineChart({
  series,
  height = 220,
  suffix = '',
  maxValue,
  emptyLabel,
}: LineChartProps) {
  const length = Math.max(0, ...series.map((line) => line.points.length));

  if (length === 0) {
    return (
      <div
        className="flex items-center justify-center rounded-lg border border-dashed border-border text-xs text-faint"
        style={{ height }}
      >
        {emptyLabel}
      </div>
    );
  }

  const rawMax = Math.max(
    1,
    maxValue ?? Math.max(...series.flatMap((line) => line.points.map((point) => point.value))),
  );
  const step = Math.pow(10, Math.floor(Math.log10(rawMax)));
  const top = Math.ceil(rawMax / step) * step;

  const plotWidth = VIEW_WIDTH - PADDING_X - 12;
  const plotHeight = height - PADDING_TOP - PADDING_BOTTOM;
  const xOf = (index: number) =>
    PADDING_X + (length === 1 ? plotWidth / 2 : (index / (length - 1)) * plotWidth);
  const yOf = (value: number) => PADDING_TOP + plotHeight - (value / top) * plotHeight;

  const labels = (series.find((line) => line.points.length === length) ?? series[0]).points.map(
    (point) => point.label,
  );
  const labelStride = Math.max(1, Math.ceil(length / 7));

  return (
    <svg
      viewBox={`0 0 ${VIEW_WIDTH} ${height}`}
      width="100%"
      height={height}
      role="img"
      preserveAspectRatio="none"
    >
      {Array.from({ length: TICKS + 1 }, (_, index) => {
        const value = (top / TICKS) * index;
        const y = yOf(value);
        return (
          <g key={index}>
            <line
              x1={PADDING_X}
              y1={y}
              x2={VIEW_WIDTH - 12}
              y2={y}
              stroke="var(--color-border)"
              strokeWidth={1}
            />
            <text
              x={PADDING_X - 8}
              y={y + 3.5}
              textAnchor="end"
              className="fill-faint"
              style={{ fontSize: 10 }}
            >
              {formatTick(value)}
              {suffix}
            </text>
          </g>
        );
      })}

      {labels.map((label, index) =>
        index % labelStride === 0 || index === length - 1 ? (
          <text
            key={label + index}
            x={xOf(index)}
            y={height - 8}
            textAnchor="middle"
            className="fill-faint"
            style={{ fontSize: 10 }}
          >
            {label}
          </text>
        ) : null,
      )}

      {series.map((line) => {
        if (line.points.length === 0) {
          return null;
        }
        const path = line.points
          .map((point, index) => `${index === 0 ? 'M' : 'L'}${xOf(index)},${yOf(point.value)}`)
          .join(' ');
        const area = `${path} L${xOf(line.points.length - 1)},${yOf(0)} L${xOf(0)},${yOf(0)} Z`;
        return (
          <g key={line.name}>
            <path d={area} fill={line.color} opacity={0.1} />
            <path
              d={path}
              fill="none"
              stroke={line.color}
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {line.points.map((point, index) => (
              <circle
                key={point.label + index}
                cx={xOf(index)}
                cy={yOf(point.value)}
                r={2.5}
                fill={line.color}
              >
                <title>{`${line.name} · ${point.label}: ${point.value}${suffix}`}</title>
              </circle>
            ))}
          </g>
        );
      })}
    </svg>
  );
}
