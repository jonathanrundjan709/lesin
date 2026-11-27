import { randomUUID } from "node:crypto";
import type { Clock, IdGenerator } from "@/application/ports";

export class SystemClock implements Clock { now(): number { return Date.now(); } }
export class UuidGenerator implements IdGenerator { next(): string { return randomUUID(); } }

/** Jam yang bisa dimajukan, untuk tes. */
export class FakeClock implements Clock {
  constructor(private t: number) {}
  now(): number { return this.t; }
  advance(ms: number): void { this.t += ms; }
}
