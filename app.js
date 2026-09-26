/* =========================================================
   NEXORA CLUB
   app.js
   Core application controller
   ========================================================= */

(() => {
  "use strict";

  /* =========================
     CONFIG
  ========================= */

  const CONFIG = {
    appName: "NEXORA CLUB",
    storageKey: "nexora_state_v1",
    defaultCoins: 1250,
    defaultGems: 85,
    defaultLevel: 12,
    maxMessageLength: 500,
    toastDuration: 2800
  };

  /* =========================
     HELPERS
  ========================= */

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) =>
    Array.from(root.querySelectorAll(selector));

  const byId = (id) => document.getElementById(id);

  const safeJSONParse = (value, fallback) => {
    try {
      return JSON.parse(value);
    } catch {
      return fallback;
    }
  };

  const escapeHTML = (value) => {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  };

  const formatNumber = (number) => {
    const n = Number(number) || 0;

    if (n >= 1000000) {
      return `${(n / 1000000).toFixed(1).replace(".0", "")}M`;
    }

    if (n >= 1000) {
      return `${(n / 1000).toFixed(1).replace(".0", "")}K`;
    }

    return n.toLocaleString("en-US");
  };

  const now = () => Date.now();

  const createId = (prefix = "id") => {
    return `${prefix}_${Date.now()}_${Math.random()
      .toString(36)
      .slice(2, 9)}`;
  };

  /* =========================
     DEFAULT STATE
  ========================= */

  const DEFAULT_STATE = {
    initialized: false,

    user: {
      id: "user_local",
      name: "يوسف",
      username: "@nexora_user",
      avatar: "https://i.pravatar.cc/150?img=12",
      level: CONFIG.defaultLevel,
      coins: CONFIG.defaultCoins,
      gems: CONFIG.defaultGems,
      vip: false,
      followers: 0,
      following: 0,
      online: true
    },

    settings: {
      theme: "dark",
      sound: true,
      notifications: true,
      compactMode: false
    },

    currentPage: "home",
    currentChat: null,
    currentRoom: null,

    notifications: [],

    chats: [
      {
        id: "chat_1",
        name: "غرفة الأصدقاء",
        avatar: "https://i.pravatar.cc/150?img=33",
        online: true,
        unread: 2,
        messages: [
          {
            id: createId("msg"),
            sender: "system",
            text: "أهلاً بك في NEXORA CLUB 👋",
            time: now() - 3600000
          },
          {
            id: createId("msg"),
            sender: "other",
            text: "جاهز نلعب؟ 🎮",
            time: now() - 900000
          }
        ]
      },

      {
        id: "chat_2",
        name: "NEXORA Gaming",
        avatar: "https://i.pravatar.cc/150?img=45",
        online: true,
        unread: 0,
        messages: [
          {
            id: createId("msg"),
            sender: "other",
            text: "بدأت غرفة الألعاب 🔥",
            time: now() - 7200000
          }
        ]
      },

      {
        id: "chat_3",
        name: "ملك",
        avatar: "https://i.pravatar.cc/150?img=47",
        online: false,
        unread: 1,
        messages: [
          {
            id: createId("msg"),
            sender: "other",
            text: "مساء الخير ✨",
            time: now() - 1800000
          }
        ]
      }
    ],

    friends: [
      {
        id: "friend_1",
        name: "سيف",
        username: "@saif",
        avatar: "https://i.pravatar.cc/150?img=11",
        online: true
      },
      {
        id: "friend_2",
        name: "نور",
        username: "@noor",
        avatar: "https://i.pravatar.cc/150?img=32",
        online: true
      },
      {
        id: "friend_3",
        name: "آدم",
        username: "@adam",
        avatar: "https://i.pravatar.cc/150?img=13",
        online: false
      }
    ],

    rooms: [
      {
        id: "room_1",
        name: "NEXORA Lounge",
        type: "chat",
        members: 128,
        online: 74,
        host: "NEXORA",
        icon: "🎙️"
      },
      {
        id: "room_2",
        name: "Domino Night",
        type: "game",
        members: 46,
        online: 31,
        host: "Ahmed",
        icon: "🁫"
      },
      {
        id: "room_3",
        name: "Music & Chill",
        type: "music",
        members: 93,
        online: 58,
        host: "Lina",
        icon: "🎵"
      }
    ],

    favorites: [],
    posts: [],
    blocked: []
  };

  /* =========================
     LOAD / SAVE STATE
  ========================= */

  let state = loadState();

  function loadState() {
    const stored = localStorage.getItem(CONFIG.storageKey);

    if (!stored) {
      return structuredClone(DEFAULT_STATE);
    }

    const parsed = safeJSONParse(stored, null);

    if (!parsed || typeof parsed !== "object") {
      return structuredClone(DEFAULT_STATE);
    }

    return {
      ...structuredClone(DEFAULT_STATE),
      ...parsed,
      user: {
        ...structuredClone(DEFAULT_STATE.user),
        ...(parsed.user || {})
      },
      settings: {
        ...structuredClone(DEFAULT_STATE.settings),
        ...(parsed.settings || {})
      }
    };
  }

  function saveState() {
    try {
      localStorage.setItem(
        CONFIG.storageKey,
        JSON.stringify(state)
      );
    } catch (error) {
      console.warn("NEXORA state could not be saved:", error);
    }
  }

  /* =========================
     DOM REFERENCES
  ========================= */

  const DOM = {
    loader: byId("appLoader"),
    app: byId("app"),
    loaderProgress: byId("loaderProgress"),
    loaderPercent: byId("loaderPercent"),

    globalSearch: byId("globalSearch"),
    headerCoins: byId("headerCoins"),

    sidebar: byId("sidebar"),
    mainContent: byId("mainContent"),

    toastContainer: byId("toastContainer"),
    modalRoot: byId("modalRoot"),

    chatMessages: byId("chatMessages"),
    messageInput: byId("messageInput"),
    sendMessage: byId("sendMessage"),

    videoCallOverlay: byId("videoCallOverlay"),
    gameCallOverlay: byId("gameCallOverlay"),

    emojiPanel: byId("emojiPanel")
  };

  /* =========================
     INITIALIZATION
  ========================= */

  document.addEventListener("DOMContentLoaded", init);

  function init() {
    setupLoader();
    bindNavigation();
    bindGlobalSearch();
    bindChat();
    bindGlobalClicks();
    bindKeyboardShortcuts();
    restoreTheme();
    updateUserUI();
    updateNotifications();
    renderChatList();
    renderCurrentChat();
    setupEmojiPanel();

    state.initialized = true;
    saveState();
  }

  /* =========================
     LOADER
  ========================= */

  function setupLoader() {
    if (!DOM.loader) return;

    let progress = 0;

    const interval = setInterval(() => {
      progress += Math.floor(Math.random() * 12) + 6;

      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);

        if (DOM.loaderProgress) {
          DOM.loaderProgress.style.width = "100%";
        }

        if (DOM.loaderPercent) {
          DOM.loaderPercent.textContent = "100%";
        }

        setTimeout(() => {
          DOM.loader.classList.add("loaded");

          if (DOM.app) {
            DOM.app.classList.add("ready");
          }

          setTimeout(() => {
            DOM.loader.style.display = "none";
          }, 500);
        }, 250);

        return;
      }

      if (DOM.loaderProgress) {
        DOM.loaderProgress.style.width = `${progress}%`;
      }

      if (DOM.loaderPercent) {
        DOM.loaderPercent.textContent = `${progress}%`;
      }
    }, 90);
  }

  /* =========================
     NAVIGATION
  ========================= */

  function bindNavigation() {
    document.addEventListener("click", (event) => {
      const button = event.target.closest("[data-page]");

      if (!button) return;

      event.preventDefault();

      const page = button.dataset.page;

      if (!page) return;

      navigate(page);
    });
  }

  function navigate(page, options = {}) {
    const pageElement = byId(`page-${page}`);

    if (!pageElement) {
      console.warn(`NEXORA: page-${page} was not found.`);
      showToast("هذه الصفحة غير متاحة حالياً", "warning");
      return;
    }

    state.currentPage = page;

    $$(".page").forEach((element) => {
      element.classList.remove("active", "show");
    });

    pageElement.classList.add("active");

    requestAnimationFrame(() => {
      pageElement.classList.add("show");
    });

    $$("[data-page]").forEach((element) => {
      element.classList.toggle(
        "active",
        element.dataset.page === page
      );
    });

    if (!options.keepScroll) {
      window.scrollTo({
        top: 0,
        behavior: "smooth"
      });
    }

    closeAllOverlays(false);

    saveState();

    window.dispatchEvent(
      new CustomEvent("nexora:navigate", {
        detail: { page }
      })
    );
  }

  /* =========================
     SEARCH
  ========================= */

  function bindGlobalSearch() {
    if (!DOM.globalSearch) return;

    DOM.globalSearch.addEventListener("input", (event) => {
      performSearch(event.target.value);
    });

    DOM.globalSearch.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        const value = event.target.value.trim();

        if (!value) return;

        navigate("discover");
        showToast(`نتائج البحث عن: ${value}`, "info");
      }

      if (event.key === "Escape") {
        DOM.globalSearch.value = "";
        performSearch("");
        DOM.globalSearch.blur();
      }
    });
  }

  function performSearch(value) {
    const query = value.trim().toLowerCase();

    const searchable = $$(
      "[data-searchable], .user-card, .room-card, .game-card, .post-card"
    );

    if (!searchable.length) return;

    searchable.forEach((element) => {
      if (!query) {
        element.classList.remove("search-hidden");
        return;
      }

      const text = element.textContent.toLowerCase();

      element.classList.toggle(
        "search-hidden",
        !text.includes(query)
      );
    });
  }

  /* =========================
     CHAT
  ========================= */

  function bindChat() {
    if (DOM.sendMessage) {
      DOM.sendMessage.addEventListener("click", sendCurrentMessage);
    }

    if (DOM.messageInput) {
      DOM.messageInput.addEventListener("keydown", (event) => {
        if (event.key === "Enter" && !event.shiftKey) {
          event.preventDefault();
          sendCurrentMessage();
        }
      });

      DOM.messageInput.addEventListener("input", () => {
        const value = DOM.messageInput.value;

        if (value.length > CONFIG.maxMessageLength) {
          DOM.messageInput.value =
            value.slice(0, CONFIG.maxMessageLength);
        }
      });
    }
  }

  function getCurrentChat() {
    return state.chats.find(
      (chat) => chat.id === state.currentChat
    );
  }

  function openChat(chatId) {
    const chat = state.chats.find(
      (item) => item.id === chatId
    );

    if (!chat) return;

    state.currentChat = chat.id;
    chat.unread = 0;

    renderChatList();
    renderCurrentChat();
    saveState();

    navigate("messages");
  }

  function renderChatList() {
    const list = byId("chatList");

    if (!list) return;

    list.innerHTML = state.chats
      .map((chat) => {
        const last =
          chat.messages?.[chat.messages.length - 1];

        return `
          <button
            class="chat-item"
            data-chat-id="${escapeHTML(chat.id)}"
            type="button"
          >
            <span class="chat-avatar-wrap">
              <img
                class="chat-avatar"
                src="${escapeHTML(chat.avatar)}"
                alt=""
              >
              ${
                chat.online
                  ? '<span class="online-dot"></span>'
                  : ""
              }
            </span>

            <span class="chat-info">
              <span class="chat-name">
                ${escapeHTML(chat.name)}
              </span>

              <span class="chat-preview">
                ${escapeHTML(last?.text || "ابدأ المحادثة")}
              </span>
            </span>

            ${
              chat.unread
                ? `<span class="chat-unread">${chat.unread}</span>`
                : ""
            }
          </button>
        `;
      })
      .join("");

    $$(".chat-item", list).forEach((item) => {
      item.addEventListener("click", () => {
        openChat(item.dataset.chatId);
      });
    });
  }

  function renderCurrentChat() {
    if (!DOM.chatMessages) return;

    const chat = getCurrentChat();

    if (!chat) {
      DOM.chatMessages.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">💬</div>
          <h3>اختر محادثة</h3>
          <p>ابدأ التواصل مع أصدقائك على NEXORA.</p>
        </div>
      `;
      return;
    }

    DOM.chatMessages.innerHTML = chat.messages
      .map((message) => {
        const mine = message.sender === "me";

        return `
          <div class="message-row ${mine ? "mine" : "theirs"}">
            <div class="message-bubble">
              <div class="message-text">
                ${escapeHTML(message.text)}
              </div>
              <div class="message-time">
                ${formatTime(message.time)}
              </div>
            </div>
          </div>
        `;
      })
      .join("");

    DOM.chatMessages.scrollTop =
      DOM.chatMessages.scrollHeight;
  }

  function sendCurrentMessage() {
    if (!DOM.messageInput) return;

    const text = DOM.messageInput.value.trim();

    if (!text) return;

    let chat = getCurrentChat();

    if (!chat) {
      chat = createChat({
        name: "محادثة جديدة"
      });

      state.currentChat = chat.id;
    }

    chat.messages.push({
      id: createId("msg"),
      sender: "me",
      text,
      time: now()
    });

    DOM.messageInput.value = "";

    renderChatList();
    renderCurrentChat();

    saveState();

    playSound("message");

    /*
      هنا مكان ربط WebSocket / Firebase / Supabase لاحقاً.
      الواجهة نفسها لا تحتاج تغيير.
    */

    setTimeout(() => {
      simulateIncomingReply(chat.id);
    }, 900);
  }

  function simulateIncomingReply(chatId) {
    const chat = state.chats.find(
      (item) => item.id === chatId
    );

    if (!chat) return;

    if (Math.random() > 0.45) return;

    chat.messages.push({
      id: createId("msg"),
      sender: "other",
      text: "وصلت رسالتك ❤️",
      time: now()
    });

    if (state.currentChat !== chatId) {
      chat.unread += 1;
    }

    renderChatList();
    renderCurrentChat();
    updateNotifications();
    saveState();
  }

  function createChat(data = {}) {
    const chat = {
      id: createId("chat"),
      name: data.name || "مستخدم NEXORA",
      avatar:
        data.avatar ||
        "https://i.pravatar.cc/150?img=20",
      online: true,
      unread: 0,
      messages: []
    };

    state.chats.unshift(chat);

    return chat;
  }

  function formatTime(timestamp) {
    const date = new Date(timestamp);

    return date.toLocaleTimeString("ar-EG", {
      hour: "2-digit",
      minute: "2-digit"
    });
  }

  /* =========================
     GLOBAL CLICK HANDLER
  ========================= */

  function bindGlobalClicks() {
    document.addEventListener("click", (event) => {
      const target = event.target;

      /* ---------- Like ---------- */

      const likeButton =
        target.closest("[data-like]");

      if (likeButton) {
        event.preventDefault();

        const liked =
          likeButton.classList.toggle("liked");

        likeButton.dataset.liked = liked
          ? "true"
          : "false";

        updateLikeCounter(likeButton, liked);

        if (liked) {
          playSound("like");
        }

        return;
      }

      /* ---------- Favorite ---------- */

      const favoriteButton =
        target.closest("[data-favorite]");

      if (favoriteButton) {
        event.preventDefault();

        const itemId =
          favoriteButton.dataset.favorite;

        toggleFavorite(itemId, favoriteButton);

        return;
      }

      /* ---------- Follow ---------- */

      const followButton =
        target.closest("[data-follow]");

      if (followButton) {
        event.preventDefault();

        toggleFollow(followButton);

        return;
      }

      /* ---------- Coin purchase ---------- */

      const coinButton =
        target.closest("[data-buy-coins]");

      if (coinButton) {
        event.preventDefault();

        const amount =
          Number(coinButton.dataset.buyCoins) || 0;

        purchaseCoins(amount);

        return;
      }

      /* ---------- Gift ---------- */

      const giftButton =
        target.closest("[data-gift]");

      if (giftButton) {
        event.preventDefault();

        const gift =
          giftButton.dataset.gift || "هدية";

        const price =
          Number(giftButton.dataset.price) || 0;

        sendGift(gift, price);

        return;
      }

      /* ---------- Room ---------- */

      const roomButton =
        target.closest("[data-room-id]");

      if (roomButton) {
        event.preventDefault();

        openRoom(roomButton.dataset.roomId);

        return;
      }

      /* ---------- Game ---------- */

      const gameButton =
        target.closest("[data-game]");

      if (gameButton) {
        event.preventDefault();

        openGame(gameButton.dataset.game);

        return;
      }

      /* ---------- Modal close ---------- */

      if (
        target.matches("[data-close-modal]") ||
        target.closest("[data-close-modal]")
      ) {
        closeModal();
        return;
      }

      /* ---------- Theme ---------- */

      const themeButton =
        target.closest("[data-theme-toggle]");

      if (themeButton) {
        event.preventDefault();
        toggleTheme();
        return;
      }

      /* ---------- Menu ---------- */

      const menuButton =
        target.closest("[data-menu-toggle]");

      if (menuButton) {
        event.preventDefault();
        toggleSidebar();
        return;
      }

      /* ---------- Video call ---------- */

      const videoCallButton =
        target.closest("[data-video-call]");

      if (videoCallButton) {
        event.preventDefault();
        startVideoCall();
        return;
      }

      /* ---------- Voice call ---------- */

      const voiceCallButton =
        target.closest("[data-voice-call]");

      if (voiceCallButton) {
        event.preventDefault();
        startVoiceCall();
        return;
      }

      /* ---------- End call ---------- */

      const endCallButton =
        target.closest("[data-end-call]");

      if (endCallButton) {
        event.preventDefault();
        endCall();
        return;
      }
    });
  }

  /* =========================
     LIKE
  ========================= */

  function updateLikeCounter(button, liked) {
    const counter =
      button.closest("[data-like-container]")
        ?.querySelector("[data-like-count]");

    if (!counter) return;

    const current =
      Number(counter.textContent.replace(/\D/g, "")) || 0;

    counter.textContent = formatNumber(
      Math.max(0, liked ? current + 1 : current - 1)
    );
  }

  /* =========================
     FAVORITES
  ========================= */

  function toggleFavorite(id, button) {
    if (!id) return;

    const index =
      state.favorites.indexOf(id);

    if (index === -1) {
      state.favorites.push(id);
      button.classList.add("active");

      showToast("تمت الإضافة إلى المفضلة ⭐", "success");
    } else {
      state.favorites.splice(index, 1);
      button.classList.remove("active");

      showToast("تمت الإزالة من المفضلة", "info");
    }

    saveState();
  }

  /* =========================
     FOLLOW
  ========================= */

  function toggleFollow(button) {
    const followed =
      button.dataset.followed === "true";

    button.dataset.followed =
      followed ? "false" : "true";

    button.classList.toggle(
      "following",
      !followed
    );

    button.textContent =
      followed ? "متابعة" : "متابَع ✓";

    showToast(
      followed
        ? "تم إلغاء المتابعة"
        : "تمت المتابعة بنجاح ✓",
      followed ? "info" : "success"
    );

    if (!followed) {
      state.user.following += 1;
    } else {
      state.user.following =
        Math.max(0, state.user.following - 1);
    }

    saveState();
  }

  /* =========================
     COINS
  ========================= */

  function updateUserUI() {
    if (DOM.headerCoins) {
      DOM.headerCoins.textContent =
        formatNumber(state.user.coins);
    }

    $$("[data-user-name]").forEach((element) => {
      element.textContent = state.user.name;
    });

    $$("[data-user-coins]").forEach((element) => {
      element.textContent =
        formatNumber(state.user.coins);
    });

    $$("[data-user-gems]").forEach((element) => {
      element.textContent =
        formatNumber(state.user.gems);
    });

    $$("[data-user-level]").forEach((element) => {
      element.textContent =
        state.user.level;
    });

    $$("[data-user-avatar]").forEach((element) => {
      if (element.tagName === "IMG") {
        element.src = state.user.avatar;
      } else {
        element.style.backgroundImage =
          `url("${state.user.avatar}")`;
      }
    });
  }

  function purchaseCoins(amount) {
    if (!amount || amount <= 0) return;

    state.user.coins += amount;

    updateUserUI();
    saveState();

    showToast(
      `تمت إضافة ${formatNumber(amount)} كوينز 🪙`,
      "success"
    );

    playSound("coins");
  }

  function spendCoins(amount) {
    if (!amount || amount <= 0) {
      return true;
    }

    if (state.user.coins < amount) {
      showToast(
        "رصيد الكوينز غير كافٍ 🪙",
        "warning"
      );

      return false;
    }

    state.user.coins -= amount;

    updateUserUI();
    saveState();

    return true;
  }

  /* =========================
     GIFTS
  ========================= */

  function sendGift(name, price) {
    if (!spendCoins(price)) return;

    showToast(
      `تم إرسال ${name} 🎁`,
      "success"
    );

    createNotification({
      icon: "🎁",
      title: "هدية",
      text: `تم إرسال ${name} بنجاح`
    });

    playSound("gift");
  }

  /* =========================
     ROOMS
  ========================= */

  function openRoom(roomId) {
    const room =
      state.rooms.find(
        (item) => item.id === roomId
      );

    if (!room) {
      showToast(
        "الغرفة غير موجودة",
        "warning"
      );
      return;
    }

    state.currentRoom = room.id;
    saveState();

    openModal(`
      <div class="room-modal">
        <div class="room-modal-icon">
          ${escapeHTML(room.icon)}
        </div>

        <h2>${escapeHTML(room.name)}</h2>

        <p>
          ${formatNumber(room.online)}
          شخص متصل الآن
        </p>

        <div class="room-actions">
          <button
            class="primary-btn"
            data-enter-room
          >
            دخول الغرفة
          </button>

          <button
            class="secondary-btn"
            data-close-modal
          >
            إلغاء
          </button>
        </div>
      </div>
    `);

    const enter =
      $("[data-enter-room]");

    if (enter) {
      enter.addEventListener("click", () => {
        closeModal();

        showToast(
          `دخلت ${room.name} 🎙️`,
          "success"
        );

        /*
          لاحقاً:
          WebSocket / WebRTC / server.js
        */
      });
    }
  }

  /* =========================
     GAMES
  ========================= */

  function openGame(gameName) {
    const game =
      String(gameName || "game");

    window.dispatchEvent(
      new CustomEvent("nexora:open-game", {
        detail: {
          game
        }
      })
    );

    if (typeof window.NexoraGames?.open === "function") {
      window.NexoraGames.open(game);
      return;
    }

    openModal(`
      <div class="game-launcher">
        <div class="game-launcher-icon">🎮</div>

        <h2>${escapeHTML(game)}</h2>

        <p>
          اللعبة جاهزة للربط بمحرك الألعاب في
          <b>games.js</b>.
        </p>

        <button
          class="primary-btn"
          data-close-modal
        >
          رجوع
        </button>
      </div>
    `);
  }

  /* =========================
     NOTIFICATIONS
  ========================= */

  function createNotification(data = {}) {
    state.notifications.unshift({
      id: createId("notification"),
      icon: data.icon || "🔔",
      title: data.title || "إشعار",
      text: data.text || "",
      time: now(),
      read: false
    });

    state.notifications =
      state.notifications.slice(0, 50);

    updateNotifications();
    saveState();
  }

  function updateNotifications() {
    const unread =
      state.notifications.filter(
        (item) => !item.read
      ).length;

    $$("[data-notification-count]").forEach(
      (element) => {
        element.textContent = unread;
        element.classList.toggle(
          "hidden",
          unread === 0
        );
      }
    );
  }

  function markNotificationsRead() {
    state.notifications.forEach(
      (item) => {
        item.read = true;
      }
    );

    updateNotifications();
    saveState();
  }

  /* =========================
     EMOJI
  ========================= */

  function setupEmojiPanel() {
    const panel = DOM.emojiPanel;

    if (!panel) return;

    const emojis = [
      "😀",
      "😂",
      "🤣",
      "😍",
      "🥰",
      "😘",
      "😎",
      "🔥",
      "❤️",
      "💚",
      "💙",
      "💜",
      "🖤",
      "💯",
      "✨",
      "🎉",
      "🎮",
      "🎁",
      "🎙️",
      "🎧",
      "👑",
      "🪙",
      "💎",
      "🚀",
      "😈",
      "🤝",
      "👏",
      "🙌",
      "👍",
      "👀"
    ];

    panel.innerHTML = emojis
      .map(
        (emoji) => `
          <button
            type="button"
            class="emoji-item"
            data-emoji="${emoji}"
          >
            ${emoji}
          </button>
        `
      )
      .join("");

    panel.addEventListener("click", (event) => {
      const button =
        event.target.closest("[data-emoji]");

      if (!button) return;

      insertEmoji(
        button.dataset.emoji
      );
    });
  }

  function insertEmoji(emoji) {
    if (!DOM.messageInput) return;

    const input = DOM.messageInput;

    const start =
      input.selectionStart ??
      input.value.length;

    const end =
      input.selectionEnd ??
      input.value.length;

    input.value =
      input.value.slice(0, start) +
      emoji +
      input.value.slice(end);

    input.focus();

    const position =
      start + emoji.length;

    input.setSelectionRange(
      position,
      position
    );
  }

  /* =========================
     THEME
  ========================= */

  function restoreTheme() {
    document.body.classList.toggle(
      "light",
      state.settings.theme === "light"
    );
  }

  function toggleTheme() {
    state.settings.theme =
      state.settings.theme === "dark"
        ? "light"
        : "dark";

    restoreTheme();
    saveState();

    showToast(
      state.settings.theme === "dark"
        ? "تم تفعيل الوضع الداكن 🌙"
        : "تم تفعيل الوضع الفاتح ☀️",
      "info"
    );
  }

  /* =========================
     SIDEBAR
  ========================= */

  function toggleSidebar() {
    if (!DOM.sidebar) return;

    DOM.sidebar.classList.toggle(
      "open"
    );

    document.body.classList.toggle(
      "sidebar-open",
      DOM.sidebar.classList.contains("open")
    );
  }

  /* =========================
     MODALS
  ========================= */

  function openModal(content) {
    if (!DOM.modalRoot) return;

    DOM.modalRoot.innerHTML = `
      <div class="modal-backdrop" data-close-modal>
        <div
          class="modal-card"
          role="dialog"
          aria-modal="true"
          onclick="event.stopPropagation()"
        >
          <button
            class="modal-close"
            type="button"
            data-close-modal
            aria-label="إغلاق"
          >
            ×
          </button>

          ${content}
        </div>
      </div>
    `;

    DOM.modalRoot.classList.add("active");

    document.body.classList.add(
      "modal-open"
    );
  }

  function closeModal() {
    if (!DOM.modalRoot) return;

    DOM.modalRoot.classList.remove(
      "active"
    );

    DOM.modalRoot.innerHTML = "";

    document.body.classList.remove(
      "modal-open"
    );
  }

  function closeAllOverlays(includeModal = true) {
    if (includeModal) {
      closeModal();
    }

    if (DOM.videoCallOverlay) {
      DOM.videoCallOverlay.classList.remove(
        "active"
      );
    }

    if (DOM.gameCallOverlay) {
      DOM.gameCallOverlay.classList.remove(
        "active"
      );
    }
  }

  /* =========================
     VIDEO CALL
  ========================= */

  function startVideoCall() {
    if (!DOM.videoCallOverlay) {
      openCallFallback("video");
      return;
    }

    DOM.videoCallOverlay.classList.add(
      "active"
    );

    document.body.classList.add(
      "call-active"
    );

    showToast(
      "جاري تجهيز مكالمة الفيديو 📹",
      "info"
    );

    /*
      هذا هو المكان الذي سيتم فيه
      تشغيل WebRTC الحقيقي مع server.js.
    */

    requestCameraPermission();
  }

  async function requestCameraPermission() {
    if (
      !navigator.mediaDevices ||
      !navigator.mediaDevices.getUserMedia
    ) {
      return;
    }

    try {
      const stream =
        await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true
        });

      const video =
        DOM.videoCallOverlay?.querySelector(
          "video"
        );

      if (video) {
        video.srcObject = stream;
        video.muted = true;
        video.play().catch(() => {});
      }
    } catch (error) {
      console.warn(
        "Camera/microphone permission:",
        error
      );

      showToast(
        "لم يتم السماح بالكاميرا أو الميكروفون",
        "warning"
      );
    }
  }

  function startVoiceCall() {
    openCallFallback("voice");
  }

  function openCallFallback(type) {
    openModal(`
      <div class="call-modal">
        <div class="call-icon">
          ${type === "video" ? "📹" : "📞"}
        </div>

        <h2>
          ${type === "video"
            ? "مكالمة فيديو"
            : "مكالمة صوتية"}
        </h2>

        <p>
          سيتم ربط الاتصال الحقيقي من خلال
          WebRTC في طبقة الاتصال الخاصة بالمنصة.
        </p>

        <button
          class="primary-btn"
          data-close-modal
        >
          إغلاق
        </button>
      </div>
    `);
  }

  function endCall() {
    if (DOM.videoCallOverlay) {
      const video =
        DOM.videoCallOverlay.querySelector(
          "video"
        );

      if (video?.srcObject) {
        video.srcObject
          .getTracks()
          .forEach((track) => track.stop());

        video.srcObject = null;
      }

      DOM.videoCallOverlay.classList.remove(
        "active"
      );
    }

    if (DOM.gameCallOverlay) {
      DOM.gameCallOverlay.classList.remove(
        "active"
      );
    }

    document.body.classList.remove(
      "call-active"
    );

    showToast(
      "انتهت المكالمة",
      "info"
    );
  }

  /* =========================
     GAME + CALL
  ========================= */

  function startGameCall(game) {
    if (DOM.gameCallOverlay) {
      DOM.gameCallOverlay.classList.add(
        "active"
      );
    }

    startVideoCall();

    window.dispatchEvent(
      new CustomEvent(
        "nexora:game-call-start",
        {
          detail: {
            game
          }
        }
      )
    );
  }

  /* =========================
     TOAST
  ========================= */

  function showToast(
    message,
    type = "info",
    duration = CONFIG.toastDuration
  ) {
    if (!DOM.toastContainer) {
      console.log(`[${type}]`, message);
      return;
    }

    const toast =
      document.createElement("div");

    toast.className =
      `nexora-toast toast-${type}`;

    toast.innerHTML = `
      <div class="toast-content">
        <span class="toast-message">
          ${escapeHTML(message)}
        </span>

        <button
          type="button"
          class="toast-close"
          aria-label="إغلاق"
        >
          ×
        </button>
      </div>
    `;

    DOM.toastContainer.appendChild(
      toast
    );

    requestAnimationFrame(() => {
      toast.classList.add("show");
    });

    const remove = () => {
      toast.classList.remove("show");

      setTimeout(() => {
        toast.remove();
      }, 250);
    };

    toast
      .querySelector(".toast-close")
      ?.addEventListener(
        "click",
        remove
      );

    setTimeout(remove, duration);
  }

  /* =========================
     SOUND
  ========================= */

  let audioContext = null;

  function playSound(type = "click") {
    if (!state.settings.sound) return;

    try {
      audioContext =
        audioContext ||
        new (
          window.AudioContext ||
          window.webkitAudioContext
        )();

      const oscillator =
        audioContext.createOscillator();

      const gain =
        audioContext.createGain();

      oscillator.connect(gain);
      gain.connect(
        audioContext.destination
      );

      const frequencies = {
        click: 520,
        message: 660,
        like: 760,
        gift: 900,
        coins: 1100
      };

      oscillator.frequency.value =
        frequencies[type] || 520;

      oscillator.type = "sine";

      gain.gain.setValueAtTime(
        0.0001,
        audioContext.currentTime
      );

      gain.gain.exponentialRampToValueAtTime(
        0.045,
        audioContext.currentTime + 0.015
      );

      gain.gain.exponentialRampToValueAtTime(
        0.0001,
        audioContext.currentTime + 0.12
      );

      oscillator.start();
      oscillator.stop(
        audioContext.currentTime + 0.13
      );
    } catch {
      // Audio is optional.
    }
  }

  /* =========================
     KEYBOARD
  ========================= */

  function bindKeyboardShortcuts() {
    document.addEventListener(
      "keydown",
      (event) => {
        if (
          event.key === "/" &&
          document.activeElement?.tagName !==
            "INPUT" &&
          document.activeElement?.tagName !==
            "TEXTAREA"
        ) {
          event.preventDefault();

          DOM.globalSearch?.focus();

          return;
        }

        if (event.key === "Escape") {
          closeModal();
          closeAllOverlays(false);
        }
      }
    );
  }

  /* =========================
     ONLINE STATUS
  ========================= */

  window.addEventListener(
    "online",
    () => {
      state.user.online = true;

      showToast(
        "عاد الاتصال بالإنترنت ✓",
        "success"
      );

      saveState();
    }
  );

  window.addEventListener(
    "offline",
    () => {
      state.user.online = false;

      showToast(
        "أنت الآن غير متصل بالإنترنت",
        "warning"
      );

      saveState();
    }
  );

  /* =========================
     PAGE EVENTS
  ========================= */

  window.addEventListener(
    "nexora:navigate",
    (event) => {
      const page =
        event.detail?.page;

      if (page === "notifications") {
        markNotificationsRead();
      }

      if (page === "messages") {
        renderChatList();
        renderCurrentChat();
      }

      if (page === "profile") {
        updateUserUI();
      }
    }
  );

  /* =========================
     PUBLIC API
  ========================= */

  window.Nexora = {
    state,

    navigate,
    showToast,

    openModal,
    closeModal,

    openChat,
    createChat,

    sendMessage: sendCurrentMessage,

    purchaseCoins,
    spendCoins,
    sendGift,

    openRoom,
    openGame,

    startVideoCall,
    startVoiceCall,
    startGameCall,
    endCall,

    toggleTheme,

    insertEmoji,

    refresh() {
      updateUserUI();
      updateNotifications();
      renderChatList();
      renderCurrentChat();
    },

    reset() {
      localStorage.removeItem(
        CONFIG.storageKey
      );

      location.reload();
    }
  };

  /* =========================
     DEBUG / DEV EVENTS
  ========================= */

  window.addEventListener(
    "nexora:add-coins",
    (event) => {
      const amount =
        Number(event.detail?.amount) || 0;

      if (amount <= 0) return;

      purchaseCoins(amount);
    }
  );

  window.addEventListener(
    "nexora:notification",
    (event) => {
      createNotification(
        event.detail || {}
      );
    }
  );

  /* =========================
     READY
  ========================= */

  document.documentElement.dataset.nexora =
    "ready";

})();
