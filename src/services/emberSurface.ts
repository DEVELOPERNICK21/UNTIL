/**
 * Lets surfaces hint which “Ember place” we’re on when nav route isn’t enough
 * (e.g. Home pager page 1 = Task report, Add-task modal open).
 */

type Listener = () => void;

type EmberSurfaceState = {
  /** Overrides root route for tips / visibility (e.g. 'TaskReport'). */
  routeOverride: string | null;
  /** When true, global companion hides (native Modal covers it). */
  modalCovering: boolean;
};

let state: EmberSurfaceState = {
  routeOverride: null,
  modalCovering: false,
};

const listeners = new Set<Listener>();

function emit(): void {
  listeners.forEach(l => l());
}

export function getEmberSurfaceState(): EmberSurfaceState {
  return state;
}

export function setEmberRouteOverride(routeOverride: string | null): void {
  if (state.routeOverride === routeOverride) return;
  state = { ...state, routeOverride };
  emit();
}

export function setEmberModalCovering(modalCovering: boolean): void {
  if (state.modalCovering === modalCovering) return;
  state = { ...state, modalCovering };
  emit();
}

export function subscribeEmberSurface(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** Effective place name for tips / docking. */
export function resolveEmberPlace(navRoute: string | undefined): string | undefined {
  return state.routeOverride ?? navRoute;
}
