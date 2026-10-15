import type { ReactNode } from 'react'

/**
 * 极简 Markdown 渲染器（无第三方依赖）。
 *
 * 支持：## / ### 标题、无序与有序列表、段落、**加粗**、`行内代码`、空行分段。
 * 博客内容来自本地数据，不涉及 HTML 注入，因此无需 sanitize。
 */
export default function MarkdownLite({ content }: { content: string }) {
  const lines = content.split('\n')
  const blocks: ReactNode[] = []

  let paragraph: string[] = []
  let listItems: string[] = []
  let ordered = false

  const flushParagraph = () => {
    if (paragraph.length === 0) return
    const key = `p-${blocks.length}`
    blocks.push(
      <p key={key} className="text-sm leading-7 text-night-200 sm:text-base">
        {renderInline(paragraph.join(' '), key)}
      </p>,
    )
    paragraph = []
  }

  const flushList = () => {
    if (listItems.length === 0) return
    const key = `list-${blocks.length}`
    const items = listItems.map((item, index) => (
      <li key={`${key}-${index}`}>{renderInline(item, `${key}-${index}`)}</li>
    ))

    if (ordered) {
      blocks.push(
        <ol
          key={key}
          className="list-decimal space-y-2 pl-5 text-sm leading-7 text-night-200 marker:text-aurora-300 sm:text-base"
        >
          {items}
        </ol>,
      )
    } else {
      blocks.push(
        <ul
          key={key}
          className="list-disc space-y-2 pl-5 text-sm leading-7 text-night-200 marker:text-aurora-400/70 sm:text-base"
        >
          {items}
        </ul>,
      )
    }

    listItems = []
    ordered = false
  }

  lines.forEach((rawLine) => {
    const line = rawLine.trimEnd()

    if (line.trim().length === 0) {
      flushParagraph()
      flushList()
      return
    }

    const heading = /^(#{2,4})\s+(.*)$/.exec(line)
    if (heading) {
      flushParagraph()
      flushList()
      const level = heading[1].length
      const text = heading[2]
      const key = `h-${blocks.length}`

      if (level === 2) {
        blocks.push(
          <h2 key={key} className="mt-2 text-xl font-semibold text-white sm:text-2xl">
            {renderInline(text, key)}
          </h2>,
        )
      } else {
        blocks.push(
          <h3 key={key} className="mt-1 text-base font-semibold text-white sm:text-lg">
            {renderInline(text, key)}
          </h3>,
        )
      }
      return
    }

    const orderedItem = /^\d+[.)]\s+(.*)$/.exec(line)
    if (orderedItem) {
      flushParagraph()
      if (!ordered) flushList()
      ordered = true
      listItems.push(orderedItem[1])
      return
    }

    const bulletItem = /^[-*·]\s+(.*)$/.exec(line)
    if (bulletItem) {
      flushParagraph()
      if (ordered) flushList()
      ordered = false
      listItems.push(bulletItem[1])
      return
    }

    flushList()
    paragraph.push(line.trim())
  })

  flushParagraph()
  flushList()

  return <div className="space-y-5">{blocks}</div>
}

/** 处理 **加粗** 与 `行内代码`。 */
function renderInline(text: string, keyPrefix: string): ReactNode[] {
  const nodes: ReactNode[] = []
  const pattern = /(\*\*[^*]+\*\*|`[^`]+`)/g

  let lastIndex = 0
  let match = pattern.exec(text)
  let index = 0

  while (match !== null) {
    if (match.index > lastIndex) {
      nodes.push(text.slice(lastIndex, match.index))
    }

    const token = match[0]
    if (token.startsWith('**')) {
      nodes.push(
        <strong key={`${keyPrefix}-strong-${index}`} className="font-semibold text-white">
          {token.slice(2, -2)}
        </strong>,
      )
    } else {
      nodes.push(
        <code
          key={`${keyPrefix}-code-${index}`}
          className="rounded border border-night-600 bg-night-800/80 px-1.5 py-0.5 font-mono text-[0.85em] text-aurora-200"
        >
          {token.slice(1, -1)}
        </code>,
      )
    }

    lastIndex = match.index + token.length
    index += 1
    match = pattern.exec(text)
  }

  if (lastIndex < text.length) {
    nodes.push(text.slice(lastIndex))
  }

  return nodes
}
