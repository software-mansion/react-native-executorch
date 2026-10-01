import { useMemo, useState } from 'react';
import {
  DEVICES,
  METRICS,
  benchmarkRows,
  type BenchmarkRow,
  type Metric,
  type MetricId,
} from '@site/src/data/benchmarks';
import styles from './styles.module.css';

const BACKEND_ORDER = ['xnnpack', 'coreml', 'vulkan', 'mlx'];

const BACKEND_CLASS: Record<string, string> = {
  xnnpack: styles.barXnnpack,
  coreml: styles.barCoreml,
  vulkan: styles.barVulkan,
  mlx: styles.barMlx,
};

const PRECISION_RANK = [
  'fp32',
  'fp16',
  'int8',
  'int4',
  '8da4w',
  '8da8w',
  'spinquant',
  'bf16',
  'default',
];

const BACKEND_DISPLAY: Record<string, string> = {
  xnnpack: 'XNNPACK (CPU)',
  coreml: 'Core ML (NPU/GPU)',
  vulkan: 'Vulkan (GPU)',
  mlx: 'MLX (Apple GPU)',
};

const BACKEND_NAMES: Record<string, string> = {
  xnnpack: 'XNNPACK',
  coreml: 'Core ML',
  vulkan: 'Vulkan',
  mlx: 'MLX',
};

type ChartGroup = {
  id: string;
  label: string;
  bars: BenchmarkRow[];
};

const WIDTH = 960;
const HEIGHT = 430;
const PADDING = { top: 34, right: 16, bottom: 64, left: 78 };

function formatValue(value: number, unit: Metric['unit']): string {
  if (unit === '%') return `${Math.round(value)}`;
  if (unit === 'MB') {
    if (value >= 1000) return `${Math.round(value).toLocaleString('en-US')}`;
    if (value >= 10) return `${Math.round(value)}`;
    if (value >= 1) return value.toFixed(1);
    return value.toFixed(2);
  }
  if (unit === 'tok/s') {
    return value >= 10 ? value.toFixed(1) : value.toFixed(2);
  }
  if (value >= 1000) return `${Math.round(value).toLocaleString('en-US')}`;
  if (value >= 100) return `${Math.round(value)}`;
  if (value >= 10) return value.toFixed(1).replace(/\.0$/, '');
  return value.toFixed(1);
}

function formatTooltipValue(value: number, unit: Metric['unit']): string {
  if (unit === '%') {
    return `${Number.isInteger(value) ? value : value.toFixed(1)}%`;
  }
  let numStr: string;
  if (unit === 'tok/s') {
    numStr = value >= 10 ? value.toFixed(1) : value.toFixed(2);
  } else if (unit === 'MB') {
    if (value >= 100) {
      numStr = Math.round(value).toLocaleString('en-US');
    } else if (value >= 10) {
      numStr = value.toFixed(1).replace(/\.0$/, '');
    } else if (value >= 1) {
      numStr = value.toFixed(1);
    } else {
      numStr = value.toFixed(2);
    }
  } else {
    // ms
    if (value >= 1000) {
      numStr = value.toLocaleString('en-US', { maximumFractionDigits: 1 });
    } else if (value >= 10) {
      numStr = value.toFixed(1).replace(/\.0$/, '');
    } else if (value >= 1) {
      numStr = value.toFixed(1);
    } else {
      numStr = value.toFixed(2);
    }
  }
  return `${numStr}\u00A0${unit}`;
}

function niceCeil(value: number): number {
  if (value <= 0) return 1;
  const exponent = Math.floor(Math.log10(value));
  const power = 10 ** exponent;
  const fraction = value / power;
  const nice =
    fraction <= 1 ? 1 : fraction <= 2 ? 2 : fraction <= 2.5 ? 2.5 : fraction <= 5 ? 5 : 10;
  return nice * power;
}

function rankPrecision(precision: string): number {
  const index = PRECISION_RANK.indexOf(precision);
  return index === -1 ? PRECISION_RANK.length : index;
}

type TooltipState = {
  row: BenchmarkRow;
  label: string;
  x: number;
  y: number;
};

type Props = {
  task: string;
};

export default function BenchmarkChart({ task }: Props) {
  const rows = useMemo(() => benchmarkRows.filter((row) => row.task === task), [task]);
  const models = useMemo<string[]>(() => {
    const names = new Set(rows.map((row) => row.model));
    return [...names].sort();
  }, [rows]);

  const [model, setModel] = useState<string>(models[0] ?? '');
  const [selectedMetricId, setSelectedMetricId] = useState<MetricId | null>(null);
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);

  const availableMetrics = useMemo(() => {
    return METRICS.filter((entry) =>
      rows.some((row) => {
        const val = row[entry.id];
        return typeof val === 'number' && Number.isFinite(val) && val > 0;
      })
    );
  }, [rows]);

  const defaultMetricId = useMemo(() => {
    if (task === 'llm' && availableMetrics.some((m) => m.id === 'tokensPerSecond')) {
      return 'tokensPerSecond';
    }
    return availableMetrics[0]?.id ?? 'meanMs';
  }, [task, availableMetrics]);

  const activeMetricId =
    selectedMetricId && availableMetrics.some((m) => m.id === selectedMetricId)
      ? selectedMetricId
      : defaultMetricId;

  const metric =
    availableMetrics.find((entry) => entry.id === activeMetricId) ??
    availableMetrics[0] ??
    METRICS[0];

  const isSizeMetric = activeMetricId === 'sizeMb';

  const groups = useMemo<ChartGroup[]>(() => {
    const modelRows = rows.filter((row) => row.model === model);

    if (isSizeMetric) {
      const modelBackends = BACKEND_ORDER.filter((backend) =>
        modelRows.some((row) => row.backend === backend)
      );

      return modelBackends.map((backend) => {
        const backendRows = modelRows.filter((row) => row.backend === backend);
        const precisions = [...new Set(backendRows.map((r) => r.precision))].sort(
          (a, b) => rankPrecision(a) - rankPrecision(b)
        );

        const bars: BenchmarkRow[] = precisions.map((precision) => {
          const variantRows = backendRows.filter((r) => r.precision === precision);
          const sizes = variantRows.map((r) => r.sizeMb).sort((a, b) => a - b);
          const mid = Math.floor(sizes.length / 2);
          const canonicalSize =
            sizes.length % 2 !== 0 ? sizes[mid] : Math.round((sizes[mid - 1] + sizes[mid]) / 2);

          return {
            ...variantRows[0],
            sizeMb: canonicalSize,
          };
        });

        return {
          id: backend,
          label: BACKEND_NAMES[backend] ?? backend,
          bars,
        };
      });
    }

    return DEVICES.map((device) => {
      const bars = modelRows
        .filter((row) => row.device === device.id)
        .sort((a, b) => {
          const backend = BACKEND_ORDER.indexOf(a.backend) - BACKEND_ORDER.indexOf(b.backend);
          if (backend !== 0) return backend;
          return rankPrecision(a.precision) - rankPrecision(b.precision);
        });
      return { id: device.id, label: device.shortName, bars };
    });
  }, [rows, model, isSizeMetric]);

  const maxValue = Math.max(
    1,
    ...groups.flatMap((group) => group.bars.map((bar) => bar[metric.id] as number))
  );
  const step = niceCeil(maxValue / 4);
  const tickCount = Math.ceil(maxValue / step);
  const scaleMax = step * tickCount;

  const plotWidth = WIDTH - PADDING.left - PADDING.right;
  const plotHeight = HEIGHT - PADDING.top - PADDING.bottom;
  const groupCount = Math.max(groups.length, 1);
  const groupWidth = plotWidth / groupCount;

  const yOf = (value: number) => PADDING.top + plotHeight * (1 - value / scaleMax);

  return (
    <div className={styles.wrapper}>
      <div className={styles.controls}>
        <label className={styles.field}>
          <span className={styles.fieldLabel}>Model</span>
          <select
            className={styles.select}
            value={model}
            onChange={(event) => {
              setModel(event.target.value);
              setTooltip(null);
            }}
          >
            {models.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </label>
        <div className={styles.metricGroup} role="group" aria-label="Metric">
          {availableMetrics.map((entry) => (
            <div key={entry.id} className={styles.metricButtonWrapper}>
              <button
                type="button"
                className={
                  entry.id === activeMetricId
                    ? `${styles.metricButton} ${styles.metricButtonActive}`
                    : styles.metricButton
                }
                aria-pressed={entry.id === activeMetricId}
                onClick={(e) => {
                  setSelectedMetricId(entry.id);
                  setTooltip(null);
                  e.currentTarget.blur();
                }}
              >
                {entry.label}
              </button>
              <div className={styles.metricTooltip} role="tooltip">
                <strong>{entry.label}</strong>
                <span className={styles.metricTooltipDesc}>{entry.description}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className={styles.plotOuter}>
        <svg
          key={`${model}-${activeMetricId}`}
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          className={styles.svg}
          role="img"
          aria-label={`${model} — ${metric.label} per ${
            isSizeMetric ? 'backend and precision' : 'device and backend'
          }`}
        >
          {[...Array(tickCount + 1)].map((_, index) => {
            const value = step * index;
            const y = yOf(value);
            return (
              <g key={index}>
                <line
                  x1={PADDING.left}
                  x2={WIDTH - PADDING.right}
                  y1={y}
                  y2={y}
                  className={styles.gridLine}
                />
                <text
                  x={PADDING.left - 10}
                  y={y}
                  className={styles.tickLabel}
                  textAnchor="end"
                  dominantBaseline="middle"
                >
                  {formatValue(value, metric.unit)}
                  {metric.unit === '%' ? '%' : ` ${metric.unit}`}
                </text>
              </g>
            );
          })}

          {groups.map((group, groupIndex) => {
            const center = PADDING.left + groupWidth * (groupIndex + 0.5);
            const barCount = Math.max(group.bars.length, 1);
            const barWidth = Math.min(
              isSizeMetric ? 40 : 32,
              (groupWidth * (barCount > 2 ? 0.76 : 0.64)) / barCount
            );
            const clusterWidth = barWidth * group.bars.length;
            return (
              <g key={group.id}>
                {group.bars.length === 0 && (
                  <text
                    x={center}
                    y={PADDING.top + plotHeight / 2}
                    className={styles.missingLabel}
                    textAnchor="middle"
                  >
                    not measured
                  </text>
                )}
                {group.bars.map((bar, barIndex) => {
                  const value = bar[metric.id] as number;
                  const x = center - clusterWidth / 2 + barWidth * barIndex;
                  const y = yOf(value);
                  const height = PADDING.top + plotHeight - y;
                  const label = `${formatValue(value, metric.unit)}${
                    metric.unit === '%' ? '%' : ''
                  }`;

                  const labelY = y - 5;

                  return (
                    <g
                      key={`${bar.backend}-${bar.precision}`}
                      className={styles.barGroup}
                      onMouseEnter={() =>
                        setTooltip({
                          row: bar,
                          label: isSizeMetric
                            ? `${model} · ${BACKEND_NAMES[bar.backend] ?? bar.backend} · ${
                                bar.precision
                              }`
                            : `${group.label} · ${
                                BACKEND_NAMES[bar.backend] ?? bar.backend
                              } · ${bar.precision}`,
                          x: ((x + barWidth / 2) / WIDTH) * 100,
                          y: (y / HEIGHT) * 100,
                        })
                      }
                      onMouseLeave={() => setTooltip(null)}
                    >
                      <rect
                        x={x}
                        y={y}
                        width={barWidth}
                        height={height}
                        rx={3}
                        className={`${styles.bar} ${
                          BACKEND_CLASS[bar.backend] ?? styles.barXnnpack
                        }`}
                      />
                      <text
                        x={x + barWidth / 2}
                        y={labelY}
                        className={styles.valueLabel}
                        textAnchor="middle"
                      >
                        {label}
                      </text>
                      <text
                        x={x + barWidth / 2}
                        y={PADDING.top + plotHeight + 18}
                        className={styles.precisionLabel}
                        textAnchor="middle"
                      >
                        {bar.precision}
                      </text>
                      <rect
                        x={x}
                        y={PADDING.top}
                        width={barWidth}
                        height={plotHeight}
                        className={styles.hoverTarget}
                      />
                    </g>
                  );
                })}
                <text
                  x={center}
                  y={PADDING.top + plotHeight + 42}
                  className={styles.deviceLabel}
                  textAnchor="middle"
                >
                  {group.label}
                </text>
              </g>
            );
          })}
        </svg>
        {tooltip &&
          (() => {
            const translateX = tooltip.x < 18 ? '-15%' : tooltip.x > 82 ? '-85%' : '-50%';
            const translateY = tooltip.y < 35 ? '8px' : 'calc(-100% - 8px)';
            return (
              <div
                className={styles.tooltip}
                style={{
                  left: `${tooltip.x}%`,
                  top: tooltip.y < 35 ? `${tooltip.y + 6}%` : `${tooltip.y}%`,
                  transform: `translate(${translateX}, ${translateY})`,
                }}
              >
                <div className={styles.tooltipTitle}>{tooltip.label}</div>
                {isSizeMetric ? (
                  <table className={styles.tooltipTable}>
                    <tbody>
                      <tr>
                        <td>Backend</td>
                        <td>{BACKEND_DISPLAY[tooltip.row.backend] ?? tooltip.row.backend}</td>
                      </tr>
                      <tr>
                        <td>Precision</td>
                        <td>{tooltip.row.precision}</td>
                      </tr>
                      <tr>
                        <td>Model Size</td>
                        <td>{formatTooltipValue(tooltip.row.sizeMb, 'MB')}</td>
                      </tr>
                    </tbody>
                  </table>
                ) : (
                  <table className={styles.tooltipTable}>
                    <tbody>
                      {availableMetrics.map((entry) => {
                        const val = tooltip.row[entry.id];
                        if (typeof val !== 'number') return null;
                        return (
                          <tr key={entry.id}>
                            <td>{entry.label}</td>
                            <td>{formatTooltipValue(val, entry.unit)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            );
          })()}
      </div>

      <div className={styles.footer}>
        <div className={styles.legendRow}>
          <div className={styles.legendBackends}>
            <span className={styles.legendLabel}>Backends</span>
            <div className={styles.legendBadges}>
              {BACKEND_ORDER.filter((backend) =>
                rows.some((row) => row.model === model && row.backend === backend)
              ).map((backend) => (
                <span key={backend} className={styles.legendBadge}>
                  <span className={`${styles.legendDot} ${BACKEND_CLASS[backend]}`} />
                  <span>{BACKEND_DISPLAY[backend] ?? backend}</span>
                </span>
              ))}
            </div>
          </div>
          <div className={styles.legendDirection}>
            {metric.lowerIsBetter ? '↓ Lower is better' : '↑ Higher is better'}
          </div>
        </div>

        <div className={styles.legendDescriptionRow}>
          <p className={styles.metricSummary}>
            <span className={styles.metricSummaryName}>{metric.label}:</span>{' '}
            <span className={styles.metricSummaryText}>{metric.description}</span>
          </p>
          <span className={styles.precisionNote}>
            {isSizeMetric
              ? 'Model size depends on backend and precision, independent of device'
              : 'Labels below bars indicate model precision'}
          </span>
        </div>
      </div>
    </div>
  );
}
