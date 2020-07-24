import { Listener } from "./Listener";
import { ErisClient } from "../client/ErisClient";

export class ListenerManager {
  listeners: Set<Listener> = new Set();
  constructor(public client: ErisClient) { }

  add(listener: Listener) {
    if (this.listeners.has(listener)) return;

    const conflictingListener = Array.from(this.listeners).find(
      l => l.id == listener.id
    );
    if (conflictingListener) {
      throw new Error(
        `Cannot add ${listener.id} because it would conflict with ${conflictingListener.id}.`
      );
    }
    listener.wrapperFunc = (...args: any[]) =>
      listener.func.apply(listener.module, args);
    this.listeners.add(listener);
    this.client.on(listener.event, listener.wrapperFunc);
  }

  remove(listener: Listener) {
    if (listener.wrapperFunc)
      this.client.removeListener(listener.event, listener.wrapperFunc);
    this.listeners.delete(listener);
  }

  getById(id: string): Listener | undefined {
    return Array.from(this.listeners).find(c => c.id == id);
  }
}