/* Distributed under the terms of the Modified BSD License. */

import { TaskCancelledError, TaskScheduler } from './taskScheduler';

interface IDeferred {
  promise: Promise<void>;
  resolve: () => void;
  reject: (err?: any) => void;
}

const deferred = (): IDeferred => {
  let resolve!: () => void;
  let reject!: (err?: any) => void;
  const promise = new Promise<void>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
};

describe('TaskScheduler', () => {
  let scheduler: TaskScheduler;

  beforeEach(() => {
    scheduler = new TaskScheduler();
  });

  describe('serialization per port', () => {
    it('runs two tasks on the same port one after the other', async () => {
      const first = deferred();
      const second = deferred();
      const started: number[] = [];

      scheduler.run(['A'], () => {
        started.push(1);
        return first.promise;
      });
      scheduler.run(['A'], () => {
        started.push(2);
        return second.promise;
      });

      expect(started).toEqual([1]);

      first.resolve();
      second.resolve();
      await second.promise;
      expect(started).toEqual([1, 2]);
    });

    it('runs tasks on different ports concurrently', async () => {
      const first = deferred();
      const second = deferred();
      const started: string[] = [];

      scheduler.run(['A'], () => {
        started.push('A');
        return first.promise;
      });
      scheduler.run(['B'], () => {
        started.push('B');
        return second.promise;
      });

      expect(started.sort()).toEqual(['A', 'B']);

      first.resolve();
      second.resolve();
      await Promise.all([]);
    });

    it('runs a C task while motors A and B are busy', async () => {
      const first = deferred();
      const started: string[] = [];

      scheduler.run(['A'], () => {
        started.push('A');
        return first.promise;
      });
      scheduler.run(['B'], () => deferred().promise);
      scheduler.run(['C'], () => {
        started.push('C');
        return Promise.resolve();
      });

      expect(started.sort()).toEqual(['A', 'C']);
      first.resolve();
    });
  });

  describe('joint A+B tasks', () => {
    it('waits for tasks on both motor A and motor B', async () => {
      const motorA = deferred();
      const motorB = deferred();
      const started: string[] = [];

      scheduler.run(['A'], () => {
        started.push('A');
        return motorA.promise;
      });
      scheduler.run(['B'], () => {
        started.push('B');
        return motorB.promise;
      });
      const ab = scheduler.run(['A', 'B'], () => {
        started.push('AB');
        return Promise.resolve();
      });

      expect(started.sort()).toEqual(['A', 'B']);

      motorA.resolve();
      await new Promise(r => setTimeout(r, 0));
      expect(started.sort()).toEqual(['A', 'B']);

      motorB.resolve();
      await ab.promise;
      expect(started.sort()).toEqual(['A', 'AB', 'B']);
    });

    it('makes motor A and B tasks wait for a running A+B task', async () => {
      const ab = deferred();
      const started: string[] = [];

      scheduler.run(['A', 'B'], () => {
        started.push('AB');
        return ab.promise;
      });
      const a = scheduler.run(['A'], () => {
        started.push('A');
        return Promise.resolve();
      });
      const b = scheduler.run(['B'], () => {
        started.push('B');
        return Promise.resolve();
      });

      expect(started).toEqual(['AB']);

      ab.resolve();
      await Promise.all([a.promise, b.promise]);
      expect(started.sort()).toEqual(['A', 'AB', 'B']);
    });

    it('does not starve an A+B task behind incoming single-port tasks', async () => {
      const a1 = deferred();
      const started: string[] = [];

      scheduler.run(['A'], () => {
        started.push('A1');
        return a1.promise;
      });
      const ab = scheduler.run(['A', 'B'], () => {
        started.push('AB');
        return Promise.resolve();
      });
      const a2 = scheduler.run(['A'], () => {
        started.push('A2');
        return Promise.resolve();
      });

      a1.resolve();
      await Promise.all([ab.promise, a2.promise]);
      expect(started).toEqual(['A1', 'AB', 'A2']);
    });

    it('makes a B task wait for a queued A+B task blocked behind an A task', async () => {
      const a1 = deferred();
      const started: string[] = [];

      scheduler.run(['A'], () => {
        started.push('A1');
        return a1.promise;
      });
      const ab = scheduler.run(['A', 'B'], () => {
        started.push('AB');
        return Promise.resolve();
      });
      const b = scheduler.run(['B'], () => {
        started.push('B');
        return Promise.resolve();
      });

      // the A+B task conflicts with the running A task, and the B task
      // conflicts with the queued A+B task: neither may start yet
      expect(started).toEqual(['A1']);

      a1.resolve();
      await Promise.all([ab.promise, b.promise]);
      expect(started).toEqual(['A1', 'AB', 'B']);
    });

    it('still runs a C task while an A+B task waits for a busy A task', async () => {
      const a1 = deferred();
      const started: string[] = [];

      scheduler.run(['A'], () => {
        started.push('A1');
        return a1.promise;
      });
      scheduler.run(['A', 'B'], () => {
        started.push('AB');
        return Promise.resolve();
      });
      const c = scheduler.run(['C'], () => {
        started.push('C');
        return Promise.resolve();
      });

      expect(started.sort()).toEqual(['A1', 'C']);

      a1.resolve();
      await c.promise;
    });
  });

  describe('cancellation', () => {
    it('stops and rejects a running task and releases its ports', async () => {
      const running = deferred();
      const stops: string[] = [];
      let signal: AbortSignal | undefined;

      const job = scheduler.run(
        ['A'],
        s => {
          signal = s;
          return running.promise;
        },
        () => stops.push('A')
      );

      const next = scheduler.run(['A'], () => Promise.resolve());

      const expectation = expect(job.promise).rejects.toThrow(
        TaskCancelledError
      );
      job.cancel();
      await expectation;

      expect(stops).toEqual(['A']);
      expect(signal?.aborted).toBe(true);

      // the port is released: the queued task starts
      await next.promise;
    });
    it('never starts a cancelled queued task and does not stop its ports', async () => {
      const running = deferred();
      const started: string[] = [];
      const stops: string[] = [];

      scheduler.run(['A'], () => {
        started.push('first');
        return running.promise;
      });
      const queued = scheduler.run(
        ['A'],
        () => {
          started.push('queued');
          return Promise.resolve();
        },
        () => stops.push('A')
      );

      const expectation = expect(queued.promise).rejects.toThrow(
        TaskCancelledError
      );
      queued.cancel();
      await expectation;

      running.resolve();
      await new Promise(r => setTimeout(r, 0));
      expect(started).toEqual(['first']);
      expect(stops).toEqual([]);
    });

    it('is a no-op for a task that already settled', async () => {
      const stops: string[] = [];
      const job = scheduler.run(
        ['A'],
        () => Promise.resolve(),
        () => stops.push('A')
      );
      await job.promise;

      expect(() => job.cancel()).not.toThrow();
      expect(stops).toEqual([]);
    });

    it('aborts the signal passed to a running task', async () => {
      let signal: AbortSignal | undefined;
      const running = deferred();
      const job = scheduler.run(['A'], s => {
        signal = s;
        return running.promise;
      });

      const expectation = expect(job.promise).rejects.toThrow(
        TaskCancelledError
      );
      job.cancel();
      await expectation;

      expect(signal?.aborted).toBe(true);

      // let the aborted inner promise settle
      running.resolve();
      await new Promise(r => setTimeout(r, 0));
    });
  });

  describe('errors', () => {
    it('propagates a task error and releases the ports', async () => {
      const failing = scheduler.run(['B'], () => {
        throw new Error('boom');
      });
      const next = scheduler.run(['B'], () => Promise.resolve());

      await expect(failing.promise).rejects.toThrow('boom');

      // the port is released: the queued task starts
      await next.promise;
    });
  });
});
