export type Phase = 'idle' | 'deleting' | 'moving' | 'inserting' | 'final';

export type PhaseDurations = Record<Phase, number>;
