import React from 'react';
import { MdSwitch } from "react-material-web"


interface ToggleSwitchProps {
  isOn: boolean;
  onToggle: () => void;
}

const ToggleSwitch: React.FC<ToggleSwitchProps> = ({ isOn, onToggle }) => {
  return (
    <MdSwitch selected={isOn} onChange={onToggle} className='switch'></MdSwitch>
  );
};

export default ToggleSwitch;
