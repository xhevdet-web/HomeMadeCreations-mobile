import { apiSlice } from '../apiSlice';
import { NOTIFICATION_URL } from '../constants';

/** An update in the signed-in customer's notification centre. */
export interface AppNotification {
  id: string;
  orderId: string | null;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

function parseNotifications(value: unknown): AppNotification[] {
  if (!Array.isArray(value)) throw new Error('The server returned an invalid notification list.');
  return value.filter((item): item is AppNotification =>
    !!item && typeof item.id === 'string' && typeof item.title === 'string'
    && typeof item.message === 'string' && typeof item.createdAt === 'string');
}

/**
 * The signed-in customer's own notifications. The API scopes everything to the session, so
 * no request names a user. Reading changes invalidate the list and the bell's count, so
 * the badge updates at once; the open screen is also patched immediately.
 */
export const notificationSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getNotifications: builder.query<AppNotification[], void>({
      query: () => ({ url: NOTIFICATION_URL, auth: true }),
      transformResponse: parseNotifications,
      providesTags: ['Notification'],
    }),
    getUnreadNotificationCount: builder.query<number, void>({
      query: () => ({ url: `${NOTIFICATION_URL}/unread-count`, auth: true }),
      transformResponse: (value: { count?: unknown } | null) =>
        Number.isSafeInteger(value?.count) ? (value!.count as number) : 0,
      providesTags: ['Notification'],
    }),
    markNotificationRead: builder.mutation<unknown, string>({
      query: (id) => ({ url: `${NOTIFICATION_URL}/${encodeURIComponent(id)}/read`, method: 'PATCH', auth: true }),
      async onQueryStarted(id, { dispatch, queryFulfilled }) {
        const list = dispatch(notificationSlice.util.updateQueryData('getNotifications', undefined, (draft) => {
          const entry = draft.find((item) => item.id === id);
          if (entry) entry.isRead = true;
        }));
        const count = dispatch(notificationSlice.util.updateQueryData('getUnreadNotificationCount', undefined,
          (draft) => Math.max(draft - 1, 0)));
        try { await queryFulfilled; } catch { list.undo(); count.undo(); }
      },
      invalidatesTags: ['Notification'],
    }),
    markAllNotificationsRead: builder.mutation<unknown, void>({
      query: () => ({ url: `${NOTIFICATION_URL}/read-all`, method: 'PATCH', auth: true }),
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        const list = dispatch(notificationSlice.util.updateQueryData('getNotifications', undefined, (draft) => {
          for (const item of draft) item.isRead = true;
        }));
        const count = dispatch(notificationSlice.util.updateQueryData('getUnreadNotificationCount', undefined, () => 0));
        try { await queryFulfilled; } catch { list.undo(); count.undo(); }
      },
      invalidatesTags: ['Notification'],
    }),
  }),
});

export const {
  useGetNotificationsQuery,
  useGetUnreadNotificationCountQuery,
  useMarkNotificationReadMutation,
  useMarkAllNotificationsReadMutation,
} = notificationSlice;
