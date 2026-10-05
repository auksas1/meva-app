import React from 'react';
import { StyleSheet } from 'react-native';
import Svg, { Rect, Text as SvgText } from 'react-native-svg';
import type { Detection } from '../services/api';
import { prettifyLabel, confidencePercent } from './detections';

type Props = {
  detections: Detection[];
  containerWidth: number;
  containerHeight: number;
  imageNaturalWidth: number;
  imageNaturalHeight: number;
};

// Pixel rect of the image content inside a "contain" container.
function containRect(cw: number, ch: number, iw: number, ih: number) {
  const scale = Math.min(cw / iw, ch / ih);
  const dw = iw * scale;
  const dh = ih * scale;
  return { x: (cw - dw) / 2, y: (ch - dh) / 2, w: dw, h: dh };
}

export default function BboxOverlay({
  detections,
  containerWidth,
  containerHeight,
  imageNaturalWidth,
  imageNaturalHeight,
}: Props) {
  const r = containRect(containerWidth, containerHeight, imageNaturalWidth, imageNaturalHeight);

  return (
    <Svg style={StyleSheet.absoluteFill}>
      {detections.map((d, i) => {
        const [x1, y1, x2, y2] = d.bbox;
        const bx = r.x + x1 * r.w;
        const by = r.y + y1 * r.h;
        const bw = (x2 - x1) * r.w;
        const bh = (y2 - y1) * r.h;
        const label = `${prettifyLabel(d.label)} ${confidencePercent(d)}`;
        const labelW = label.length * 7 + 8;
        return (
          <React.Fragment key={i}>
            <Rect x={bx} y={by} width={bw} height={bh} stroke="#00e5ff" strokeWidth={2} fill="none" />
            <Rect x={bx} y={by} width={labelW} height={18} fill="rgba(0,0,0,0.55)" />
            <SvgText x={bx + 4} y={by + 13} fill="#00e5ff" fontSize={11} fontWeight="bold">
              {label}
            </SvgText>
          </React.Fragment>
        );
      })}
    </Svg>
  );
}
