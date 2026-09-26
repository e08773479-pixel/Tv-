/* =========================================================
   NEXORA CLUB
   app.js
   Core Application Controller
   ========================================================= */

(() => {
  "use strict";

  /* =========================================================
     CONFIG
     ========================================================= */

  const CONFIG = {
    appName: "NEXORA CLUB",
    storageKey: "nexora_club_state_v2",
    defaultCoins: 1250,
    defaultGems: 85,
    defaultLevel: 12,
    maxMessageLength: 500,
    toastDuration: 2800
  };

  /* =========================================================
     HELPERS
     ========================================================= */

  const $ = (selector, root = document) =>
    root.querySelector(selector);

  const $$ = (selector, root = document) =>
    Array.from(root.querySelectorAll(selector));

  const byId = (id) =>
    document.getElementById(id);

  const now = () => Date.now();

  const createId = (prefix = "id") =>
    `${prefix}_${Date.now()}_${Math.random()
      .toString(36)
      .slice(2, 9)}`;

  const escapeHTML = (value) =>
    String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");

  const safeJSONParse = (value, fallback) => {
    try {
      return JSON.parse(value);
    } catch {
      return fallback;
    }
  };

  const formatNumber = (number) => {
    const n = Number(number) || 0;

    if (n >= 1000000) {
      return `${(n / 1000000)
        .toFixed(1)
        .replace(".0", "")}M`;
    }

    if (n >= 1000) {
      return `${(n / 1000)
        .toFixed(1)
        .replace(".0", "")}K`;
    }

    return n.toLocaleString("en-US");
  };

  /* =========================================================
     DEFAULT STATE
     ========================================================= */

  const DEFAULT_STATE = {
    initialized: false,

    user: {
      id: "local_user",
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

  /* =========================================================
     STATE
     ========================================================= */

  let state = loadState();

  function loadState() {
    const stored =
      localStorage.getItem(CONFIG.storageKey);

    if (!stored) {
      return structuredClone(DEFAULT_STATE);
    }

    const parsed =
      safeJSONParse(stored, null);

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
      console.warn(
        "NEXORA: failed to save state",
        error
      );
    }
  }

  /* =========================================================
     DOM
     ========================================================= */

  const DOM = {
    loader: null,
    app: null,
    loaderProgress: null,
    loaderPercent: null,

    globalSearch: null,
    headerCoins: null,

    sidebar: null,
    mainContent: null,

    toastContainer: null,
    modalRoot: null,

    chatMessages: null,
    messageInput: null,
    sendMessage: null,

    videoCallOverlay: null,
    gameCallOverlay: null,

    emojiPanel: null
  };

  function cacheDOM() {
    DOM.loader =
      byId("appLoader") ||
      $(".app-loader") ||
      $(".loader") ||
      $("[data-loader]");

    DOM.app =
      byId("app") ||
      $(".app") ||
      $("main");

    DOM.loaderProgress =
      byId("loaderProgress") ||
      $(".loader-progress") ||
      $("[data-loader-progress]");

    DOM.loaderPercent =
      byId("loaderPercent") ||
      $(".loader-percent") ||
      $("[data-loader-percent]");

    DOM.globalSearch =
      byId("globalSearch") ||
      $("[data-global-search]");

    DOM.headerCoins =
      byId("headerCoins") ||
      $("[data-header-coins]");

    DOM.sidebar =
      byId("sidebar") ||
      $(".sidebar");

    DOM.mainContent =
      byId("mainContent") ||
      $(".main-content");

    DOM.toastContainer =
      byId("toastContainer") ||
      $(".toast-container") ||
      $("[data-toast-container]");

    DOM.modalRoot =
      byId("modalRoot") ||
      $(".modal-root") ||
      $("[data-modal-root]");

    DOM.chatMessages =
      byId("chatMessages") ||
      $(".chat-messages");

    DOM.messageInput =
      byId("messageInput") ||
      $(".message-input") ||
      $("[data-message-input]");

    DOM.sendMessage =
      byId("sendMessage") ||
      $("[data-send-message]");

    DOM.videoCallOverlay =
      byId("videoCallOverlay") ||
      $(".video-call-overlay");

    DOM.gameCallOverlay =
      byId("gameCallOverlay") ||
      $(".game-call-overlay");

    DOM.emojiPanel =
      byId("emojiPanel") ||
      $(".emoji-panel");
  }

  /* =========================================================
     INIT
     ========================================================= */

  function init() {
    cacheDOM();

    /*
      Loader يبدأ أولاً.
      حتى لو حصل خطأ في أي وظيفة ثانية،
      لن يفضل الـLoader حاجباً للموقع.
    */

    setupLoader();

    try {
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

      document.documentElement.dataset.nexora =
        "ready";

    } catch (error) {
      console.error(
        "NEXORA initialization error:",
        error
      );

      forceShowApplication();
    }
  }

  /* =========================================================
     LOADER
     ========================================================= */

  function setupLoader() {
    const loader =
      DOM.loader ||
      byId("appLoader") ||
      $(".app-loader") ||
      $(".loader") ||
      $("[data-loader]");

    const progress =
      DOM.loaderProgress ||
      byId("loaderProgress") ||
      $(".loader-progress") ||
      $("[data-loader-progress]");

    const percent =
      DOM.loaderPercent ||
      byId("loaderPercent") ||
      $(".loader-percent") ||
      $("[data-loader-percent]");

    const app =
      DOM.app ||
      byId("app") ||
      $(".app") ||
      $("main");

    /*
      لو الـindex لا يحتوي Loader،
      افتح التطبيق مباشرة.
    */

    if (!loader) {
      forceShowApplication();
      return;
    }

    let value = 0;
    let finished = false;

    /*
      نخلي البداية واضحة.
    */

    if (progress) {
      progress.style.width = "0%";
    }

    if (percent) {
      percent.textContent = "0%";
    }

    const finishLoader = () => {
      if (finished) return;

      finished = true;

      value = 100;

      if (progress) {
        progress.style.width = "100%";
      }

      if (percent) {
        percent.textContent = "100%";
      }

      /*
        مهم جداً:
        التطبيق يظهر قبل إخفاء الـLoader.
      */

      if (app) {
        app.classList.add("ready");

        app.style.display = "";
        app.style.visibility = "visible";
        app.style.opacity = "1";
        app.style.pointerEvents = "auto";
      }

      loader.classList.add("loaded");

      loader.style.pointerEvents = "none";
      loader.style.opacity = "0";
      loader.style.visibility = "hidden";

      setTimeout(() => {
        if (loader && loader.parentNode) {
          loader.remove();
        }
      }, 550);
    };

    const timer =
      setInterval(() => {
        value +=
          Math.floor(Math.random() * 10) + 5;

        if (value >= 100) {
          clearInterval(timer);
          finishLoader();
          return;
        }

        if (progress) {
          progress.style.width =
            `${value}%`;
        }

        if (percent) {
          percent.textContent =
            `${value}%`;
        }
      }, 90);

    /*
      حماية من أي تعليق.
    */

    setTimeout(() => {
      clearInterval(timer);
      finishLoader();
    }, 5000);
  }

  function forceShowApplication() {
    const loader =
      DOM.loader ||
      byId("appLoader") ||
      $(".app-loader") ||
      $(".loader") ||
      $("[data-loader]");

    const app =
      DOM.app ||
      byId("app") ||
      $(".app") ||
      $("main");

    if (app) {
      app.classList.add("ready");

      app.style.display = "";
      app.style.visibility = "visible";
      app.style.opacity = "1";
      app.style.pointerEvents = "auto";
    }

    if (loader) {
      loader.style.opacity = "0";
      loader.style.visibility = "hidden";
      loader.style.pointerEvents = "none";

      setTimeout(() => {
        if (loader.parentNode) {
          loader.remove();
        }
      }, 300);
    }
  }

  /* =========================================================
     NAVIGATION
     ========================================================= */

  function bindNavigation() {
    document.addEventListener(
      "click",
      (event) => {
        const button =
          event.target.closest(
            "[data-page]"
          );

        if (!button) return;

        const page =
          button.dataset.page;

        if (!page) return;

        event.preventDefault();

        navigate(page);
      }
    );
  }

  function navigate(page, options = {}) {
    const pageElement =
      byId(`page-${page}`);

    /*
      لو الصفحة موجودة.
    */

    if (pageElement) {
      $$(".page").forEach(
        (element) => {
          element.classList.remove(
            "active",
            "show"
          );
        }
      );

      pageElement.classList.add(
        "active"
      );

      requestAnimationFrame(() => {
        pageElement.classList.add(
          "show"
        );
      });
    }

    /*
      حتى لو الصفحة لا تستخدم
      page-ID، نخلي التنقل لا يكسر التطبيق.
    */

    state.currentPage = page;

    $$("[data-page]").forEach(
      (element) => {
        element.classList.toggle(
          "active",
          element.dataset.page === page
        );
      }
    );

    if (!options.keepScroll) {
      window.scrollTo({
        top: 0,
        behavior: "smooth"
      });
    }

    closeAllOverlays(false);

    saveState();

    window.dispatchEvent(
      new CustomEvent(
        "nexora:navigate",
        {
          detail: { page }
        }
      )
    );
  }

  /* =========================================================
     SEARCH
     ========================================================= */

  function bindGlobalSearch() {
    if (!DOM.globalSearch) return;

    DOM.globalSearch.addEventListener(
      "input",
      (event) => {
        performSearch(
          event.target.value
        );
      }
    );

    DOM.globalSearch.addEventListener(
      "keydown",
      (event) => {
        if (event.key === "Enter") {
          const value =
            event.target.value.trim();

          if (!value) return;

          navigate("discover");

          showToast(
            `نتائج البحث عن: ${value}`,
            "info"
          );
        }

        if (event.key === "Escape") {
          DOM.globalSearch.value = "";
          performSearch("");
          DOM.globalSearch.blur();
        }
      }
    );
  }

  function performSearch(value) {
    const query =
      String(value || "")
        .trim()
        .toLowerCase();

    const searchable =
      $$(
        "[data-searchable], .user-card, .room-card, .game-card, .post-card"
      );

    searchable.forEach(
      (element) => {
        if (!query) {
          element.classList.remove(
            "search-hidden"
          );
          return;
        }

        const text =
          element.textContent
            .toLowerCase();

        element.classList.toggle(
          "search-hidden",
          !text.includes(query)
        );
      }
    );
  }

  /* =========================================================
     CHAT
     ========================================================= */

  function bindChat() {
    if (DOM.sendMessage) {
      DOM.sendMessage.addEventListener(
        "click",
        sendCurrentMessage
      );
    }

    if (DOM.messageInput) {
      DOM.messageInput.addEventListener(
        "keydown",
        (event) => {
          if (
            event.key === "Enter" &&
            !event.shiftKey
          ) {
            event.preventDefault();
            sendCurrentMessage();
          }
        }
      );

      DOM.messageInput.addEventListener(
        "input",
        () => {
          if (
            DOM.messageInput.value.length >
            CONFIG.maxMessageLength
          ) {
            DOM.messageInput.value =
              DOM.messageInput.value.slice(
                0,
                CONFIG.maxMessageLength
              );
          }
        }
      );
    }
  }

  function getCurrentChat() {
    return state.chats.find(
      (chat) =>
        chat.id === state.currentChat
    );
  }

  function openChat(chatId) {
    const chat =
      state.chats.find(
        (item) =>
          item.id === chatId
      );

    if (!chat) return;

    state.currentChat =
      chat.id;

    chat.unread = 0;

    renderChatList();
    renderCurrentChat();

    saveState();

    navigate("messages");
  }

  function renderChatList() {
    const list =
      byId("chatList") ||
      $(".chat-list");

    if (!list) return;

    list.innerHTML =
      state.chats
        .map((chat) => {
          const last =
            chat.messages?.[
              chat.messages.length - 1
            ];

          return `
            <button
              class="chat-item"
              data-chat-id="${escapeHTML(
                chat.id
              )}"
              type="button"
            >

              <span class="chat-avatar-wrap">

                <img
                  class="chat-avatar"
                  src="${escapeHTML(
                    chat.avatar
                  )}"
                  alt=""
                >

                ${
                  chat.online
                    ? `
                      <span
                        class="online-dot"
                      ></span>
                    `
                    : ""
                }

              </span>

              <span class="chat-info">

                <span class="chat-name">
                  ${escapeHTML(
                    chat.name
                  )}
                </span>

                <span class="chat-preview">
                  ${escapeHTML(
                    last?.text ||
                      "ابدأ المحادثة"
                  )}
                </span>

              </span>

              ${
                chat.unread
                  ? `
                    <span
                      class="chat-unread"
                    >
                      ${chat.unread}
                    </span>
                  `
                  : ""
              }

            </button>
          `;
        })
        .join("");

    $$(".chat-item", list).forEach(
      (item) => {
        item.addEventListener(
          "click",
          () => {
            openChat(
              item.dataset.chatId
            );
          }
        );
      }
    );
  }

  function renderCurrentChat() {
    if (!DOM.chatMessages) return;

    const chat =
      getCurrentChat();

    if (!chat) {
      DOM.chatMessages.innerHTML = `
        <div class="empty-state">

          <div class="empty-icon">
            💬
          </div>

          <h3>
            اختر محادثة
          </h3>

          <p>
            ابدأ التواصل مع أصدقائك
            على NEXORA.
          </p>

        </div>
      `;

      return;
    }

    DOM.chatMessages.innerHTML =
      chat.messages
        .map((message) => {
          const mine =
            message.sender === "me";

          const system =
            message.sender ===
            "system";

          return `
            <div
              class="
                message-row
                ${mine ? "mine" : "theirs"}
                ${system ? "system-message" : ""}
              "
            >

              <div class="message-bubble">

                <div class="message-text">
                  ${escapeHTML(
                    message.text
                  )}
                </div>

                <div class="message-time">
                  ${formatTime(
                    message.time
                  )}
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

    const text =
      DOM.messageInput.value.trim();

    if (!text) return;

    let chat =
      getCurrentChat();

    if (!chat) {
      chat = createChat({
        name: "محادثة جديدة"
      });

      state.currentChat =
        chat.id;
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
      لاحقاً:
      WebSocket / Firebase / Supabase
      يمكن توصيله هنا.
    */

    setTimeout(() => {
      simulateIncomingReply(
        chat.id
      );
    }, 900);
  }

  function simulateIncomingReply(
    chatId
  ) {
    const chat =
      state.chats.find(
        (item) =>
          item.id === chatId
      );

    if (!chat) return;

    if (Math.random() > 0.45) {
      return;
    }

    chat.messages.push({
      id: createId("msg"),
      sender: "other",
      text: "وصلت رسالتك ❤️",
      time: now()
    });

    if (
      state.currentChat !==
      chatId
    ) {
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
      name:
        data.name ||
        "مستخدم NEXORA",

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
    const date =
      new Date(timestamp);

    return date.toLocaleTimeString(
      "ar-EG",
      {
        hour: "2-digit",
        minute: "2-digit"
      }
    );
  }

  /* =========================================================
     GLOBAL ACTIONS
     ========================================================= */

  function bindGlobalClicks() {
    document.addEventListener(
      "click",
      (event) => {
        const target =
          event.target;

        /* LIKE */

        const likeButton =
          target.closest(
            "[data-like]"
          );

        if (likeButton) {
          event.preventDefault();

          const liked =
            likeButton.classList.toggle(
              "liked"
            );

          likeButton.dataset.liked =
            liked
              ? "true"
              : "false";

          updateLikeCounter(
            likeButton,
            liked
          );

          if (liked) {
            playSound("like");
          }

          return;
        }

        /* FAVORITE */

        const favoriteButton =
          target.closest(
            "[data-favorite]"
          );

        if (favoriteButton) {
          event.preventDefault();

          toggleFavorite(
            favoriteButton.dataset
              .favorite,
            favoriteButton
          );

          return;
        }

        /* FOLLOW */

        const followButton =
          target.closest(
            "[data-follow]"
          );

        if (followButton) {
          event.preventDefault();

          toggleFollow(
            followButton
          );

          return;
        }

        /* COINS */

        const coinButton =
          target.closest(
            "[data-buy-coins]"
          );

        if (coinButton) {
          event.preventDefault();

          const amount =
            Number(
              coinButton.dataset
                .buyCoins
            ) || 0;

          purchaseCoins(amount);

          return;
        }

        /* GIFT */

        const giftButton =
          target.closest(
            "[data-gift]"
          );

        if (giftButton) {
          event.preventDefault();

          const gift =
            giftButton.dataset
              .gift ||
            "هدية";

          const price =
            Number(
              giftButton.dataset
                .price
            ) || 0;

          sendGift(
            gift,
            price
          );

          return;
        }

        /* ROOM */

        const roomButton =
          target.closest(
            "[data-room-id]"
          );

        if (roomButton) {
          event.preventDefault();

          openRoom(
            roomButton.dataset
              .roomId
          );

          return;
        }

        /* GAME */

        const gameButton =
          target.closest(
            "[data-game]"
          );

        if (gameButton) {
          event.preventDefault();

          openGame(
            gameButton.dataset
              .game
          );

          return;
        }

        /* CLOSE MODAL */

        if (
          target.matches(
            "[data-close-modal]"
          ) ||
          target.closest(
            "[data-close-modal]"
          )
        ) {
          closeModal();
          return;
        }

        /* THEME */

        const themeButton =
          target.closest(
            "[data-theme-toggle]"
          );

        if (themeButton) {
          event.preventDefault();

          toggleTheme();

          return;
        }

        /* SIDEBAR */

        const menuButton =
          target.closest(
            "[data-menu-toggle]"
          );

        if (menuButton) {
          event.preventDefault();

          toggleSidebar();

          return;
        }

        /* VIDEO CALL */

        const videoCallButton =
          target.closest(
            "[data-video-call]"
          );

        if (videoCallButton) {
          event.preventDefault();

          startVideoCall();

          return;
        }

        /* VOICE CALL */

        const voiceCallButton =
          target.closest(
            "[data-voice-call]"
          );

        if (voiceCallButton) {
          event.preventDefault();

          startVoiceCall();

          return;
        }

        /* END CALL */

        const endCallButton =
          target.closest(
            "[data-end-call]"
          );

        if (endCallButton) {
          event.preventDefault();

          endCall();

          return;
        }

        /* NOTIFICATIONS */

        const notificationButton =
          target.closest(
            "[data-notifications]"
          );

        if (notificationButton) {
          event.preventDefault();

          navigate(
            "notifications"
          );

          markNotificationsRead();

          return;
        }
      }
    );
  }

  /* =========================================================
     LIKE
     ========================================================= */

  function updateLikeCounter(
    button,
    liked
  ) {
    const container =
      button.closest(
        "[data-like-container]"
      );

    if (!container) return;

    const counter =
      container.querySelector(
        "[data-like-count]"
      );

    if (!counter) return;

    const current =
      Number(
        counter.textContent.replace(
          /\D/g,
          ""
        )
      ) || 0;

    const next =
      liked
        ? current + 1
        : Math.max(
            0,
            current - 1
          );

    counter.textContent =
      formatNumber(next);
  }

  /* =========================================================
     FAVORITES
     ========================================================= */

  function toggleFavorite(
    id,
    button
  ) {
    if (!id) return;

    const index =
      state.favorites.indexOf(id);

    if (index === -1) {
      state.favorites.push(id);

      button?.classList.add(
        "active"
      );

      showToast(
        "تمت الإضافة إلى المفضلة ⭐",
        "success"
      );
    } else {
      state.favorites.splice(
        index,
        1
      );

      button?.classList.remove(
        "active"
      );

      showToast(
        "تمت الإزالة من المفضلة",
        "info"
      );
    }

    saveState();
  }

  /* =========================================================
     FOLLOW
     ========================================================= */

  function toggleFollow(button) {
    if (!button) return;

    const followed =
      button.dataset.followed ===
      "true";

    button.dataset.followed =
      followed
        ? "false"
        : "true";

    button.classList.toggle(
      "following",
      !followed
    );

    button.textContent =
      followed
        ? "متابعة"
        : "متابَع ✓";

    if (!followed) {
      state.user.following += 1;
    } else {
      state.user.following =
        Math.max(
          0,
          state.user.following - 1
        );
    }

    showToast(
      followed
        ? "تم إلغاء المتابعة"
        : "تمت المتابعة بنجاح ✓",
      followed
        ? "info"
        : "success"
    );

    saveState();
  }

  /* =========================================================
     USER
     ========================================================= */

  function updateUserUI() {
    if (DOM.headerCoins) {
      DOM.headerCoins.textContent =
        formatNumber(
          state.user.coins
        );
    }

    $$("[data-user-name]")
      .forEach((element) => {
        element.textContent =
          state.user.name;
      });

    $$("[data-user-coins]")
      .forEach((element) => {
        element.textContent =
          formatNumber(
            state.user.coins
          );
      });

    $$("[data-user-gems]")
      .forEach((element) => {
        element.textContent =
          formatNumber(
            state.user.gems
          );
      });

    $$("[data-user-level]")
      .forEach((element) => {
        element.textContent =
          state.user.level;
      });

    $$("[data-user-avatar]")
      .forEach((element) => {
        if (
          element.tagName === "IMG"
        ) {
          element.src =
            state.user.avatar;
        } else {
          element.style.backgroundImage =
            `url("${state.user.avatar}")`;
        }
      });

    $$("[data-user-followers]")
      .forEach((element) => {
        element.textContent =
          formatNumber(
            state.user.followers
          );
      });

    $$("[data-user-following]")
      .forEach((element) => {
        element.textContent =
          formatNumber(
            state.user.following
          );
      });
  }

  /* =========================================================
     COINS
     ========================================================= */

  function purchaseCoins(amount) {
    if (
      !amount ||
      amount <= 0
    ) {
      return;
    }

    state.user.coins += amount;

    updateUserUI();

    saveState();

    showToast(
      `تمت إضافة ${formatNumber(
        amount
      )} كوينز 🪙`,
      "success"
    );

    playSound("coins");
  }

  function spendCoins(amount) {
    if (
      !amount ||
      amount <= 0
    ) {
      return true;
    }

    if (
      state.user.coins <
      amount
    ) {
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

  /* =========================================================
     GIFTS
     ========================================================= */

  function sendGift(
    name,
    price
  ) {
    if (
      !spendCoins(price)
    ) {
      return;
    }

    showToast(
      `تم إرسال ${name} 🎁`,
      "success"
    );

    createNotification({
      icon: "🎁",
      title: "هدية",
      text:
        `تم إرسال ${name} بنجاح`
    });

    playSound("gift");
  }

  /* =========================================================
     ROOMS
     ========================================================= */

  function openRoom(roomId) {
    const room =
      state.rooms.find(
        (item) =>
          item.id === roomId
      );

    if (!room) {
      showToast(
        "الغرفة غير موجودة",
        "warning"
      );

      return;
    }

    state.currentRoom =
      room.id;

    saveState();

    openModal(`
      <div class="room-modal">

        <div class="room-modal-icon">
          ${escapeHTML(
            room.icon
          )}
        </div>

        <h2>
          ${escapeHTML(
            room.name
          )}
        </h2>

        <p>
          ${formatNumber(
            room.online
          )}
          شخص متصل الآن
        </p>

        <div class="room-actions">

          <button
            class="primary-btn"
            data-enter-room
            type="button"
          >
            دخول الغرفة
          </button>

          <button
            class="secondary-btn"
            data-close-modal
            type="button"
          >
            إلغاء
          </button>

        </div>

      </div>
    `);

    const enter =
      $("[data-enter-room]");

    if (enter) {
      enter.addEventListener(
        "click",
        () => {
          closeModal();

          showToast(
            `دخلت ${room.name} 🎙️`,
            "success"
          );

          window.dispatchEvent(
            new CustomEvent(
              "nexora:room-enter",
              {
                detail: {
                  room
                }
              }
            )
          );
        }
      );
    }
  }

  /* =========================================================
     GAMES
     ========================================================= */

  function openGame(
    gameName
  ) {
    const game =
      String(
        gameName ||
        "game"
      );

    window.dispatchEvent(
      new CustomEvent(
        "nexora:open-game",
        {
          detail: {
            game
          }
        }
      )
    );

    /*
      لو games.js موجود ومجهز،
      يستخدمه مباشرة.
    */

    if (
      window.NexoraGames &&
      typeof window.NexoraGames.open ===
        "function"
    ) {
      window.NexoraGames.open(
        game
      );

      return;
    }

    /*
      واجهة مؤقتة آمنة لحد
      ما نركب games.js.
    */

    openModal(`
      <div class="game-launcher">

        <div class="game-launcher-icon">
          🎮
        </div>

        <h2>
          ${escapeHTML(game)}
        </h2>

        <p>
          اللعبة جاهزة للربط بمحرك
          الألعاب في games.js.
        </p>

        <button
          class="primary-btn"
          data-close-modal
          type="button"
        >
          رجوع
        </button>

      </div>
    `);
  }

  /* =========================================================
     NOTIFICATIONS
     ========================================================= */

  function createNotification(
    data = {}
  ) {
    state.notifications.unshift({
      id: createId(
        "notification"
      ),

      icon:
        data.icon ||
        "🔔",

      title:
        data.title ||
        "إشعار",

      text:
        data.text ||
        "",

      time: now(),

      read: false
    });

    state.notifications =
      state.notifications.slice(
        0,
        50
      );

    updateNotifications();

    saveState();
  }

  function updateNotifications() {
    const unread =
      state.notifications.filter(
        (item) =>
          !item.read
      ).length;

    $$(
      "[data-notification-count]"
    ).forEach(
      (element) => {
        element.textContent =
          unread;

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

  /* =========================================================
     EMOJI
     ========================================================= */

  function setupEmojiPanel() {
    const panel =
      DOM.emojiPanel;

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

    panel.innerHTML =
      emojis
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

    panel.addEventListener(
      "click",
      (event) => {
        const button =
          event.target.closest(
            "[data-emoji]"
          );

        if (!button) return;

        insertEmoji(
          button.dataset.emoji
        );
      }
    );
  }

  function insertEmoji(
    emoji
  ) {
    if (!DOM.messageInput) {
      return;
    }

    const input =
      DOM.messageInput;

    const start =
      input.selectionStart ??
      input.value.length;

    const end =
      input.selectionEnd ??
      input.value.length;

    input.value =
      input.value.slice(
        0,
        start
      ) +
      emoji +
      input.value.slice(
        end
      );

    input.focus();

    const position =
      start +
      emoji.length;

    input.setSelectionRange(
      position,
      position
    );
  }

  /* =========================================================
     THEME
     ========================================================= */

  function restoreTheme() {
    document.body.classList.toggle(
      "light",
      state.settings.theme ===
        "light"
    );
  }

  function toggleTheme() {
    state.settings.theme =
      state.settings.theme ===
      "dark"
        ? "light"
        : "dark";

    restoreTheme();

    saveState();

    showToast(
      state.settings.theme ===
        "dark"
        ? "تم تفعيل الوضع الداكن 🌙"
        : "تم تفعيل الوضع الفاتح ☀️",
      "info"
    );
  }

  /* =========================================================
     SIDEBAR
     ========================================================= */

  function toggleSidebar() {
    if (!DOM.sidebar) {
      return;
    }

    DOM.sidebar.classList.toggle(
      "open"
    );

    document.body.classList.toggle(
      "sidebar-open",
      DOM.sidebar.classList.contains(
        "open"
      )
    );
  }

  /* =========================================================
     MODAL
     ========================================================= */

  function openModal(
    content
  ) {
    if (!DOM.modalRoot) {
      /*
        لو الـindex القديم لا يحتوي
        modalRoot، ننشئ واحداً تلقائياً.
      */

      const root =
        document.createElement(
          "div"
        );

      root.id =
        "modalRoot";

      document.body.appendChild(
        root
      );

      DOM.modalRoot = root;
    }

    DOM.modalRoot.innerHTML = `
      <div
        class="modal-backdrop"
        data-close-modal
      >

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

    DOM.modalRoot.classList.add(
      "active"
    );

    document.body.classList.add(
      "modal-open"
    );
  }

  function closeModal() {
    if (!DOM.modalRoot) {
      return;
    }

    DOM.modalRoot.classList.remove(
      "active"
    );

    DOM.modalRoot.innerHTML = "";

    document.body.classList.remove(
      "modal-open"
    );
  }

  function closeAllOverlays(
    includeModal = true
  ) {
    if (includeModal) {
      closeModal();
    }

    if (
      DOM.videoCallOverlay
    ) {
      DOM.videoCallOverlay.classList.remove(
        "active"
      );
    }

    if (
      DOM.gameCallOverlay
    ) {
      DOM.gameCallOverlay.classList.remove(
        "active"
      );
    }
  }

  /* =========================================================
     VIDEO CALL
     ========================================================= */

  async function startVideoCall() {
    if (
      DOM.videoCallOverlay
    ) {
      DOM.videoCallOverlay.classList.add(
        "active"
      );

      document.body.classList.add(
        "call-active"
      );
    }

    showToast(
      "جاري تجهيز مكالمة الفيديو 📹",
      "info"
    );

    await requestCameraPermission();

    window.dispatchEvent(
      new CustomEvent(
        "nexora:video-call-start",
        {
          detail: {
            chat:
              getCurrentChat()
          }
        }
      )
    );
  }

  async function requestCameraPermission() {
    if (
      !navigator.mediaDevices ||
      !navigator.mediaDevices.getUserMedia
    ) {
      showToast(
        "المتصفح لا يدعم تشغيل الكاميرا هنا",
        "warning"
      );

      return null;
    }

    try {
      const stream =
        await navigator.mediaDevices.getUserMedia(
          {
            video: true,
            audio: true
          }
        );

      const video =
        DOM.videoCallOverlay?.querySelector(
          "video"
        );

      if (video) {
        video.srcObject =
          stream;

        video.muted = true;

        await video
          .play()
          .catch(() => {});
      }

      return stream;

    } catch (error) {
      console.warn(
        "NEXORA camera permission:",
        error
      );

      showToast(
        "لم يتم السماح بالكاميرا أو الميكروفون",
        "warning"
      );

      return null;
    }
  }

  /* =========================================================
     VOICE CALL
     ========================================================= */

  function startVoiceCall() {
    openCallFallback(
      "voice"
    );
  }

  function openCallFallback(
    type
  ) {
    openModal(`
      <div class="call-modal">

        <div class="call-icon">
          ${
            type === "video"
              ? "📹"
              : "📞"
          }
        </div>

        <h2>
          ${
            type === "video"
              ? "مكالمة فيديو"
              : "مكالمة صوتية"
          }
        </h2>

        <p>
          واجهة الاتصال جاهزة،
          وسيتم توصيل الاتصال الحقيقي
          من خلال طبقة WebRTC.
        </p>

        <button
          class="primary-btn"
          data-close-modal
          type="button"
        >
          إغلاق
        </button>

      </div>
    `);
  }

  function endCall() {
    if (
      DOM.videoCallOverlay
    ) {
      const video =
        DOM.videoCallOverlay.querySelector(
          "video"
        );

      if (
        video &&
        video.srcObject
      ) {
        video.srcObject
          .getTracks()
          .forEach(
            (track) =>
              track.stop()
          );

        video.srcObject =
          null;
      }

      DOM.videoCallOverlay.classList.remove(
        "active"
      );
    }

    if (
      DOM.gameCallOverlay
    ) {
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

    window.dispatchEvent(
      new CustomEvent(
        "nexora:video-call-end"
      )
    );
  }

  /* =========================================================
     GAME + VIDEO
     ========================================================= */

  function startGameCall(
    game
  ) {
    if (
      DOM.gameCallOverlay
    ) {
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

  /* =========================================================
     TOAST
     ========================================================= */

  function showToast(
    message,
    type = "info",
    duration =
      CONFIG.toastDuration
  ) {
    /*
      لو الـindex لا يحتوي
      toast container، ننشئه.
    */

    if (!DOM.toastContainer) {
      DOM.toastContainer =
        document.createElement(
          "div"
        );

      DOM.toastContainer.id =
        "toastContainer";

      DOM.toastContainer.className =
        "toast-container";

      document.body.appendChild(
        DOM.toastContainer
      );
    }

    const toast =
      document.createElement(
        "div"
      );

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

    requestAnimationFrame(
      () => {
        toast.classList.add(
          "show"
        );
      }
    );

    const remove = () => {
      toast.classList.remove(
        "show"
      );

      setTimeout(() => {
        if (toast.parentNode) {
          toast.remove();
        }
      }, 250);
    };

    toast
      .querySelector(
        ".toast-close"
      )
      ?.addEventListener(
        "click",
        remove
      );

    setTimeout(
      remove,
      duration
    );
  }

  /* =========================================================
     SOUND
     ========================================================= */

  let audioContext =
    null;

  function playSound(
    type = "click"
  ) {
    if (
      !state.settings.sound
    ) {
      return;
    }

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
        frequencies[type] ||
        520;

      oscillator.type =
        "sine";

      gain.gain.setValueAtTime(
        0.0001,
        audioContext.currentTime
      );

      gain.gain.exponentialRampToValueAtTime(
        0.045,
        audioContext.currentTime +
          0.015
      );

      gain.gain.exponentialRampToValueAtTime(
        0.0001,
        audioContext.currentTime +
          0.12
      );

      oscillator.start();

      oscillator.stop(
        audioContext.currentTime +
          0.13
      );

    } catch {
      /*
        الصوت اختياري.
      */
    }
  }

  /* =========================================================
     KEYBOARD
     ========================================================= */

  function bindKeyboardShortcuts() {
    document.addEventListener(
      "keydown",
      (event) => {
        const active =
          document.activeElement;

        const typing =
          active &&
          (
            active.tagName ===
              "INPUT" ||
            active.tagName ===
              "TEXTAREA" ||
            active.isContentEditable
          );

        if (
          event.key === "/" &&
          !typing
        ) {
          event.preventDefault();

          DOM.globalSearch?.focus();

          return;
        }

        if (
          event.key ===
          "Escape"
        ) {
          closeModal();

          closeAllOverlays(
            false
          );
        }
      }
    );
  }

  /* =========================================================
     ONLINE / OFFLINE
     ========================================================= */

  window.addEventListener(
    "online",
    () => {
      state.user.online =
        true;

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
      state.user.online =
        false;

      showToast(
        "أنت الآن غير متصل بالإنترنت",
        "warning"
      );

      saveState();
    }
  );

  /* =========================================================
     PAGE EVENTS
     ========================================================= */

  window.addEventListener(
    "nexora:navigate",
    (event) => {
      const page =
        event.detail?.page;

      if (
        page ===
        "notifications"
      ) {
        markNotificationsRead();
      }

      if (
        page ===
        "messages"
      ) {
        renderChatList();
        renderCurrentChat();
      }

      if (
        page ===
        "profile"
      ) {
        updateUserUI();
      }
    }
  );

  /* =========================================================
     PUBLIC API
     ========================================================= */

  window.Nexora = {
    get state() {
      return state;
    },

    navigate,

    showToast,

    openModal,
    closeModal,

    openChat,
    createChat,

    sendMessage:
      sendCurrentMessage,

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
      cacheDOM();

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

  /* =========================================================
     EXTERNAL EVENTS
     ========================================================= */

  window.addEventListener(
    "nexora:add-coins",
    (event) => {
      const amount =
        Number(
          event.detail?.amount
        ) || 0;

      if (amount <= 0) {
        return;
      }

      purchaseCoins(
        amount
      );
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

  /* =========================================================
     START
     ========================================================= */

  if (
    document.readyState ===
    "loading"
  ) {
    document.addEventListener(
      "DOMContentLoaded",
      init,
      {
        once: true
      }
    );
  } else {
    init();
  }

})();
