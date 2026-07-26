'use client';

import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { Bell } from 'lucide-react';
import { useEffect, useState } from 'react';

import { appEnv } from '@/config/env';
import { useAuthStore } from '@/stores/auth.store';

interface Notification {
  id: string;
  message: string;
  read: boolean;
  timestamp: Date;
}

export function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const user = useAuthStore((s) => s.user);
  const token = useAuthStore((s) => s.accessToken);

  useEffect(() => {
    if (!user || !token) return;

    const eventSource = new EventSource(`${appEnv.apiBaseUrl}/stream/events?token=${token}`, {
      withCredentials: true,
    });

    eventSource.addEventListener('notification', (event) => {
      try {
        const data = JSON.parse(event.data);
        setNotifications((prev) => [
          {
            id: data.id,
            message: data.message,
            read: data.read ?? false,
            timestamp: new Date(data.timestamp),
          },
          ...prev,
        ]);
      } catch (e) {
        console.error('Failed to parse notification event:', e);
      }
    });

    return () => {
      eventSource.close();
    };
  }, [user, token]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button className="relative flex items-center justify-center w-10 h-10 rounded-full bg-surface border border-border text-foreground hover:bg-muted/10 transition-colors">
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute top-0 right-0 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold leading-none text-white transform translate-x-1/4 -translate-y-1/4 bg-red-600 rounded-full">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          className="w-80 bg-popover text-popover-foreground rounded-lg shadow-lg border border-border p-2 mr-4 z-50 overflow-hidden"
          align="end"
          sideOffset={8}
        >
          <div className="flex items-center justify-between px-3 py-2 border-b border-border">
            <h3 className="font-semibold">Notifications</h3>
            {unreadCount > 0 && (
              <button
                onClick={() => setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))}
                className="text-xs text-accent hover:underline"
              >
                Mark all as read
              </button>
            )}
          </div>
          
          <div className="max-h-80 overflow-y-auto mt-2">
            {notifications.length === 0 ? (
              <p className="px-3 py-4 text-sm text-center text-muted">No notifications yet.</p>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif.id}
                  className={`px-3 py-3 rounded-md text-sm transition-colors ${
                    notif.read ? 'opacity-70' : 'bg-accent/10 font-medium'
                  }`}
                  onClick={() => {
                    setNotifications((prev) =>
                      prev.map((n) => (n.id === notif.id ? { ...n, read: true } : n))
                    );
                  }}
                >
                  <p>{notif.message}</p>
                  <span className="text-xs text-muted block mt-1">
                    {notif.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))
            )}
          </div>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
