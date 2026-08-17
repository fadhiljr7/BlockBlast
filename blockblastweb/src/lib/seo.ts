import { useEffect } from 'react'
import { SITE } from '../data/site'
import { FAQ_CATEGORIES } from '../data/faq'

export type PageMeta = {
  title: string
  description: string
  /** Path relative to the site root, always with a leading slash. */
  path: string
  jsonLd: readonly object[]
}

const softwareApplication = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: SITE.name,
  alternateName: SITE.shortName,
  applicationCategory: 'GameApplication',
  applicationSubCategory: 'Puzzle',
  operatingSystem: 'iOS 26.5 or later',
  description: SITE.description,
  url: SITE.url,
  softwareVersion: '1.0',
  inLanguage: ['en', 'id'],
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'USD',
    availability: 'https://schema.org/PreOrder',
  },
  accessibilityFeature: [
    'alternativeText',
    'audioDescription',
    'highContrastDisplay',
    'structuralNavigation',
    'synchronizedAudioText',
    'tactileObject',
  ],
  accessibilityHazard: ['noFlashingHazard', 'noMotionSimulationHazard', 'noSoundHazard'],
  accessibilityAPI: 'ARIA',
  accessibilityControl: [
    'fullTouchControl',
    'fullKeyboardControl',
    'fullSwitchControl',
    'fullVoiceControl',
  ],
  accessibilitySummary:
    'Fully playable without sight or colour vision. Every block carries a pattern, a spoken name and a distinct pitch; the board can be scanned by ear through spatial audio; and placement works by drag, by tap-tap or by dwell.',
}

const faqPage = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: FAQ_CATEGORIES.flatMap((category) =>
    category.entries.map((entry) => ({
      '@type': 'Question',
      name: entry.question,
      acceptedAnswer: { '@type': 'Answer', text: entry.answer },
    })),
  ),
}

function breadcrumb(name: string, path: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE.url}/` },
      { '@type': 'ListItem', position: 2, name, item: `${SITE.url}${canonicalPath(path)}` },
    ],
  }
}

export const PAGE_META: Record<string, PageMeta> = {
  '/': {
    title: 'Block Blast: Accessible Edition — A Puzzle Game for Everyone',
    description: SITE.description,
    path: '/',
    jsonLd: [softwareApplication],
  },
  '/support': {
    title: 'Support — Block Blast: Accessible Edition',
    description:
      'Help with Block Blast: VoiceOver setup, colour blind settings, haptics, iCloud sync and troubleshooting. Accessibility questions answered within 24 hours.',
    path: '/support',
    jsonLd: [faqPage, breadcrumb('Support', '/support')],
  },
  '/privacy': {
    title: 'Privacy Policy — Block Blast: Accessible Edition',
    description:
      'How Block Blast handles your data: no ads, no trackers, no third-party analytics, and accessibility settings that never leave your device.',
    path: '/privacy',
    jsonLd: [breadcrumb('Privacy Policy', '/privacy')],
  },
}

export const NOT_FOUND_META: PageMeta = {
  title: 'Page not found — Block Blast: Accessible Edition',
  description: SITE.description,
  path: '/404',
  jsonLd: [],
}

/**
 * The address a static host actually serves this route from.
 *
 * Every route except the root is prerendered as `<route>/index.html`, and hosts
 * (GitHub Pages included) redirect `/support` to `/support/` before serving it.
 * Canonical tags and the sitemap therefore use the trailing-slash form, so they
 * name the final URL rather than one that redirects.
 */
export function canonicalPath(path: string): string {
  return path === '/' ? '/' : `${path.replace(/\/+$/, '')}/`
}

export function metaForPath(pathname: string): PageMeta {
  const normalised = pathname.length > 1 ? pathname.replace(/\/+$/, '') : pathname
  return PAGE_META[normalised || '/'] ?? NOT_FOUND_META
}

function setTag(selector: string, create: () => HTMLElement, attribute: string, value: string) {
  let element = document.head.querySelector<HTMLElement>(selector)
  if (!element) {
    element = create()
    document.head.appendChild(element)
  }
  element.setAttribute(attribute, value)
}

/**
 * Keeps the document head in step with client-side navigation. The prerendered
 * HTML already carries the correct tags for a cold load, so this only matters
 * once the router takes over — but a crawler that executes JavaScript, and a
 * screen reader announcing the new page title, both depend on it.
 */
export function useSeo(meta: PageMeta) {
  useEffect(() => {
    document.title = meta.title
    const canonical = `${SITE.url}${canonicalPath(meta.path)}`

    setTag(
      'meta[name="description"]',
      () => Object.assign(document.createElement('meta'), { name: 'description' }),
      'content',
      meta.description,
    )
    setTag(
      'link[rel="canonical"]',
      () => Object.assign(document.createElement('link'), { rel: 'canonical' }),
      'href',
      canonical,
    )
    for (const [property, value] of [
      ['og:title', meta.title],
      ['og:description', meta.description],
      ['og:url', canonical],
    ] as const) {
      setTag(
        `meta[property="${property}"]`,
        () => {
          const element = document.createElement('meta')
          element.setAttribute('property', property)
          return element
        },
        'content',
        value,
      )
    }
    for (const [name, value] of [
      ['twitter:title', meta.title],
      ['twitter:description', meta.description],
    ] as const) {
      setTag(
        `meta[name="${name}"]`,
        () => Object.assign(document.createElement('meta'), { name }),
        'content',
        value,
      )
    }
  }, [meta])
}

/** Serialises structured data for injection into prerendered HTML. */
export function jsonLdScripts(meta: PageMeta): string {
  return meta.jsonLd
    .map(
      (entry) =>
        `<script type="application/ld+json">${JSON.stringify(entry).replace(/</g, '\\u003c')}</script>`,
    )
    .join('\n    ')
}
