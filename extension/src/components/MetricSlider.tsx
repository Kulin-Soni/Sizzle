import React from "react";
import { Slider } from "@/components/ui/slider";
import cn from "../utils/utils";

interface MetricSliderProps {
    value: number;
    onChange: (value: number) => void;
    disabled?: boolean;
}

const MetricSlider: React.FC<MetricSliderProps> = ({
    value,
    onChange,
    disabled,
}) => {
    // const isGreen = value >= 30 && value <= 80;

    return (
        <Slider
            min={0}
            max={100}
            value={value}
            step={0.1}
            className={cn([
                "w-full"
            ])}
            onValueChange={(value) => {
                console.log("Yes", value)
                onChange(Math.round(Number(value) / 5) * 5);
            }}
            disabled={disabled}
        />
    );
};

export default MetricSlider;
