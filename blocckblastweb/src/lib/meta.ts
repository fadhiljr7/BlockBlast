import { useEffect } from 'react'
import { SITE } from '../data/site'

/**
 * The site is a client-rendered SPA, so each route sets its own title and
 * description on mount rather than getting one from the server.
 */
export function usePageMeta(title: string, description: string) {
  useEffect(() => {
    document.title = `${title} · ${SITE.shortName}`

    const tag = document.querySelector('meta[name="description"]')
    const previous = tag?.getAttribute('content') ?? null
    tag?.setAttribute('content', description)

    return () => {
      if (tag && previous !== null) tag.setAttribute('content', previous)
    }
  }, [title, description])
}
