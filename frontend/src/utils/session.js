import { api, setActivityListener } from './api';

const WARNING_THRESHOLD_MS = 60_000;
const POLL_INTERVAL_MS = 30_000;
const IMMEDIATE_POLL_THROTTLE_MS = 15_000;

let callbacks = { onWarn: null, onCancel: null, onTick: null };
let expiresAt = null;
let bannerVisible = false;
let pollTimer = null;
let tickTimer = null;
let lastImmediatePollAt = 0;
let stopped = false;

function attachActivityListeners() {
  const handler = () => {
    if (!bannerVisible) return;
    immediatePoll();
  };
  ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'].forEach(eventName => {
    window.addEventListener(eventName, handler, { passive: true });
  });
}

async function poll() {
  try {
    const data = await api.auth.session();
    if (data && typeof data.remainingMs === 'number') {
      expiresAt = Date.now() + data.remainingMs;
    }
  } catch (e) {
    // 401 is handled centrally (toast + redirect); nothing to do here
  }
}

async function immediatePoll() {
  const now = Date.now();
  if (now - lastImmediatePollAt < IMMEDIATE_POLL_THROTTLE_MS) return;
  lastImmediatePollAt = now;
  await poll();
  evaluateWarning();
}

function evaluateWarning() {
  if (expiresAt == null) return;
  const remaining = expiresAt - Date.now();
  if (bannerVisible && remaining > WARNING_THRESHOLD_MS) {
    bannerVisible = false;
    if (callbacks.onCancel) callbacks.onCancel();
    return;
  }
  if (!bannerVisible && remaining > 0 && remaining <= WARNING_THRESHOLD_MS) {
    bannerVisible = true;
    if (callbacks.onWarn) callbacks.onWarn();
  }
  if (bannerVisible && callbacks.onTick) {
    callbacks.onTick(Math.max(0, remaining));
  }
}

export function startSessionTracking(cbs) {
  callbacks = { onWarn: null, onCancel: null, onTick: null, ...cbs };
  stopped = false;
  attachActivityListeners();
  setActivityListener(() => {
    if (bannerVisible) immediatePoll();
  });
  poll();
  pollTimer = setInterval(() => {
    poll().then(evaluateWarning);
  }, POLL_INTERVAL_MS);
  tickTimer = setInterval(evaluateWarning, 1_000);
}

export function stopSessionTracking() {
  stopped = true;
  if (pollTimer) clearInterval(pollTimer);
  if (tickTimer) clearInterval(tickTimer);
  pollTimer = null;
  tickTimer = null;
  setActivityListener(null);
}

export function cancelSessionWarning() {
  bannerVisible = false;
}

export async function renewSession() {
  try {
    const data = await api.auth.renew();
    if (data && typeof data.remainingMs === 'number') {
      expiresAt = Date.now() + data.remainingMs;
      bannerVisible = false;
      if (callbacks.onCancel) callbacks.onCancel();
    }
  } catch (e) {
    // 401 is handled centrally (toast + redirect); nothing to do here
  }
}
