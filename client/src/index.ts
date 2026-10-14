import { renderBurgerPanel, attachBurgerHandlers } from "./components/burger-menu";
import type { DreamListMode } from "./components/burger-menu";

const BASE_PATH = "/LB6";

function withBase(path: string): string {
    if (!BASE_PATH) return path;
    return BASE_PATH + path;
}

function stripBase(pathname: string): string {
    if (!BASE_PATH) return pathname;
    if (pathname === BASE_PATH) return "/";
    if (pathname.startsWith(BASE_PATH + "/")) {
        return pathname.slice(BASE_PATH.length);
    }
    return pathname;
}

function assetUrl(path: string): string {
    return withBase(path);
}

// ----------------------- ГЛОБАЛЬНЫЕ ПЕРЕМЕННЫЕ -----------------------
const loader = document.getElementById("loader") as HTMLDivElement | null;
const btn = document.getElementById("presidentBtn") as HTMLButtonElement | null;
const app = document.getElementById("app");

// ----------------------- ДИАЛОГОВОЕ ОКНО (замена alert) -----------------------
function showAlert(message: string): void {
    const modal = document.createElement("div");
    modal.className = "modal modal-alert";

    const content = document.createElement("div");
    content.className = "modal-content modal-alert-content";

    const text = document.createElement("p");
    text.textContent = message;

    const okBtn = document.createElement("button");
    okBtn.className = "alert-ok-btn";
    okBtn.id = "alert-ok-btn";
    okBtn.textContent = "OK";

    content.appendChild(text);
    content.appendChild(okBtn);
    modal.appendChild(content);
    document.body.appendChild(modal);

    const closeModal = () => modal.remove();

    okBtn.addEventListener("click", closeModal);
    modal.addEventListener("click", (event) => {
        if (event.target === modal) closeModal();
    });
}

// ----------------------- УВЕДОМЛЕНИЯ -----------------------
function showNotification(message: string, withRegisterBtn = false) {
    const notify = document.createElement("div");
    notify.className = "notify";
    notify.textContent = message;

    if (withRegisterBtn) {
        const b = document.createElement("button");
        b.style.background = "transparent";
        b.style.color = "#fff";
        b.style.border = "none";
        b.style.marginLeft = "10px";
        b.style.cursor = "pointer";
        b.addEventListener("click", () => {
            notify.remove();
            navigate("/login");
        });
        notify.appendChild(b);
    }

    document.body.appendChild(notify);
    setTimeout(() => notify.classList.add("show"), 50);
    setTimeout(() => {
        notify.classList.remove("show");
        setTimeout(() => notify.remove(), 400);
    }, 2000);
}

// ----------------------- НАВИГАЦИЯ -----------------------
function navigate(path: string) {
    runRouteTransition(() => {
        window.history.pushState({}, "", withBase(path));
        router();
    });
}

function runRouteTransition(changeRoute: () => void) {
    if (!app) {
        changeRoute();
        return;
    }

    app.classList.remove("page-transition-in");
    app.classList.add("page-transition-out");

    setTimeout(() => {
        changeRoute();
        app.classList.remove("page-transition-out");
        app.classList.add("page-transition-in");

        setTimeout(() => {
            app.classList.remove("page-transition-in");
        }, 380);
    }, 260);
}

// ----------------------- ЛОГИН -----------------------
function renderLoginPage() {
    if (!app) return;

    app.innerHTML = `
        <div class="login-email-page fade-in">
            <div class="email-modal">
                <h1 class="email-welcome">Добро пожаловать</h1>
                <p class="email-instruction">
                    Чтобы продолжить<br />
                    введите электронную почту
                </p>

                <form id="loginForm" class="email-form" data-login>
                    <div class="email-input-wrap">
                        <input
                            type="email"
                            id="email"
                            placeholder="Example@gmail.com"
                            required
                            autocomplete="email"
                        />
                    </div>
                    <button type="button" id="sendCode" class="email-send-btn">Отправить код</button>
                </form>
            </div>
        </div>
    `;

    const emailInput = document.getElementById("email") as HTMLInputElement | null;
    const sendCodeBtn = document.getElementById("sendCode") as HTMLButtonElement | null;
    const loginForm = document.getElementById("loginForm") as HTMLFormElement | null;

    loginForm?.addEventListener("submit", (e) => e.preventDefault());

    sendCodeBtn?.addEventListener("click", async () => {
        if (!emailInput) return;

        const email = emailInput.value.trim();
        if (!email) {
            showAlert("Введите email");
            return;
        }

        localStorage.setItem("auth_email", email);

        try {
            const res = await fetch("http://localhost:3000/auth/sendCode", {
                credentials: "include",
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email }),
            });

            const data = await res.json();

            if (res.ok) {
                navigate(`/code?email=${encodeURIComponent(email)}`);
                showAlert("Код отправлен на почту");
            } else {
                showAlert(data.error || "Ошибка при отправке кода");
            }
        } catch {
            showAlert("Не удалось связаться с сервером");
        }
    });
}

// ----------------------- ВВОД КОДА -----------------------
function renderCodePage() {
    const emailFromQuery = new URLSearchParams(window.location.search).get("email")?.trim();
    if (emailFromQuery) {
        localStorage.setItem("auth_email", emailFromQuery);
    }
    const storedEmail = localStorage.getItem("auth_email") || "";
    if (!app) return;

    app.innerHTML = `
        <div class="dream-code-page fade-in">
            <div class="dream-code-modal">
                <h1 class="dream-code-title">
                    Введите код отправленный<br />
                    на <span class="dream-code-email">${storedEmail || "вашу почту"}</span>
                </h1>

                <form id="codeForm" class="dream-code-form">
                    <input
                        id="codeInput"
                        class="dream-code-input"
                        type="text"
                        inputmode="numeric"
                        autocomplete="one-time-code"
                        maxlength="6"
                        placeholder="Ваш шестизначный код"
                        required
                    />

                    <button type="submit" class="dream-code-submit">Проверить</button>
                </form>

                <p id="codeMessage" class="dream-code-message" aria-live="polite"></p>

                <button type="button" id="changeEmailBtn" class="dream-code-change-email">
                    Сменить почту
                </button>
            </div>
        </div>
    `;

    const codeForm = document.getElementById("codeForm") as HTMLFormElement | null;
    const codeInput = document.getElementById("codeInput") as HTMLInputElement | null;
    const codeMessage = document.getElementById("codeMessage") as HTMLParagraphElement | null;
    const changeEmailBtn = document.getElementById("changeEmailBtn") as HTMLButtonElement | null;

    changeEmailBtn?.addEventListener("click", () => navigate("/login"));

    if (!codeForm || !codeInput) return;

    codeForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        const code = codeInput.value.trim();
        if (!code) {
            if (codeMessage) codeMessage.textContent = "Введите код";
            return;
        }

        const emailStored = localStorage.getItem("auth_email");
        if (!emailStored) {
            if (codeMessage) codeMessage.textContent = "Email не найден. Попробуйте войти заново.";
            return;
        }

        if (codeMessage) codeMessage.textContent = "Проверяем код...";

        try {
            const res = await fetch("http://localhost:3000/auth/verify-code", {
                credentials: "include",
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: emailStored, code }),
            });

            const data = await res.json();

            if (res.ok && data?.success) {
                if (data.user?.id != null) {
                    localStorage.setItem("userToken", String(data.user.id));
                }
                navigate("/home");
                return;
            }

            if (codeMessage) codeMessage.textContent = data?.error || "Неверный код";
        } catch {
            if (codeMessage) codeMessage.textContent = "Ошибка соединения с сервером";
        }
    });
}

// ----------------------- DREAM UI -----------------------

// Верхняя навигация: бургер слева (mobile) + инлайн-кнопки справа (desktop) + лого по центру.
// CSS сам решает, что показать.
function renderDreamTopNav(mode: DreamListMode) {
    const activeAll  = mode === "dreams";
    const activeFav  = mode === "favorites";
    const activeHist = mode === "history";

    return `
        <header class="dream-top-nav">
            <div class="dream-nav-left" data-action="burger" aria-label="Меню">
                <span class="dream-burger" aria-hidden="true">≡</span>
            </div>

            <div class="dream-nav-center">
                <button type="button" class="dream-logo-btn" data-action="homeLogo" aria-label="Home">
                    <img class="dream-logo" src="${assetUrl("/logo.png")}" alt="logo" />
                </button>
            </div>

            <nav class="dream-nav-right" aria-label="Основная навигация">
                <button type="button" class="dream-nav-link ${activeAll ? "active" : ""}" data-nav="all">
                    Все сны
                </button>
                <button type="button" class="dream-nav-link ${activeFav ? "active" : ""}" data-nav="favorites">
                    Избранное
                </button>
                <button type="button" class="dream-nav-link ${activeHist ? "active" : ""}" data-nav="history">
                    История
                </button>
                <button type="button" class="dream-nav-link dream-nav-link--exit" data-action="exit">
                    Выйти →
                </button>
            </nav>
        </header>
    `;
}

function setupDreamLogoHomeHandler() {
    document
        .querySelector<HTMLElement>("[data-action='homeLogo']")
        ?.addEventListener("click", () => navigate("/home"));
}

// Обработчики для инлайн-навигации (используются только на десктопе).
function setupDesktopNavHandlers() {
    document.querySelectorAll<HTMLButtonElement>(".dream-nav-link[data-nav]").forEach((el) => {
        el.addEventListener("click", () => {
            const nav = el.dataset.nav;
            if (nav === "all") navigate("/catalog");
            else if (nav === "favorites") navigate("/favorites");
            else if (nav === "history") navigate("/history");
        });
    });

    document
        .querySelectorAll<HTMLButtonElement>(".dream-nav-link[data-action='exit']")
        .forEach((el) => {
            el.addEventListener("click", () => openDreamExitConfirmModal());
        });
}

// Монтирует бургер-панель и вешает все обработчики навигации (mobile + desktop).
function mountBurgerMenu(mode: DreamListMode) {
    if (!app) return;
    app.insertAdjacentHTML("beforeend", renderBurgerPanel(mode));
    attachBurgerHandlers({
        navigate,
        onExit: openDreamExitConfirmModal,
        currentMode: mode,
    });
    setupDesktopNavHandlers();
}

// ----------------------- МОДАЛКА ВЫХОДА -----------------------
function openDreamExitConfirmModal() {
    const existing = document.getElementById("dreamExitModal");
    existing?.remove();

    const overlay = document.createElement("div");
    overlay.id = "dreamExitModal";
    overlay.className = "dream-modal-overlay";
    overlay.innerHTML = `
        <div class="dream-modal-box dream-exit-modal" role="dialog" aria-modal="true">
            <div class="dream-modal-title">Вы уверены?</div>
            <div class="dream-exit-actions">
                <button type="button" class="dream-btn dream-btn-orange" data-exit="stay">Остаться</button>
                <button type="button" class="dream-btn dream-btn-purple" data-exit="leave">Выйти</button>
            </div>
        </div>
    `;

    document.body.appendChild(overlay);

    overlay.addEventListener("click", (e) => {
        if (e.target === overlay) overlay.remove();
    });

    overlay.querySelector<HTMLButtonElement>("[data-exit='stay']")?.addEventListener("click", () => {
        overlay.remove();
    });

    overlay.querySelector<HTMLButtonElement>("[data-exit='leave']")?.addEventListener("click", () => {
        fetch("http://localhost:3000/auth/logout", {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
        }).catch(() => {});

        localStorage.removeItem("userToken");
        overlay.remove();
        navigate("/login");
    });
}

// ----------------------- МОДАЛКА ОПИСАНИЯ -----------------------
function escapeHtml(text: string): string {
    return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

function openDreamFullDescriptionModal(description: string) {
    const existing = document.getElementById("dreamFullDescriptionModal");
    existing?.remove();

    const text = description.trim() || "Описание отсутствует";

    const overlay = document.createElement("div");
    overlay.id = "dreamFullDescriptionModal";
    overlay.className = "dream-modal-overlay";
    overlay.innerHTML = `
        <div class="dream-modal-box dream-full-description-modal" role="dialog" aria-modal="true">
            <div class="dream-full-description-text">${escapeHtml(text)}</div>
            <button type="button" class="dream-btn dream-btn-purple dream-full-description-delete">
                Закрыть
            </button>
        </div>
    `;

    document.body.appendChild(overlay);

    overlay.addEventListener("click", (e) => {
        if (e.target === overlay) overlay.remove();
    });

    overlay.querySelector<HTMLButtonElement>(".dream-full-description-delete")?.addEventListener("click", () => {
        overlay.remove();
    });
}

// ----------------------- ГАЛЕРЕЯ -----------------------
type DreamGallerySlide = {
    label: string;
    imageSrc: string;
    extraClass?: string;
};

function renderDreamGalleryMarkup(prefix: string, slides: DreamGallerySlide[]) {
    const slidesMarkup = slides
        .map((slide, index) => {
            const activeClass = index === 0 ? " is-active" : "";
            const extraClass = slide.extraClass ? ` ${slide.extraClass}` : "";
            return `
                <div class="dream-gallery-slide${activeClass}${extraClass}" data-gallery-slide="${index}">
                    <img class="dream-gallery-slide-image" src="${slide.imageSrc}" alt="${slide.label}" />
                    <div class="dream-gallery-slide-label">${slide.label}</div>
                </div>
            `;
        })
        .join("");

    const dotsMarkup = slides
        .map((_, index) => {
            const activeClass = index === 0 ? " is-active" : "";
            return `<button type="button" class="dream-gallery-dot${activeClass}" data-gallery-dot="${index}" aria-label="Перейти к изображению ${index + 1}"></button>`;
        })
        .join("");

    return `
        <div class="dream-gallery" data-gallery-root="${prefix}" data-gallery-total="${slides.length}">
            <button type="button" class="dream-gallery-arrow dream-gallery-arrow--left" data-gallery-prev aria-label="Предыдущее изображение">‹</button>
            <div class="dream-gallery-track">${slidesMarkup}</div>
            <button type="button" class="dream-gallery-arrow dream-gallery-arrow--right" data-gallery-next aria-label="Следующее изображение">›</button>
            <div class="dream-gallery-dots">${dotsMarkup}</div>
            <button type="button" class="dream-gallery-open-btn dream-btn dream-btn-orange" data-gallery-open>
                Открыть
            </button>
        </div>
    `;
}

function openDreamGalleryModal(slides: DreamGallerySlide[], startIndex: number) {
    const existing = document.getElementById("dreamGalleryModal");
    existing?.remove();

    const modal = document.createElement("div");
    modal.id = "dreamGalleryModal";
    modal.className = "dream-modal-overlay";
    modal.innerHTML = `
        <div class="dream-modal-box dream-gallery-modal" role="dialog" aria-modal="true">
            ${renderDreamGalleryMarkup("modal", slides)}
            <button type="button" class="dream-btn dream-btn-purple dream-gallery-close-btn" data-gallery-close-modal>
                Закрыть
            </button>
        </div>
    `;
    document.body.appendChild(modal);

    modal.addEventListener("click", (e) => {
        if (e.target === modal) modal.remove();
    });
    modal.querySelector<HTMLButtonElement>("[data-gallery-close-modal]")?.addEventListener("click", () => {
        modal.remove();
    });

    setupDreamGallery("modal", slides, startIndex);
}

function readGallerySlidesFromDom(
    root: HTMLElement,
    fallbackSlides: DreamGallerySlide[]
): DreamGallerySlide[] {
    const slideEls = Array.from(root.querySelectorAll<HTMLElement>("[data-gallery-slide]"));
    if (!slideEls.length) return fallbackSlides;

    return slideEls.map((slideEl, index) => {
        const img = slideEl.querySelector<HTMLImageElement>(".dream-gallery-slide-image");
        const labelEl = slideEl.querySelector(".dream-gallery-slide-label");
        const fallback = fallbackSlides[index];
        return {
            label: labelEl?.textContent?.trim() || fallback?.label || `КАДР ${index + 1}`,
            imageSrc: img?.src || fallback?.imageSrc || "",
            extraClass: fallback?.extraClass,
        };
    });
}

function setupDreamGallery(prefix: string, slides: DreamGallerySlide[], initialIndex = 0) {
    const root = document.querySelector<HTMLElement>(`[data-gallery-root="${prefix}"]`);
    if (!root) return;

    const slideEls = Array.from(root.querySelectorAll<HTMLElement>("[data-gallery-slide]"));
    const dotEls = Array.from(root.querySelectorAll<HTMLButtonElement>("[data-gallery-dot]"));
    const prevBtn = root.querySelector<HTMLButtonElement>("[data-gallery-prev]");
    const nextBtn = root.querySelector<HTMLButtonElement>("[data-gallery-next]");
    const openBtn = root.querySelector<HTMLButtonElement>("[data-gallery-open]");
    let currentIndex = Math.max(0, Math.min(initialIndex, slides.length - 1));

    const updateGallery = () => {
        slideEls.forEach((slideEl, index) => {
            slideEl.classList.toggle("is-active", index === currentIndex);
        });
        dotEls.forEach((dotEl, index) => {
            dotEl.classList.toggle("is-active", index === currentIndex);
        });
    };

    const goTo = (index: number) => {
        currentIndex = (index + slides.length) % slides.length;
        updateGallery();
    };

    prevBtn?.addEventListener("click", () => goTo(currentIndex - 1));
    nextBtn?.addEventListener("click", () => goTo(currentIndex + 1));

    dotEls.forEach((dotEl, index) => {
        dotEl.addEventListener("click", () => goTo(index));
    });

    openBtn?.addEventListener("click", () => {
        const currentSlides = readGallerySlidesFromDom(root, slides);
        openDreamGalleryModal(currentSlides, currentIndex);
    });

    updateGallery();
}

// ----------------------- СОЗДАНИЕ СНА -----------------------
function renderDreamCreatePage() {
    if (!app) return;

    app.innerHTML = `
        <div class="dream-page fade-in dream-page--no-scroll">
            ${renderDreamTopNav("dreams")}

            <main class="dream-main">
                <section class="dream-panel dream-panel-create">
                    <div class="dream-create-grid">
                        <div class="dream-create-left">
                            <textarea
                                id="dreamDescription"
                                class="dream-textarea"
                                placeholder="Введите описание вашего сна..."
                            ></textarea>
                        </div>

                        <div class="dream-create-right">
                            <input
                                id="dreamTitle"
                                class="dream-title-input"
                                type="text"
                                placeholder="Введите название сна..."
                            />

                            <div class="dream-style-block">
                                <div class="dream-label">Выберите стиль:</div>
                                <select id="dreamStyle" class="dream-select">
                                    <option selected>Реалистичный</option>
                                    <option>Фэнтези</option>
                                    <option>Аниме</option>
                                    <option>Сюрреализм</option>
                                    <option>Психоделия</option>
                                </select>
                            </div>

                            <button type="button" id="visualizeDreamBtn" class="dream-btn dream-btn-orange dream-btn-wide">
                                Визуализировать сон
                            </button>
                        </div>
                    </div>
                </section>
            </main>
        </div>
    `;

    mountBurgerMenu("dreams");
    setupDreamLogoHomeHandler();

    const visualizeDreamBtn = document.getElementById("visualizeDreamBtn") as HTMLButtonElement | null;
    visualizeDreamBtn?.addEventListener("click", async () => {
        const descriptionEl = document.getElementById("dreamDescription") as HTMLTextAreaElement | null;
        const titleEl = document.getElementById("dreamTitle") as HTMLInputElement | null;
        const styleEl = document.getElementById("dreamStyle") as HTMLSelectElement | null;

        const description = descriptionEl?.value?.trim() ?? "";
        const title = titleEl?.value?.trim() ?? "";
        const style = styleEl?.value?.trim() ?? "";

        if (!description) return showAlert("Введите описание сна");
        if (!title) return showAlert("Введите название сна");
        if (!style) return showAlert("Выберите стиль");

        if (!localStorage.getItem("userToken")) {
            return showAlert("Сначала войдите в аккаунт");
        }

        visualizeDreamBtn.disabled = true;
        visualizeDreamBtn.textContent = "Генерация...";

        try {
            const res = await fetch("http://localhost:3000/visualisations", {
                method: "POST",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ description, title, style }),
            });
            const data = await res.json();
            if (!res.ok) {
                showAlert(data?.error || "Ошибка генерации");
                return;
            }
            const visId = data?.visId;
            if (!visId) {
                showAlert("Не удалось получить id визуализации");
                return;
            }
            navigate(`/dream/${visId}`);
        } catch {
            showAlert("Не удалось связаться с сервером");
        } finally {
            visualizeDreamBtn.disabled = false;
            visualizeDreamBtn.textContent = "Визуализировать сон";
        }
    });
}

// ----------------------- СПИСОК (Все сны / История / Избранное) -----------------------
function renderDreamListPage(mode: DreamListMode) {
    if (!app) return;

    const showAuthor = mode === "dreams";

    let sortBy: "title" | "author" | "date" | "likes" = "date";
    let order: "asc" | "desc" = "desc";

    const formatDate = (iso: string) => {
        const d = new Date(iso);
        if (Number.isNaN(d.getTime())) return iso;
        const dd = String(d.getDate()).padStart(2, "0");
        const mm = String(d.getMonth() + 1).padStart(2, "0");
        const yy = String(d.getFullYear()).slice(-2);
        return `${dd}.${mm}.${yy}`;
    };

    const renderRows = (items: any[]) => {
        return items
            .map((v: any) => {
                const likes = Number(v?.likes ?? 0);
                const visId = String(v?.vis_id ?? "");
                return `
                    <div class="dream-list-row">
                        <div class="dream-col dream-col-title">
                            <div class="dream-row-title">${escapeHtml(String(v?.title ?? ""))}</div>
                        </div>
                        ${
                            showAuthor
                                ? `<div class="dream-col dream-col-author">
                                    <div class="dream-row-author">${escapeHtml(String(v?.author ?? ""))}</div>
                                </div>`
                                : ""
                        }
                        <div class="dream-col dream-col-date">
                            <div class="dream-row-date">${formatDate(String(v?.date_of_creation ?? ""))}</div>
                        </div>
                        <div class="dream-col dream-col-likes">
                            <div class="dream-row-likes">
                                ${likes} <span class="dream-heart">♡</span>
                            </div>
                        </div>
                        <div class="dream-col dream-col-action">
                            <button type="button" class="dream-row-btn" data-dream-id="${visId}">
                                Просмотреть
                            </button>
                        </div>
                    </div>
                `;
            })
            .join("");
    };

    app.innerHTML = `
        <div class="dream-page fade-in dream-page--no-scroll">
            ${renderDreamTopNav(mode)}

            <main class="dream-main">
                <section class="dream-panel dream-panel-list">
                    <div class="dream-list-head">
                        <button type="button" class="dream-head-cell dream-head-title" data-sort="title">
                            Название <span class="dream-sort-arrow">▼</span>
                        </button>
                        ${
                            showAuthor
                                ? `<button type="button" class="dream-head-cell dream-head-author" data-sort="author">
                                    Автор <span class="dream-sort-arrow">▼</span>
                                </button>`
                                : ""
                        }
                        <button type="button" class="dream-head-cell dream-head-date" data-sort="date">
                            Дата <span class="dream-sort-arrow">▼</span>
                        </button>
                        <button type="button" class="dream-head-cell dream-head-likes" data-sort="likes">
                            Лайки <span class="dream-sort-arrow">▼</span>
                        </button>
                        <div class="dream-head-cell dream-head-action"></div>
                    </div>

                    <div class="dream-list-body" id="dreamListBody">
                        <div class="dream-list-row"><div class="dream-col">Загрузка...</div></div>
                    </div>
                </section>
            </main>
        </div>
    `;

    mountBurgerMenu(mode);

    const listBody = document.getElementById("dreamListBody") as HTMLDivElement | null;

    async function loadList() {
        if (!listBody) return;

        const endpoint =
            mode === "history"
                ? `http://localhost:3000/visualisations/history?sortBy=${encodeURIComponent(sortBy)}&order=${encodeURIComponent(order)}`
                : `http://localhost:3000/visualisations/public?sortBy=${encodeURIComponent(sortBy)}&order=${encodeURIComponent(order)}`;

        try {
            const res = await fetch(endpoint, { credentials: "include" });
            const data = await res.json();
            if (!res.ok) {
                listBody.innerHTML = `<div class="dream-list-row"><div class="dream-col">${escapeHtml(data?.error || "Ошибка загрузки")}</div></div>`;
                return;
            }
            const items = Array.isArray(data) ? data : [];
            listBody.innerHTML = items.length
                ? renderRows(items)
                : `<div class="dream-list-row"><div class="dream-col">Пока пусто</div></div>`;

            listBody.querySelectorAll<HTMLButtonElement>(".dream-row-btn").forEach((b) => {
                b.addEventListener("click", () => {
                    const dreamId = b.dataset.dreamId || "1";
                    localStorage.setItem("dream_list_mode", mode);
                    if (mode === "history") {
                        navigate(`/dream/${dreamId}`);
                    } else {
                        navigate(`/dream/foreign/${dreamId}`);
                    }
                });
            });
        } catch {
            listBody.innerHTML = `<div class="dream-list-row"><div class="dream-col">Ошибка соединения</div></div>`;
        }
    }

    document.querySelectorAll<HTMLButtonElement>("[data-sort]").forEach((b) => {
        b.addEventListener("click", () => {
            const nextSort = (b.dataset.sort as any) as "title" | "author" | "date" | "likes";
            if (sortBy === nextSort) {
                order = order === "asc" ? "desc" : "asc";
            } else {
                sortBy = nextSort;
                order = "asc";
            }
            loadList();
        });
    });

    setupDreamLogoHomeHandler();
    loadList();
}

// ----------------------- ДЕТАЛЬНЫЙ ПРОСМОТР (свой сон) -----------------------
function renderDreamDetailPage(dreamId: string = "1") {
    if (!app) return;

    const dreamSlides: DreamGallerySlide[] = [
        { label: "КАДР 1", imageSrc: "" },
        { label: "КАДР 2", imageSrc: "", extraClass: "dream-gallery-slide--alt-1" },
        { label: "КАДР 3", imageSrc: "", extraClass: "dream-gallery-slide--alt-2" },
    ];

    app.innerHTML = `
        <div class="dream-page fade-in dream-page--no-scroll">
            ${renderDreamTopNav("history")}

            <main class="dream-main">
                <section class="dream-panel dream-panel-detail">
                    <div class="dream-detail-titlebar" id="dreamDetailTitle">Загрузка...</div>

                    <div class="dream-detail-content">
                        <div class="dream-detail-left">
                            <div class="dream-thumbs">
                                ${renderDreamGalleryMarkup(`detail-${dreamId}`, dreamSlides)}
                            </div>
                        </div>

                        <div class="dream-detail-right">
                            <div class="dream-detail-row dream-detail-row--type">
                                <div class="dream-detail-label">Выберите тип:</div>
                                <select class="dream-select dream-select--type" id="dreamVisibilitySelect">
                                    <option value="true">Публичный</option>
                                    <option value="false">Приватный</option>
                                </select>
                            </div>

                            <div class="dream-detail-row">
                                <div class="dream-detail-label">Описание:</div>
                                <button type="button" id="readFullDescriptionBtn" class="dream-btn dream-btn-orange dream-btn-small">
                                    Прочитать
                                </button>
                            </div>

                            <div class="dream-detail-row">
                                <div class="dream-detail-label">Дата:</div>
                                <div class="dream-detail-value" id="dreamDetailDate">—</div>
                            </div>

                            <div class="dream-detail-row">
                                <div class="dream-detail-label">Лайки:</div>
                                <div class="dream-detail-value">
                                    <span id="dreamDetailLikes">0</span> <span class="dream-heart dream-heart--red">♥</span>
                                </div>
                            </div>

                            <div class="dream-detail-row">
                                <div class="dream-detail-label">Автор:</div>
                                <div class="dream-detail-value" id="dreamDetailAuthor">—</div>
                            </div>

                            <div class="dream-detail-actions">
                                <button type="button" class="dream-btn dream-btn-purple dream-btn-wide" id="deleteDreamBtn">
                                    Удалить сон
                                </button>
                                <button type="button" class="dream-btn dream-btn-orange dream-btn-wide" id="saveDreamBtn">
                                    Сохранить
                                </button>
                            </div>
                        </div>
                    </div>
                </section>
            </main>
        </div>
    `;

    mountBurgerMenu("history");

    document.getElementById("deleteDreamBtn")?.addEventListener("click", async () => {
        if (!confirm("Удалить визуализацию?")) return;
        try {
            const res = await fetch(`http://localhost:3000/visualisations/${encodeURIComponent(dreamId)}`, {
                method: "DELETE",
                credentials: "include",
            });
            const data = await res.json();
            if (!res.ok) {
                showAlert(data?.error || "Ошибка удаления");
                return;
            }
            showNotification("Удалено");
            navigate("/history");
        } catch {
            showAlert("Ошибка соединения");
        }
    });

    document.getElementById("saveDreamBtn")?.addEventListener("click", async () => {
        const sel = document.getElementById("dreamVisibilitySelect") as HTMLSelectElement | null;
        const isPublic = sel?.value === "true";
        try {
            const res = await fetch(`http://localhost:3000/visualisations/${encodeURIComponent(dreamId)}/visibility`, {
                method: "PATCH",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ is_public: isPublic }),
            });
            const data = await res.json();
            if (!res.ok) {
                showAlert(data?.error || "Ошибка сохранения");
                return;
            }
            showNotification("Сохранено");
        } catch {
            showAlert("Ошибка соединения");
        }
    });

    setupDreamLogoHomeHandler();
    setupDreamGallery(`detail-${dreamId}`, dreamSlides);

    (async () => {
        try {
            const res = await fetch(`http://localhost:3000/visualisations/${encodeURIComponent(dreamId)}`, {
                credentials: "include",
            });
            const data = await res.json();
            if (!res.ok) {
                showAlert(data?.error || "Не удалось загрузить визуализацию");
                return;
            }

            const titleEl = document.getElementById("dreamDetailTitle");
            if (titleEl) titleEl.textContent = String(data?.title ?? "");

            const authorEl = document.getElementById("dreamDetailAuthor");
            if (authorEl) authorEl.textContent = String(data?.author ?? "");

            const dateEl = document.getElementById("dreamDetailDate");
            const iso = String(data?.date_of_creation ?? "");
            const d = new Date(iso);
            if (dateEl) {
                if (!Number.isNaN(d.getTime())) {
                    const dd = String(d.getDate()).padStart(2, "0");
                    const mm = String(d.getMonth() + 1).padStart(2, "0");
                    const yy = String(d.getFullYear()).slice(-2);
                    dateEl.textContent = `${dd}.${mm}.${yy}`;
                } else {
                    dateEl.textContent = iso || "—";
                }
            }

            const likesEl = document.getElementById("dreamDetailLikes");
            if (likesEl) likesEl.textContent = String(data?.likes ?? 0);

            const sel = document.getElementById("dreamVisibilitySelect") as HTMLSelectElement | null;
            if (sel) sel.value = String(Boolean(data?.is_public));

            const description = String(data?.description ?? "");
            document.getElementById("readFullDescriptionBtn")?.addEventListener("click", () => {
                openDreamFullDescriptionModal(description);
            });

            const imgs = [data?.img1, data?.img2, data?.img3].map((x: any) => String(x ?? ""));
            const root = document.querySelector<HTMLElement>(`[data-gallery-root="detail-${dreamId}"]`);
            if (root) {
                root.querySelectorAll<HTMLImageElement>(".dream-gallery-slide-image").forEach((imgEl, idx) => {
                    imgEl.src = imgs[idx] || "";
                });
            }
        } catch {
            showAlert("Ошибка соединения");
        }
    })();
}

// ----------------------- ДЕТАЛЬНЫЙ ПРОСМОТР (чужой сон) -----------------------
function renderDreamForeignDetailPage(dreamId: string = "1") {
    if (!app) return;

    const storedMode = (localStorage.getItem("dream_list_mode") as DreamListMode | null) || "dreams";
    const foreignSlides: DreamGallerySlide[] = [
        { label: "КАДР 1", imageSrc: "", extraClass: "dream-gallery-slide--foreign" },
        { label: "КАДР 2", imageSrc: "", extraClass: "dream-gallery-slide--foreign-alt-1" },
        { label: "КАДР 3", imageSrc: "", extraClass: "dream-gallery-slide--foreign-alt-2" },
    ];

    app.innerHTML = `
        <div class="dream-page fade-in dream-page--no-scroll">
            ${renderDreamTopNav(storedMode)}

            <main class="dream-main">
                <section class="dream-panel dream-panel-detail">
                    <div class="dream-detail-titlebar" id="dreamForeignTitle">Загрузка...</div>

                    <div class="dream-detail-content">
                        <div class="dream-detail-left">
                            <div class="dream-thumbs">
                                ${renderDreamGalleryMarkup(`foreign-${dreamId}`, foreignSlides)}
                            </div>
                        </div>

                        <div class="dream-detail-right">
                            <div class="dream-detail-row">
                                <div class="dream-detail-label">Описание:</div>
                                <button
                                    type="button"
                                    id="readFullDescriptionBtnForeign"
                                    class="dream-btn dream-btn-orange dream-btn-small"
                                >
                                    Прочитать
                                </button>
                            </div>

                            <div class="dream-detail-row">
                                <div class="dream-detail-label">Дата:</div>
                                <div class="dream-detail-value" id="dreamForeignDate">—</div>
                            </div>

                            <div class="dream-detail-row">
                                <div class="dream-detail-label">Лайки:</div>
                                <div class="dream-detail-value">
                                    <button type="button" id="foreignLikeBtn" class="dream-like-btn" style="background:transparent;border:none;cursor:pointer;padding:0;color:inherit;">
                                        <span id="dreamForeignLikes">0</span> <span id="dreamForeignHeart" class="dream-heart">♡</span>
                                    </button>
                                </div>
                            </div>

                            <div class="dream-detail-row">
                                <div class="dream-detail-label">Автор:</div>
                                <div class="dream-detail-value" id="dreamForeignAuthor">—</div>
                            </div>
                        </div>
                    </div>
                </section>
            </main>
        </div>
    `;

    mountBurgerMenu(storedMode);
    setupDreamLogoHomeHandler();
    setupDreamGallery(`foreign-${dreamId}`, foreignSlides);

    (async () => {
        try {
            const res = await fetch(`http://localhost:3000/visualisations/${encodeURIComponent(dreamId)}`, {
                credentials: "include",
            });
            const data = await res.json();
            if (!res.ok) {
                showAlert(data?.error || "Не удалось загрузить визуализацию");
                return;
            }

            const titleEl = document.getElementById("dreamForeignTitle");
            if (titleEl) titleEl.textContent = String(data?.title ?? "");

            const authorEl = document.getElementById("dreamForeignAuthor");
            if (authorEl) authorEl.textContent = String(data?.author ?? "");

            const dateEl = document.getElementById("dreamForeignDate");
            const iso = String(data?.date_of_creation ?? "");
            const d = new Date(iso);
            if (dateEl) {
                if (!Number.isNaN(d.getTime())) {
                    const dd = String(d.getDate()).padStart(2, "0");
                    const mm = String(d.getMonth() + 1).padStart(2, "0");
                    const yy = String(d.getFullYear()).slice(-2);
                    dateEl.textContent = `${dd}.${mm}.${yy}`;
                } else {
                    dateEl.textContent = iso || "—";
                }
            }

            const likesEl = document.getElementById("dreamForeignLikes");
            if (likesEl) likesEl.textContent = String(data?.likes ?? 0);

            const heartEl = document.getElementById("dreamForeignHeart");
            const liked = Boolean(data?.liked);
            if (heartEl) {
                heartEl.textContent = liked ? "♥" : "♡";
                heartEl.classList.toggle("dream-heart--red", liked);
            }

            const description = String(data?.description ?? "");
            document.getElementById("readFullDescriptionBtnForeign")?.addEventListener("click", () => {
                openDreamFullDescriptionModal(description);
            });

            const imgs = [data?.img1, data?.img2, data?.img3].map((x: any) => String(x ?? ""));
            const root = document.querySelector<HTMLElement>(`[data-gallery-root="foreign-${dreamId}"]`);
            if (root) {
                root.querySelectorAll<HTMLImageElement>(".dream-gallery-slide-image").forEach((imgEl, idx) => {
                    imgEl.src = imgs[idx] || "";
                });
            }

            document.getElementById("foreignLikeBtn")?.addEventListener("click", async () => {
                try {
                    const likeRes = await fetch(`http://localhost:3000/visualisations/${encodeURIComponent(dreamId)}/like`, {
                        method: "POST",
                        credentials: "include",
                    });
                    const likeData = await likeRes.json();
                    if (!likeRes.ok) {
                        showAlert(likeData?.error || "Ошибка лайка");
                        return;
                    }
                    if (likesEl) likesEl.textContent = String(likeData?.likes ?? 0);
                    const nowLiked = Boolean(likeData?.liked);
                    if (heartEl) {
                        heartEl.textContent = nowLiked ? "♥" : "♡";
                        heartEl.classList.toggle("dream-heart--red", nowLiked);
                    }
                } catch {
                    showAlert("Ошибка соединения");
                }
            });
        } catch {
            showAlert("Ошибка соединения");
        }
    })();
}

// ----------------------- СЛУЖЕБНЫЕ СТРАНИЦЫ -----------------------
function renderDisclaimerPage() {
    if (!app) return;
    app.innerHTML = `
        <div class="disclaimer-page fade-in">
            <div class="disclaimer-container">
                <h1>DISCLAIMER</h1>
                <p>
                    This website is created for humorous purposes and does not involve the actual purchase of items.
                    Please only rate the creation of the website, as it is designed to teach novice programmers.
                </p>
                <button class="disclaimer-btn">Continue →</button>
            </div>
        </div>
    `;
    document.querySelector(".disclaimer-btn")?.addEventListener("click", () => navigate("/home"));
}

// ----------------------- РОУТЕР -----------------------
function router() {
    // Отрезаем BASE_PATH, чтобы роутер видел чистый путь
    const path = stripBase(window.location.pathname);
    console.log("ROUTER STARTED", path);

    if (path !== "/") {
        loader?.style.setProperty("display", "none");
        btn?.style.setProperty("display", "none");
    }

    if (path === "/") {
        loader?.classList.remove("hidden");
        setTimeout(() => {
            loader!.style.opacity = "0";
            setTimeout(() => {
                loader!.style.display = "none";
                btn?.classList.remove("hidden");
            }, 500);
        }, 1500);

        btn?.addEventListener("click", () => navigate("/login"));
        return;
    }

    if (path === "/login") return renderLoginPage();
    if (path === "/code") return renderCodePage();
    if (path === "/home") return renderDreamCreatePage();
    if (path === "/history") return renderDreamListPage("history");
    if (path === "/favorites") return renderDreamListPage("favorites");
    if (path === "/disclaimer") return renderDisclaimerPage();

    if (path.startsWith("/dream/") || path === "/dream") {
        const parts = path.split("/");
        const id = parts.length >= 3 && parts[2] ? parts[2] : "1";
        if (parts[2] === "foreign" && parts[3]) {
            return renderDreamForeignDetailPage(parts[3]);
        }
        return renderDreamDetailPage(id);
    }
    if (path.startsWith("/catalog")) return renderDreamListPage("dreams");

    if (app) app.innerHTML = "<h1>404 — Страница не найдена</h1>";
}

// ----------------------- ЗАПУСК -----------------------
window.addEventListener("popstate", () => {
    runRouteTransition(router);
});
if (document.readyState === "complete") {
    router();
} else {
    window.addEventListener("load", router);
}
