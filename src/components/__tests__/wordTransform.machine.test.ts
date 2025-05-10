import { createWordTransformMachine, WordTransformMachineContext, WordTransformSetupParams } from '../wordTransform.machine';
import { createActor } from 'xstate';

describe('wordTransformMachine', () => {
  function getActor(ctx: Partial<WordTransformSetupParams> = {}) {
    const machine = createWordTransformMachine({
      deletions: ctx.deletions ?? 0,
      moves: ctx.moves ?? 0,
      insertions: ctx.insertions ?? 0,
    });
    const actor = createActor(machine);
    actor.start();
    return actor;
  }

  it('starts in idle', () => {
    const actor = getActor();
    expect(actor.getSnapshot().value).toBe('idle');
  });

  it('transitions through all phases in order', () => {
    const actor = getActor({ deletions: 1, moves: 1, insertions: 1 });
    actor.send({ type: 'START' });
    expect(actor.getSnapshot().value).toBe('deleting');
    actor.send({ type: 'DONE_PHASE' });
    expect(actor.getSnapshot().value).toBe('moving');
    actor.send({ type: 'DONE_PHASE' });
    expect(actor.getSnapshot().value).toBe('inserting');
    actor.send({ type: 'DONE_PHASE' });
    expect(actor.getSnapshot().value).toBe('complete');
  });

  it('skips deleting if deletions=0', () => {
    const actor = getActor({ deletions: 0, moves: 2, insertions: 1 });
    actor.send({ type: 'START' });
    expect(actor.getSnapshot().value).toBe('moving');
  });

  it('skips moving if moves=0', () => {
    const actor = getActor({ deletions: 1, moves: 0, insertions: 2 });
    actor.send({ type: 'START' });
    expect(actor.getSnapshot().value).toBe('deleting');
    actor.send({ type: 'DONE_PHASE' });
    expect(actor.getSnapshot().value).toBe('inserting');
  });

  it('skips inserting if insertions=0', () => {
    const actor = getActor({ deletions: 1, moves: 1, insertions: 0 });
    actor.send({ type: 'START' });
    expect(actor.getSnapshot().value).toBe('deleting');
    actor.send({ type: 'DONE_PHASE' });
    expect(actor.getSnapshot().value).toBe('moving');
    actor.send({ type: 'DONE_PHASE' });
    expect(actor.getSnapshot().value).toBe('complete');
  });

  it('goes directly to complete if all counts are zero', () => {
    const actor = getActor({ deletions: 0, moves: 0, insertions: 0 });
    actor.send({ type: 'START' });
    expect(actor.getSnapshot().value).toBe('complete');
  });

  it('RESET returns to idle and clears context', () => {
    const actor = getActor({ deletions: 2, moves: 1, insertions: 1 });
    actor.send({ type: 'START' });
    expect(actor.getSnapshot().value).toBe('deleting');
    actor.send({ type: 'RESET' });
    expect(actor.getSnapshot().value).toBe('idle');
    // Context should be reset to zeros
    expect(actor.getSnapshot().context).toEqual({ deletions: 0, moves: 0, insertions: 0 });
  });

  it('can be reset from any phase', () => {
    const actor = getActor({ deletions: 1, moves: 1, insertions: 1 });
    actor.send({ type: 'START' }); // deleting
    actor.send({ type: 'DONE_PHASE' }); // moving
    actor.send({ type: 'RESET' });
    expect(actor.getSnapshot().value).toBe('idle');
    expect(actor.getSnapshot().context).toEqual({ deletions: 0, moves: 0, insertions: 0 });
  });
}); 