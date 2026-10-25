/* Distributed under the terms of the Modified BSD License. */

/**
 * Error used to reject the promise of a job that was cancelled.
 */
export class TaskCancelledError extends Error {
  constructor() {
    super('Task cancelled');
    this.name = 'TaskCancelledError';
  }
}

interface IScheduledJob {
  ports: Set<string>;
  run: (signal: AbortSignal) => Promise<void>;
  stop?: () => void;
  controller: AbortController;
  promise: Promise<void>;
  resolve: () => void;
  reject: (err: any) => void;
  started: boolean;
  finalized: boolean;
}

export interface IScheduledJobHandle {
  promise: Promise<void>;
  cancel: () => void;
}

/**
 * Serialize commands that target overlapping ports of the Move Hub.
 *
 * Jobs are kept in a single FIFO queue. A job is started as soon as its
 * port set does not intersect the port set of any currently running job,
 * so commands on disjoint ports (e.g. motor A and motor C) run in
 * parallel while commands on overlapping ports (motor A and the joint
 * A+B motor command) are executed in submission order.
 */
export class TaskScheduler {
  private pending: IScheduledJob[];
  private running: Set<IScheduledJob>;

  constructor() {
    this.pending = [];
    this.running = new Set();
  }

  /**
   * Enqueue a job using the given ports.
   *
   * @param ports the physical resources (ports) the job uses
   * @param run the async work of the job, abortable through the given signal
   * @param stop optional side effect issued when a running job is cancelled
   * @returns a handle with the promise of the job and its cancel function
   */
  run(
    ports: string[],
    run: (signal: AbortSignal) => Promise<void>,
    stop?: () => void
  ): IScheduledJobHandle {
    const job: IScheduledJob = {} as any;
    job.ports = new Set(ports);
    job.run = run;
    job.stop = stop;
    job.controller = new AbortController();
    job.started = false;
    job.finalized = false;

    job.promise = new Promise<void>((resolve, reject) => {
      job.resolve = resolve;
      job.reject = reject;
    });

    this.pending.push(job);
    this.pump();

    return {
      promise: job.promise,
      cancel: () => this.cancel(job)
    };
  }

  /**
   * Cancel a job.
   *
   * A queued job is removed without being started. A running job is
   * aborted through its signal and its `stop` side effect is issued
   * immediately. In both cases the job promise is rejected with a
   * `TaskCancelledError` and the ports it held are released.
   */
  private cancel(job: IScheduledJob): void {
    if (job.finalized) {
      return;
    }
    job.finalized = true;

    const wasRunning = this.running.has(job);
    if (wasRunning) {
      this.running.delete(job);
    } else {
      const index = this.pending.indexOf(job);
      if (index !== -1) {
        this.pending.splice(index, 1);
      }
    }

    job.controller.abort();
    if (wasRunning && job.stop) {
      try {
        job.stop();
      } catch (err) {
        console.error('failed to stop cancelled task', err);
      }
    }
    job.reject(new TaskCancelledError());

    this.pump();
  }

  private pump(): void {
    const busy = new Set<string>();
    this.running.forEach(job => {
      job.ports.forEach(port => busy.add(port));
    });

    // Iterate over a copy: starting a job mutates this.running.
    const pending = [...this.pending];
    for (const job of pending) {
      const conflicts = [...job.ports].some(port => busy.has(port));
      if (!conflicts) {
        this.pending.splice(this.pending.indexOf(job), 1);
        this.start(job);
        job.ports.forEach(port => busy.add(port));
      }
    }
  }

  private start(job: IScheduledJob): void {
    job.started = true;
    this.running.add(job);

    try {
      job.run(job.controller.signal).then(
        () => this.complete(job, undefined),
        err => this.complete(job, err)
      );
    } catch (err) {
      this.complete(job, err);
    }
  }

  private complete(job: IScheduledJob, err: any): void {
    if (job.finalized) {
      // The job was cancelled; its ports were already released.
      return;
    }
    job.finalized = true;
    this.running.delete(job);

    if (err) {
      job.reject(err);
    } else {
      job.resolve();
    }

    this.pump();
  }
}
