import React from 'react';
import {Switch} from "@/components/ui/switch"

interface ToggleSwitchProps {
  isOn: boolean;
  onToggle: () => void;
}

const ToggleSwitch: React.FC<ToggleSwitchProps> = ({ isOn, onToggle }) => {
  return (
    <Switch defaultChecked={isOn} onToggle={onToggle} className=''></Switch>
  );
};

export default ToggleSwitch;
