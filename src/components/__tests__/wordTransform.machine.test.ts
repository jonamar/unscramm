import { createWordTransformMachine, WordTransformSetupParams } from '../wordTransform.machine';

describe('WordTransform Machine', () => {
  it('should create a machine with default context', () => {
    const machine = createWordTransformMachine();
    expect(machine).toBeDefined();
    expect(machine.getSnapshot().value).toBe('idle');
  });

  it('should create a machine with custom context', () => {
    const params: WordTransformSetupParams = {
      deletions: 2,
      moves: 1,
      insertions: 3
    };
    const machine = createWordTransformMachine(params);
    expect(machine).toBeDefined();
    expect(machine.getSnapshot().value).toBe('idle');
  });
}); 