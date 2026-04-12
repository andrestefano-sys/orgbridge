/**
 * NOTE: The invite page lives at app/invite/page.tsx (standalone, outside this layout group).
 * This file must be DELETED to avoid a Next.js conflicting-routes build error.
 *
 * To fix: delete this file (apps/web/app/(auth)/invite/page.tsx).
 *
 * During development Next.js uses app/invite/page.tsx and ignores this one,
 * but `next build` will fail until this file is removed.
 */

// Temporary re-export so dev server doesn't crash with a missing-default error.
// Remove this entire file when possible.
export { default } from '../../invite/page'
