import type { TextMeta } from './types'

/** Shows the author and source of a quotation, or the category of a passage. */
export function TextAttribution({ meta }: { meta: TextMeta }) {
  if (meta.author) {
    return (
      <p className="truncate">
        <span className="text-muted">{meta.author}</span>
        {meta.source && <span>{` \u00b7 ${meta.source}`}</span>}
      </p>
    )
  }
  if (meta.label) return <p className="truncate">{meta.label}</p>
  return null
}
