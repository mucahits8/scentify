export type NotificationKind = "social" | "reminder" | "wishlist";

export interface AppNotification {
  id: string;
  type: NotificationKind;
  title: string;
  body: string;
  createdAt: string;
  readAt: string | null;
  target: {
    route: string;
    exists: boolean;
  };
}

const notificationsSeed: AppNotification[] = [
  {
    id: "n-1",
    type: "social",
    title: "Topluluk notu yükseldi",
    body: "Amouage Reflection için yeni bir inceleme eklendi.",
    createdAt: new Date(Date.now() - 1000 * 60 * 35).toISOString(),
    readAt: null,
    target: { route: "/perfume/8f3e7f10-6d8d-4a16-9034-4f2c61f6c2a0", exists: true },
  },
  {
    id: "n-2",
    type: "social",
    title: "Gönderine yeni yorum geldi",
    body: "Toplulukta paylaşımına bir yanıt geldi.",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 7).toISOString(),
    readAt: null,
    target: { route: "/post/p-1", exists: true },
  },
  {
    id: "n-3",
    type: "reminder",
    title: "Haftalık Scent DNA güncellemesi hazır",
    body: "Yeni keşiflerden sonra profilin güncellendi.",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 30).toISOString(),
    readAt: new Date(Date.now() - 1000 * 60 * 60 * 20).toISOString(),
    target: { route: "/dna/detail", exists: false },
  },
];

let inMemoryNotifications = [...notificationsSeed];
const listeners = new Set<() => void>();

function emitChange() {
  listeners.forEach((listener) => {
    try {
      listener();
    } catch {}
  });
}

function sortByDateDesc(items: AppNotification[]) {
  return [...items].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
}

export async function listNotifications() {
  return sortByDateDesc(inMemoryNotifications);
}

export async function markNotificationRead(id: string) {
  inMemoryNotifications = inMemoryNotifications.map((item) =>
    item.id === id ? { ...item, readAt: item.readAt ?? new Date().toISOString() } : item,
  );
  emitChange();
  return sortByDateDesc(inMemoryNotifications);
}

export async function markAllNotificationsRead() {
  const now = new Date().toISOString();
  inMemoryNotifications = inMemoryNotifications.map((item) => ({ ...item, readAt: item.readAt ?? now }));
  emitChange();
  return sortByDateDesc(inMemoryNotifications);
}

export async function pushInAppNotification(args: {
  type?: NotificationKind;
  title: string;
  body: string;
  route: string;
  exists?: boolean;
}) {
  const notification: AppNotification = {
    id: `n-${Date.now()}`,
    type: args.type ?? "social",
    title: args.title.trim(),
    body: args.body.trim(),
    createdAt: new Date().toISOString(),
    readAt: null,
    target: {
      route: args.route,
      exists: args.exists ?? true,
    },
  };
  inMemoryNotifications = [notification, ...inMemoryNotifications];
  emitChange();
  return notification;
}

export function subscribeNotifications(onChange: () => void) {
  listeners.add(onChange);
  return () => {
    listeners.delete(onChange);
  };
}
