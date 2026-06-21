import React, { ChangeEvent } from 'react';
import { TONE_OPTIONS, formatOptionLabel } from '@/utils/uiLabels';

interface ToneSelectorProps {
  tone: string;
  onToneChange: (event: ChangeEvent<HTMLSelectElement>) => void;
}
export default function ToneSelector({ tone, onToneChange }: ToneSelectorProps) {
  return (
    <div className="form-group">
      <label htmlFor="tone" className="agent_question">语气风格</label>
      <select 
        name="tone" 
        id="tone" 
        value={tone} 
        onChange={onToneChange} 
        className="form-control-static"
        required
      >
        {TONE_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {formatOptionLabel(option.label, option.description)}
          </option>
        ))}
      </select>
    </div>
  );
}
