import { ScrubInput } from './ScrubInput';
import './ScrubInput.css';

export interface TimingOverrides {
  deletePerOp: number;
  deleteMin: number;
  deleteBuffer: number;
  movePerOp: number;
  moveMin: number;
  moveBuffer: number;
  insertPerOp: number;
  insertMin: number;
  insertBuffer: number;
  motionPerLetter: number;
  deletionExitDelay: number;
}

interface TimingPanelProps {
  values: TimingOverrides;
  onChange: (key: keyof TimingOverrides, value: number) => void;
  onReset: () => void;
}

export function TimingPanel({ values, onChange, onReset }: TimingPanelProps) {
  return (
    <div className="timing-panel">
      <div className="timing-panel__header">
        <span className="timing-panel__title">Timing Config</span>
        <button onClick={onReset} className="timing-panel__reset">
          Reset
        </button>
      </div>

      {/* 2D Table: phases as columns, vars as rows */}
      <div className="timing-table">
        <div className="timing-table__header">
          <div className="timing-table__label"></div>
          <div className="timing-table__col timing-table__col--delete">delete</div>
          <div className="timing-table__col timing-table__col--move">move</div>
          <div className="timing-table__col timing-table__col--insert">insert</div>
        </div>

        <div className="timing-table__row">
          <div className="timing-table__label">per op</div>
          <div className="timing-table__cell">
            <ScrubInput
              label=""
              value={values.deletePerOp}
              onChange={(v) => onChange('deletePerOp', v)}
              min={0}
              max={1000}
              step={10}
            />
          </div>
          <div className="timing-table__cell">
            <ScrubInput
              label=""
              value={values.movePerOp}
              onChange={(v) => onChange('movePerOp', v)}
              min={0}
              max={1000}
              step={10}
            />
          </div>
          <div className="timing-table__cell">
            <ScrubInput
              label=""
              value={values.insertPerOp}
              onChange={(v) => onChange('insertPerOp', v)}
              min={0}
              max={1000}
              step={10}
            />
          </div>
        </div>

        <div className="timing-table__row">
          <div className="timing-table__label">min</div>
          <div className="timing-table__cell">
            <ScrubInput
              label=""
              value={values.deleteMin}
              onChange={(v) => onChange('deleteMin', v)}
              min={0}
              max={1000}
              step={10}
            />
          </div>
          <div className="timing-table__cell">
            <ScrubInput
              label=""
              value={values.moveMin}
              onChange={(v) => onChange('moveMin', v)}
              min={0}
              max={1000}
              step={10}
            />
          </div>
          <div className="timing-table__cell">
            <ScrubInput
              label=""
              value={values.insertMin}
              onChange={(v) => onChange('insertMin', v)}
              min={0}
              max={1000}
              step={10}
            />
          </div>
        </div>

        <div className="timing-table__row">
          <div className="timing-table__label">buffer</div>
          <div className="timing-table__cell">
            <ScrubInput
              label=""
              value={values.deleteBuffer}
              onChange={(v) => onChange('deleteBuffer', v)}
              min={0}
              max={500}
              step={10}
            />
          </div>
          <div className="timing-table__cell">
            <ScrubInput
              label=""
              value={values.moveBuffer}
              onChange={(v) => onChange('moveBuffer', v)}
              min={0}
              max={500}
              step={10}
            />
          </div>
          <div className="timing-table__cell">
            <ScrubInput
              label=""
              value={values.insertBuffer}
              onChange={(v) => onChange('insertBuffer', v)}
              min={0}
              max={500}
              step={10}
            />
          </div>
        </div>
      </div>

      {/* Global settings */}
      <div className="timing-globals">
        <div className="timing-globals__title">Global</div>
        <div className="timing-globals__row">
          <ScrubInput
            label="motion"
            value={values.motionPerLetter}
            onChange={(v) => onChange('motionPerLetter', v)}
            min={50}
            max={1000}
            step={10}
          />
          <ScrubInput
            label="exit delay"
            value={values.deletionExitDelay}
            onChange={(v) => onChange('deletionExitDelay', v)}
            min={0}
            max={500}
            step={10}
          />
        </div>
      </div>
    </div>
  );
}
