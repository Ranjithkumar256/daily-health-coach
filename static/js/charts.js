/**
 * Daily Health Coach - Responsive SVG Trend Charts
 * Pure SVG rendering for 7-day lifestyle analytics without heavy third-party dependencies.
 */

class HealthCharts {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.currentMetric = 'health_score';
    this.data = [];
  }

  setData(historyData) {
    this.data = historyData || [];
    this.render();
  }

  setMetric(metric) {
    this.currentMetric = metric;
    this.render();
  }

  render() {
    if (!this.container || !this.data || this.data.length === 0) return;

    const width = this.container.clientWidth || 580;
    const height = 180;
    const padding = { top: 25, right: 20, bottom: 35, left: 45 };
    const chartW = width - padding.left - padding.right;
    const chartH = height - padding.top - padding.bottom;

    let metricKey = 'health_score';
    let labelUnit = 'pts';
    let targetVal = 100;
    let strokeColor = '#10b981';
    let fillColor = 'rgba(16, 185, 129, 0.2)';

    if (this.currentMetric === 'steps') {
      metricKey = 'steps';
      labelUnit = 'steps';
      targetVal = 10000;
      strokeColor = '#38bdf8';
      fillColor = 'rgba(56, 189, 248, 0.25)';
    } else if (this.currentMetric === 'water_ml') {
      metricKey = 'water_ml';
      labelUnit = 'ml';
      targetVal = 2500;
      strokeColor = '#00b4d8';
      fillColor = 'rgba(0, 180, 216, 0.25)';
    } else if (this.currentMetric === 'calories') {
      metricKey = 'calories';
      labelUnit = 'kcal';
      targetVal = 2100;
      strokeColor = '#f59e0b';
      fillColor = 'rgba(245, 158, 11, 0.25)';
    }

    const values = this.data.map(d => d[metricKey] || 0);
    const maxVal = Math.max(targetVal, ...values) * 1.15;

    const getX = (index) => padding.left + (index / (this.data.length - 1 || 1)) * chartW;
    const getY = (val) => padding.top + chartH - (val / maxVal) * chartH;

    // Build SVG
    let svg = `
      <svg width="100%" height="${height}" viewBox="0 0 ${width} ${height}" preserveAspectRatio="none" style="overflow: visible;">
        <defs>
          <linearGradient id="chartAreaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="${strokeColor}" stop-opacity="0.35" />
            <stop offset="100%" stop-color="${strokeColor}" stop-opacity="0.0" />
          </linearGradient>
          <filter id="chartGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        <!-- Grid Lines -->
        <line x1="${padding.left}" y1="${getY(targetVal)}" x2="${width - padding.right}" y2="${getY(targetVal)}" 
              stroke="rgba(255,255,255,0.15)" stroke-dasharray="4 4" stroke-width="1.2" />
        <text x="${width - padding.right - 4}" y="${getY(targetVal) - 6}" fill="rgba(255,255,255,0.4)" font-size="10" text-anchor="end">Target</text>
    `;

    // Target baseline line
    let points = this.data.map((d, i) => `${getX(i)},${getY(d[metricKey] || 0)}`).join(' ');
    let areaPoints = `${getX(0)},${padding.top + chartH} ${points} ${getX(this.data.length - 1)},${padding.top + chartH}`;

    // Area fill
    svg += `<polygon points="${areaPoints}" fill="url(#chartAreaGrad)" />`;

    // Trend line
    svg += `<polyline fill="none" stroke="${strokeColor}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" points="${points}" filter="url(#chartGlow)" />`;

    // Data dots & Day labels
    this.data.forEach((d, i) => {
      const x = getX(i);
      const y = getY(d[metricKey] || 0);
      const isToday = i === this.data.length - 1;

      // X-axis label
      svg += `
        <text x="${x}" y="${height - 10}" fill="${isToday ? '#10b981' : '#94a3b8'}" 
              font-size="11" font-weight="${isToday ? '700' : '500'}" text-anchor="middle">
          ${d.label}
        </text>
      `;

      // Data point node
      svg += `
        <circle cx="${x}" cy="${y}" r="${isToday ? 6 : 4}" fill="${isToday ? '#ffffff' : strokeColor}" stroke="#080b11" stroke-width="2.5" />
        <text x="${x}" y="${y - 10}" fill="#ffffff" font-size="10" font-weight="700" text-anchor="middle" opacity="${isToday ? 1 : 0.8}">
          ${d[metricKey]}
        </text>
      `;
    });

    svg += `</svg>`;
    this.container.innerHTML = svg;
  }
}

window.HealthCharts = HealthCharts;
