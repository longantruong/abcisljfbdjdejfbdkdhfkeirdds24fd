const API_URL = "https://withered-wildflower-37ab.wymanmelyssa4.workers.dev/";

const gamesGrid = document.querySelector("#games-grid");
const gameCount = document.querySelector("#game-count");
const cardTemplate = document.querySelector("#game-card-template");

const badges = [
  { key: "new", label: "NEW", className: "badge-new" },
  { key: "hot", label: "HOT", className: "badge-hot" },
  { key: "best_seller", label: "BEST SELLER", className: "badge-best" },
];

function fitGrid(itemCount) {
  if (!itemCount) return;

  const gridBox = gamesGrid.getBoundingClientRect();
  const gap = Math.min(10, Math.max(4, window.innerWidth * 0.007));
  const bestLayout = {
    columns: Math.min(10, itemCount),
    rows: Math.ceil(itemCount / Math.min(10, itemCount)),
  };

  gamesGrid.style.setProperty("--grid-columns", bestLayout.columns);
  gamesGrid.style.setProperty("--grid-rows", bestLayout.rows);

  const cardHeight = (gridBox.height - gap * (bestLayout.rows - 1)) / bestLayout.rows;
  gamesGrid.classList.toggle("compact-grid", cardHeight < 190);
  gamesGrid.style.setProperty("--card-padding", `${Math.max(5, Math.min(14, cardHeight * 0.1))}px`);
  gamesGrid.style.setProperty("--name-gap", `${Math.max(3, Math.min(10, cardHeight * 0.07))}px`);
  gamesGrid.style.setProperty("--footer-padding", `${Math.max(4, Math.min(9, cardHeight * 0.065))}px`);
  gamesGrid.style.setProperty("--name-size", `${Math.max(9, Math.min(14, cardHeight * 0.095))}px`);
  gamesGrid.style.setProperty("--price-size", `${Math.max(13, Math.min(25, cardHeight * 0.16))}px`);
  gamesGrid.style.setProperty("--number-size", `${Math.max(9, Math.min(13, cardHeight * 0.09))}px`);
  gamesGrid.style.setProperty("--label-size", `${Math.max(6, Math.min(8, cardHeight * 0.055))}px`);
  gamesGrid.style.setProperty("--badge-size", `${Math.max(6, Math.min(9, cardHeight * 0.06))}px`);
  gamesGrid.style.setProperty("--order-size", `${Math.max(11, Math.min(16, cardHeight * 0.105))}px`);
}

function formatNumber(value) {
  return String(Math.max(0, Number(value) || 0)).padStart(3, "0");
}

function createBadge({ label, className }) {
  const badge = document.createElement("span");
  badge.className = `badge ${className}`;
  badge.textContent = label;
  return badge;
}

function createGameCard(item, index) {
  const fragment = cardTemplate.content.cloneNode(true);
  const card = fragment.querySelector(".game-card");
  const imageWrap = fragment.querySelector(".image-wrap");
  const image = fragment.querySelector(".game-image");
  const badgesContainer = fragment.querySelector(".badges");

  card.dataset.gameId = item.id;
  fragment.querySelector(".item-order").textContent = String(index + 1).padStart(2, "0");
  fragment.querySelector(".current-number").textContent = formatNumber(item.current_number);

  badges.filter((badge) => item[badge.key] === 1).forEach((badge) => {
    badgesContainer.append(createBadge(badge));
  });

  if (typeof item.image === "string" && item.image.trim()) {
    image.alt = item.name ? `${item.name} game artwork` : "Game artwork";
    image.addEventListener("load", () => imageWrap.classList.add("has-image"), { once: true });
    image.addEventListener("error", () => imageWrap.classList.remove("has-image"), { once: true });
    image.src = item.image;

    // A cached image can finish before the load event listener runs.
    if (image.complete && image.naturalWidth > 0) imageWrap.classList.add("has-image");
  }

  return fragment;
}

function renderGames(items) {
  const activeGames = Array.isArray(items) ? items.filter((item) => item.active === 1) : [];
  gamesGrid.replaceChildren();
  gamesGrid.setAttribute("aria-busy", "false");

  if (!activeGames.length) {
    gamesGrid.innerHTML = '<div class="empty-state"><p>No active games are available right now.</p></div>';
    gameCount.textContent = "0 games available";
    return;
  }

  const cards = document.createDocumentFragment();
  activeGames.forEach((item, index) => cards.append(createGameCard(item, index)));
  gamesGrid.append(cards);
  gameCount.textContent = `${activeGames.length} ${activeGames.length === 1 ? "game" : "games"} available`;
  fitGrid(activeGames.length);
}

async function loadGames() {
  try {
    const response = await fetch(API_URL);
    if (!response.ok) throw new Error(`Request failed: ${response.status}`);
    renderGames(await response.json());
  } catch (error) {
    console.error("Could not load games:", error);
    gamesGrid.setAttribute("aria-busy", "false");
    if (!gamesGrid.children.length || gamesGrid.querySelector(".loading-card")) {
      gamesGrid.innerHTML = '<div class="error-state"><p>Unable to load games. Please try again shortly.</p></div>';
    }
    gameCount.textContent = "Updates temporarily unavailable";
  }
}

loadGames();
setInterval(loadGames, 60000);
window.addEventListener("resize", () => fitGrid(gamesGrid.querySelectorAll(".game-card").length));
