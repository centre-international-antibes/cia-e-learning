// Offline map (no tiles, no network): Natural Earth 1:10m land via world-atlas,
// projected with d3-geo. Camera dives from Europe to the Côte d'Azur.
import React, {useMemo} from 'react';
import {geoMercator, geoPath} from 'd3-geo';
import type {Feature} from 'geojson';
import {Circle} from '@remotion/shapes';
import {interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import land from './europe-10m.json';
import {COLORS, EASE, FONTS, MAP, TYPE, WEIGHTS, alpha} from '../config';

const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
export const MAP_T = {diveStart: 6, diveEnd: 140, coastDraw: [4, 84] as [number, number], city0: 128, cityStagger: 8};

export const RivieraSvg: React.FC<{cities: readonly string[]}> = ({cities}) => {
  const frame = useCurrentFrame();
  const {width, height} = useVideoConfig();
  const portrait = height > width;

  const p = interpolate(frame, [MAP_T.diveStart, MAP_T.diveEnd], [0, 1], {...clamp, easing: EASE.inOut});
  const to = portrait ? {...MAP.to, span: MAP.to.span * 0.62, lat: MAP.to.lat + 0.02} : MAP.to;
  // Zoom toward a point: log-interpolated scale, and the Riviera's screen
  // position glides linearly from where it sits in the Europe view to its final place.
  const span = Math.exp(Math.log(MAP.from.span) + (Math.log(to.span) - Math.log(MAP.from.span)) * p);
  const target: [number, number] = [to.lon, to.lat];
  const projection = useMemo(() => geoMercator(), []);
  const offsetIn = (c: {lon: number; lat: number; span: number}) => {
    projection.scale(width / ((c.span * Math.PI) / 180)).center([c.lon, c.lat]).translate([width / 2, height / 2]);
    const [x, y] = projection(target) ?? [width / 2, height / 2];
    return [x - width / 2, y - height / 2];
  };
  const o0 = offsetIn(MAP.from);
  const ox = o0[0] * (1 - p);
  const oy = o0[1] * (1 - p);
  projection
    .scale(width / ((span * Math.PI) / 180))
    .center(target)
    .translate([width / 2 + ox, height / 2 + oy])
    .clipExtent([
      [-20, -20],
      [width + 20, height + 20],
    ]);
  const d = geoPath(projection)(land as unknown as Feature) ?? '';

  const coast = interpolate(frame, MAP_T.coastDraw, [0, 1], {...clamp, easing: EASE.inOut});
  const landFill = interpolate(frame, [0, 12], [0.6, 1], clamp);

  return (
    <svg width={width} height={height} style={{position: 'absolute', inset: 0}}>
      <rect width={width} height={height} fill={COLORS.navy} />
      <path d={d} fill={COLORS.blue} fillOpacity={landFill} stroke="none" />
      <path d={d} fill={COLORS.white} fillOpacity={0.05 * landFill} stroke="none" />
      <path d={d} fill="none" stroke={COLORS.white} strokeOpacity={0.8} strokeWidth={1.6} pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - coast} strokeLinejoin="round" />
      {MAP.cities.map((c, i) => {
        const [x, y] = projection([c.lon, c.lat]) ?? [0, 0];
        const s = MAP_T.city0 + i * MAP_T.cityStagger;
        const dot = interpolate(frame, [s, s + 12], [0, 1], {...clamp, easing: EASE.out});
        const wave = interpolate(frame, [s, s + 36], [0, 1], {...clamp, easing: EASE.out});
        const label = interpolate(frame, [s + 6, s + 24], [0, 1], {...clamp, easing: EASE.out});
        const dx = portrait ? c.labelDx * 0.9 : c.labelDx;
        return (
          <g key={i}>
            <g transform={`translate(${x} ${y})`} opacity={1 - wave} style={{display: wave >= 1 || frame < s ? 'none' : undefined}}>
              <g transform={`translate(${-10 - wave * 34} ${-10 - wave * 34})`}>
                <Circle radius={10 + wave * 34} fill="none" stroke={COLORS.white} strokeWidth={2} />
              </g>
            </g>
            <g transform={`translate(${x - 9 * dot} ${y - 9 * dot})`}>
              <Circle radius={9 * dot} fill={COLORS.white} stroke={COLORS.navy} strokeWidth={2} />
            </g>
            {Math.abs(c.labelDy) > 60 ? (
              <line x1={x + 8} y1={y + 8} x2={x + dx - 8} y2={y + c.labelDy - 14} stroke={COLORS.white} strokeOpacity={0.7 * label} strokeWidth={1.5} />
            ) : null}
            <text
              x={x + dx}
              y={y + c.labelDy}
              textAnchor={c.anchor}
              dominantBaseline="middle"
              opacity={label}
              fill={COLORS.white}
              style={{fontFamily: `'${FONTS.sans}'`, fontWeight: WEIGHTS.medium, fontSize: TYPE.label.size, letterSpacing: TYPE.label.tracking}}
            >
              {cities[i]}
            </text>
          </g>
        );
      })}
      <rect width={width} height={height} fill={alpha('navy', 0)} />
    </svg>
  );
};
