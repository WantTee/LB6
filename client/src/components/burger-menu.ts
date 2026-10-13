/**
 * Burger menu (mobile dark theme).
 * Slide-in from left. Contains: Все сны, Избранное, История, Выйти.
 * Only used at <=767px — desktop uses the old inline top nav.
 */

export type DreamListMode = "dreams" | "history" | "favorites";

interface BurgerMenuItem {
  key: "all" | "favorites" | "history" | "exit";
  label: string;
  icon: string;
  activeWhen?: DreamListMode[];
  danger?: boolean;
}

const BURGER_ITEMS: BurgerMenuItem[] = [
  { key: "all",       label: "Все сны",   icon: "≡", activeWhen: ["dreams"] },
  { key: "favorites", label: "Избранное", icon: "★", activeWhen: ["favorites"] },
  { key: "history",   label: "История",   icon: "⏲", activeWhen: ["history"] },
  { key: "exit",      label: "Выйти",     icon: "→", danger: true },
];

export function renderBurgerPanel(mode: DreamListMode): string {
  const items = BURGER_ITEMS.map((it) => {
    const isActive = it.activeWhen?.includes(mode) ? " active" : "";
    const dangerClass = it.danger ? " dm-burger-item--danger" : "";
    return `
      <li
        class="dm-burger-item${isActive}${dangerClass}"
        data-burger-key="${it.key}"
        role="menuitem"
      >
        <span class="dm-icon" aria-hidden="true">${it.icon}</span>
        <span>${it.label}</span>
      </li>
    `;
  }).join("");

  return `
    <div class="dm-burger-overlay" data-burger-overlay></div>
    <aside class="dm-burger-panel" data-burger-panel role="dialog" aria-modal="true" aria-label="Меню">
      <div class="dm-burger-head">
        <span class="dm-burger-title">Меню</span>
        <button type="button" class="dm-burger-close" data-burger-close aria-label="Закрыть меню">×</button>
      </div>
      <ul class="dm-burger-list">
        ${items}
      </ul>
    </aside>
  `;
}

/**
 * Attach event listeners to burger button, overlay, close, and items.
 * Should be called AFTER renderBurgerPanel() is in the DOM.
 */
export function attachBurgerHandlers(opts: {
  navigate: (path: string) => void;
  onExit: () => void;
  currentMode: DreamListMode;
}): void {
  const panel = document.querySelector<HTMLElement>("[data-burger-panel]");
  const overlay = document.querySelector<HTMLElement>("[data-burger-overlay]");
  const burgerBtn = document.querySelector<HTMLElement>("[data-action='burger']");
  const closeBtn = document.querySelector<HTMLElement>("[data-burger-close]");

  if (!panel || !overlay) return;

  const openMenu = () => {
    panel.classList.add("open");
    overlay.classList.add("open");
    document.body.classList.add("no-scroll");
  };
  const closeMenu = () => {
    panel.classList.remove("open");
    overlay.classList.remove("open");
    document.body.classList.remove("no-scroll");
  };

  burgerBtn?.addEventListener("click", openMenu);
  overlay.addEventListener("click", closeMenu);
  closeBtn?.addEventListener("click", closeMenu);

  panel.querySelectorAll<HTMLElement>("[data-burger-key]").forEach((el) => {
    el.addEventListener("click", () => {
      const key = el.dataset.burgerKey;
      closeMenu();

      if (key === "all") {
        opts.navigate("/catalog");
      } else if (key === "history") {
        opts.navigate("/history");
      } else if (key === "favorites") {
        opts.navigate("/favorites");
      } else if (key === "exit") {
        opts.onExit();
      }
    });
  });

  const onKey = (e: KeyboardEvent) => {
    if (e.key === "Escape") closeMenu();
  };
  document.addEventListener("keydown", onKey);
}
