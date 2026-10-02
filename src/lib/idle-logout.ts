/**
 * Registry of "save my unsaved changes" handlers, so the idle-timeout logout
 * (see src/components/idle-timeout.tsx) can flush in-progress form edits
 * before signing the user out. A form with local draft state registers
 * itself here on mount/update and deregisters on unmount; it decides for
 * itself whether it's actually dirty before doing any work.
 */
type FlushHandler = () => Promise<unknown> | void;

const handlers = new Map<string, FlushHandler>();

export function registerFlush(key: string, handler: FlushHandler) {
  handlers.set(key, handler);
}

export function unregisterFlush(key: string) {
  handlers.delete(key);
}

export async function flushAll(): Promise<void> {
  await Promise.all(
    [...handlers.values()].map((handler) =>
      Promise.resolve()
        .then(handler)
        .catch(() => {
          // Best-effort: a save failing at logout time shouldn't block sign-out.
        }),
    ),
  );
}
