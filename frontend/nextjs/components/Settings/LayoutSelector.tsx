import React, { ChangeEvent } from 'react';
import { LAYOUT_OPTIONS, formatOptionLabel } from '@/utils/uiLabels';

interface LayoutSelectorProps {
  layoutType: string;
  onLayoutChange: (event: ChangeEvent<HTMLSelectElement>) => void;
}

export default function LayoutSelector({ layoutType, onLayoutChange }: LayoutSelectorProps) {
  return (
    <div className="form-group">
      <label htmlFor="layoutType" className="agent_question">布局方式</label>
      <select 
        name="layoutType" 
        id="layoutType" 
        value={layoutType} 
        onChange={onLayoutChange} 
        className="form-control-static"
        required
      >
        {LAYOUT_OPTIONS.filter((option) =>
          ['research', 'copilot'].includes(option.value)
        ).map((option) => (
          <option key={option.value} value={option.value}>
            {formatOptionLabel(option.label, option.description)}
          </option>
        ))}
      </select>
    </div>
  );
} 
