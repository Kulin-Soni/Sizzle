import React from 'react';
import { MdSlider } from "react-material-web";

import cn from '../utils/utils';

interface MetricSliderProps {
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
}

const MetricSlider: React.FC<MetricSliderProps> = ({ value, onChange, disabled }) => {
  const isGreen = value >= 30 && value <= 80;

  return (
    <MdSlider min={0} max={100} value={value} step={.1} className={cn(
      ['min-w-full -mt-2 transition-colors',
        isGreen ? "[--md-sys-color-primary:var(--theme2)] [--md-slider-inactive-track-color:#00FF007A]" : "[--md-sys-color-primary:var(--theme)] [--md-slider-inactive-track-color:#FF00002C]",
      ]
    )} onInput={(e:any) => {
      onChange(Math.round(Number(e.target.value)/5)*5)
    }} disabled={disabled} />
  );
};

export default MetricSlider;
