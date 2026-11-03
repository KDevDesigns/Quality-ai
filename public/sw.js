// QA Hub's service worker: shows device notifications (Web Push) even when no QA Hub tab is open.
// The server sends { title, body, url, tag, tone, count, stack? } (see lib/push/message.ts). With the person's
// "Show message previews" off, it holds no ticket text.
//
// Sound: a service worker can't play audio, and browsers can't attach a custom sound to a notification. So when a QA
// Hub tab is on screen, it's asked to play the person's tone and the notification is shown silently; when no tab can
// play it (closed, behind other windows, or never clicked: browsers block sound until then), the device's own
// notification sound plays instead. Hidden tabs aren't asked: a sleeping one answers late or not at all, and on Android
// one can report "played" while no sound comes out.

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));

/** Asks one tab to play the tone; true if it did. Gives up after 0.6 s so the notification is never held back long. */
function askToPlay(client, tone) {
  return new Promise((resolve) => {
    const channel = new MessageChannel();
    const timer = setTimeout(() => resolve(false), 600);
    channel.port1.onmessage = (e) => {
      clearTimeout(timer);
      resolve(e.data === true);
    };
    client.postMessage({ type: "qa-hub:play-tone", tone }, [channel.port2]);
  });
}

const qaHubTabs = () => self.clients.matchAll({ type: "window", includeUncontrolled: true });

async function playInATab(tone) {
  const tabs = (await qaHubTabs()).filter((t) => t.visibilityState === "visible");
  // The tab the person is looking at first, so only one tab plays.
  tabs.sort((a, b) => Number(b.focused) - Number(a.focused));
  for (const tab of tabs) if (await askToPlay(tab, tone)) return true;
  return false;
}

/** Open tabs update the bell, the counts and the page now instead of at their next check. */
async function refreshTabs() {
  for (const tab of await qaHubTabs()) tab.postMessage({ type: "qa-hub:refresh" });
}

self.addEventListener("push", (event) => {
  let msg = { title: "QA Hub", body: "Something new in QA Hub", url: "/", tag: "qa-hub", tone: "" };
  try {
    msg = { ...msg, ...event.data.json() };
  } catch {
    // An empty or unreadable push still shows the plain message above.
  }
  event.waitUntil(
    (async () => {
      // Replies on a ticket whose notification is still showing stack into one: the newest message, then
      // "3 new replies · Module: Billing". Opening the ticket closes it (see mark-read.tsx), so the count is what's unread.
      let replies = 0;
      let body = msg.body;
      if (msg.stack) {
        const [shown] = await self.registration.getNotifications({ tag: msg.tag });
        replies = (shown?.data?.replies ?? 0) + 1;
        if (replies > 1) body = `${msg.stack.line}\n${replies} new replies · ${msg.stack.detail}`;
      }
      const silent = msg.tone === "silent" || (!!msg.tone && (await playInATab(msg.tone)));
      await self.registration.showNotification(msg.title, {
        body,
        tag: msg.tag,
        renotify: true,
        silent,
        icon: "/dcwd-seal.png",
        badge: "/dcwd-seal.png",
        data: { url: msg.url, replies },
      });
      // The unread count on the installed app's icon, even with QA Hub closed.
      if (typeof msg.count === "number") {
        await (msg.count > 0 ? self.navigator.setAppBadge?.(msg.count) : self.navigator.clearAppBadge?.())?.catch(() => {});
      }
      await refreshTabs();
    })(),
  );
});

// Clicking it opens the ticket: in a QA Hub tab that's already open if there is one, otherwise a new one.
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = new URL(event.notification.data?.url ?? "/", self.location.origin).href;
  event.waitUntil(
    (async () => {
      const tabs = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
      const tab = tabs.find((c) => new URL(c.url).origin === self.location.origin);
      if (tab) {
        await tab.focus();
        return tab.navigate(url).catch(() => self.clients.openWindow(url));
      }
      return self.clients.openWindow(url);
    })(),
  );
});
