const KEY_ACTIONS = {
  ArrowUp: "up", KeyW: "up", ArrowDown: "down", KeyS: "down",
  ArrowLeft: "left", KeyA: "left", ArrowRight: "right", KeyD: "right",
};

export class InputManager {
  constructor({ onStart, onAnyGesture }) {
    this.actions = new Set();
    this.onStart = onStart;
    this.onAnyGesture = onAnyGesture;
    this.boundKeyDown = (event) => this.keyDown(event);
    this.boundKeyUp = (event) => this.keyUp(event);
    this.boundBlur = () => this.actions.clear();
    window.addEventListener("keydown", this.boundKeyDown, { passive: false });
    window.addEventListener("keyup", this.boundKeyUp);
    window.addEventListener("blur", this.boundBlur);
    document.querySelectorAll("[data-action]").forEach((button) => this.bindPointer(button));
  }

  keyDown(event) {
    if (event.code === "Enter" || event.code === "Space") {
      event.preventDefault(); this.onAnyGesture(); this.onStart(); return;
    }
    const action = KEY_ACTIONS[event.code];
    if (!action) return;
    event.preventDefault(); this.onAnyGesture(); this.actions.add(action);
  }

  keyUp(event) {
    const action = KEY_ACTIONS[event.code];
    if (action) this.actions.delete(action);
  }

  bindPointer(button) {
    const action = button.dataset.action;
    const activate = (event) => { event.preventDefault(); this.onAnyGesture(); this.actions.add(action); button.setPointerCapture?.(event.pointerId); };
    const deactivate = (event) => { event.preventDefault(); this.actions.delete(action); };
    button.addEventListener("pointerdown", activate);
    button.addEventListener("pointerup", deactivate);
    button.addEventListener("pointercancel", deactivate);
    button.addEventListener("pointerleave", deactivate);
  }

  axis() {
    return { x: (this.actions.has("right") ? 1 : 0) - (this.actions.has("left") ? 1 : 0), y: (this.actions.has("down") ? 1 : 0) - (this.actions.has("up") ? 1 : 0) };
  }

  destroy() {
    window.removeEventListener("keydown", this.boundKeyDown);
    window.removeEventListener("keyup", this.boundKeyUp);
    window.removeEventListener("blur", this.boundBlur);
  }
}
