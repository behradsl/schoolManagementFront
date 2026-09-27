type Listener = (pending: boolean) => void;

const listeners = new Set<Listener>();

export function setNavPending(pending: boolean) {
  listeners.forEach((listener) => listener(pending));
}

export function subscribeNavPending(listener: Listener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
