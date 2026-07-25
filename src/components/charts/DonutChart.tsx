export interface DonutSegment {
  label: string;
  value: number;
  color: string;
}

interface DonutChartProps {
  data: DonutSegment[];
  size?: number;
  thickness?: number;
  centerValue?: string;
  centerLabel?: string;
}

export function DonutChart({
  data,
  size = 168,
  thickness = 18,
  centerValue,
  centerLabel,
}: DonutChartProps) {
  const total = data.reduce((sum, segment) => sum + segment.value, 0);
  const radius = (size - thickness) / 2;
  const circumference = 2 * Math.PI * radius;
  const center = size / 2;
  let consumed = 0;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img">
      <g transform={`rotate(-90 ${center} ${center})`}>
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="var(--color-surface-2)"
          strokeWidth={thickness}
        />
        {total > 0 &&
          data.map((segment, index) => {
            const length = (segment.value / total) * circumference;
            const element = (
              <circle
                key={index}
                cx={center}
                cy={center}
                r={radius}
                fill="none"
                stroke={segment.color}
                strokeWidth={thickness}
                strokeDasharray={`${length} ${circumference - length}`}
                strokeDashoffset={-consumed}
              />
            );
            consumed += length;
            return element;
          })}
      </g>
      {centerValue ? (
        <text
          x={center}
          y={centerLabel ? center - 2 : center + 6}
          textAnchor="middle"
          className="fill-fg"
          style={{ fontSize: 26, fontWeight: 600 }}
        >
          {centerValue}
        </text>
      ) : null}
      {centerLabel ? (
        <text
          x={center}
          y={center + 18}
          textAnchor="middle"
          className="fill-muted"
          style={{ fontSize: 11, letterSpacing: 0.4 }}
        >
          {centerLabel}
        </text>
      ) : null}
    </svg>
  );
}
