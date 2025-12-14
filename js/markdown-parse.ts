// tinymark.ts  （直接复制就能跑！）
type Node =
    | { type: 'document'; children: Node[] }
    | { type: 'heading'; level: number; children: Inline[] }
    | { type: 'paragraph'; children: Inline[] }
    | { type: 'code'; lang: string; text: string }
    | { type: 'blockquote'; children: Node[] }
    | { type: 'list'; ordered: boolean; start?: number; tight: boolean; children: ListItem[] }
    | { type: 'listItem'; children: Node[] }
    | { type: 'thematicBreak' }
    | { type: 'text'; text: string }
    | { type: 'strong'; children: Inline[] }
    | { type: 'emph'; children: Inline[] }
    | { type: 'delete'; children: Inline[] }
    | { type: 'codespan'; text: string }
    | { type: 'link'; href: string; title?: string; children: Inline[] }
    | { type: 'image'; alt: string; src: string; title?: string }

type Inline = Extract<Node, { children?: Node[] }>

export class TinyMark {
    static parse(md: string): Node {
        const parser = new Parser(md)
        return parser.parse()
    }

    static toHTML(node: Node): string {
        const renderer = new HTMLRenderer()
        return renderer.render(node)
    }
}

// 主解析器
class Parser {
    lines: string[]
    pos = 0

    constructor(private src: string) {
        this.lines = src.replace(/\r\n/g, '\n').split('\n')
    }

    parse(): Node {
        const root: Node = { type: 'document', children: [] }
        const stack: Node[] = [root]

        while (this.pos < this.lines.length) {
            const line = this.lines[this.pos]

            // 空行处理
            if (!line.trim()) {
                this.closeListIfNeeded(stack)
                this.pos++
                continue
            }

            // 标题
            if (line.match(/^#{1,6}\s/)) {
                this.closeListIfNeeded(stack)
                stack[stack.length - 1].children.push(this.parseHeading(line))
                this.pos++
                continue
            }

            // 代码块（fenced）
            if (line.trimStart().startsWith('```') || line.trimStart().startsWith('~~~')) {
                this.closeListIfNeeded(stack)
                const code = this.parseFencedCode()
                stack[stack.length - 1].children.push(code)
                continue
            }

            // 缩进代码块（较少用，先跳过简化）

            // 引用
            if (line.trimStart().startsWith('>')) {
                const block = this.parseBlockquote()
                stack[stack.length - 1].children.push(block)
                continue
            }

            // 列表
            if (this.isListLine(line)) {
                this.parseList(stack)
                continue
            }

            // 水平线
            if (/^ {0,3}(?:[-*_])\s*\1\s*\1(?:\s*[-*_])*$/.test(line.trim())) {
                this.closeListIfNeeded(stack)
                stack[stack.length - 1].children.push({ type: 'thematicBreak' })
                this.pos++
                continue
            }

            // 段落（默认）
            const paragraph = this.parseParagraph()
            if (paragraph) {
                ; (stack[stack.length - 1] as any).children.push(paragraph)
            }
        }

        return root
    }

    private parseHeading(line: string): Node {
        const match = line.match(/^(#{1,6})\s+(.*?)(\s+#*)?$/)
        const level = match![1].length
        const text = match![2]
        return { type: 'heading', level, children: this.parseInlines(text) }
    }

    private parseFencedCode(): Node {
        const fence = this.lines[this.pos].trimStart().match(/^(`{3,}|~{3,})/)![1]
        const lang = this.lines[this.pos].slice(this.lines[this.pos].indexOf(fence) + fence.length).trim()
        this.pos++

        const content: string[] = []
        while (this.pos < this.lines.length && !this.lines[this.pos].includes(fence)) {
            content.push(this.lines[this.pos])
            this.pos++
        }
        this.pos++ // 跳过结束行

        return { type: 'code', lang, text: content.join('\n').replace(/\n$/, '') }
    }

    private parseBlockquote(): Node {
        const block: Node = { type: 'blockquote', children: [] }
        while (this.pos < this.lines.length) {
            const line = this.lines[this.pos]
            if (line.trimStart().startsWith('>')) {
                const content = line.replace(/^>\s?/, '')
                if (content) {
                    const tempParser = new Parser(content + '\n\n')
                    const nodes = tempParser.parse().children
                    block.children.push(...nodes)
                }
                this.pos++
            } else if (!line.trim() && this.lines[this.pos + 1]?.trimStart().startsWith('>')) {
                this.pos++
            } else {
                break
            }
        }
        return block
    }

    private isListLine(line: string): boolean {
        return /^(\s*)([*-]|\d+[.)])\s/.test(line)
    }

    private parseList(stack: Node[]) {
        // 简化版：一次性解析整个列表
        const items: Node[] = []
        let ordered = false
        let start: number | undefined
        let tight = true

        while (this.pos < this.lines.length) {
            const line = this.lines[this.pos]
            const match = line.match(/^(\s*)([*-]|\d+[.)])\s+(.*)/)
            if (!match) {
                if (line.trim() === '') tight = false
                if (!this.isListLine(this.lines[this.pos + 1] || '')) break
                this.pos++
                continue
            }

            const indent = match[1].length
            const marker = match[2]
            const content = match[3]

            if (!ordered && /\d+[.)]/.test(marker)) {
                ordered = true
                start = parseInt(marker)
            }

            const item: Node = { type: 'listItem', children: [] }
            const temp = new Parser(content + '\n\n')
            item.children.push(...temp.parse().children.filter(n => n.type !== 'document'))
            items.push(item)
            this.pos++
        }

        const list: Node = { type: 'list', ordered, start, tight, children: items as any }
        this.closeListIfNeeded(stack)
        stack[stack.length - 1].children.push(list)
    }

    private parseParagraph(): Node | null {
        let content = ''
        const startPos = this.pos

        while (this.pos < this.lines.length) {
            const line = this.lines[this.pos]
            if (line.trim() === '') break
            if (this.isListLine(line) || line.trimStart().startsWith('>') || /^#{1,6}\s/.test(line) || /^[-*_]/.test(line.trim())) {
                break
            }
            content += line + '\n'
            this.pos++
        }

        if (this.pos === startPos) return null

        return { type: 'paragraph', children: this.parseInlines(content.trim()) }
    }

    // 重点：行内解析（超级清晰版）
    private parseInlines(text: string): Inline[] {
        const result: Inline[] = []
        let i = 0

        while (i < text.length) {
            const char = text[i]

            // 代码 span
            if (char === '`') {
                const end = text.indexOf('`', i + 1)
                if (end !== -1) {
                    result.push({ type: 'codespan', text: text.slice(i + 1, end) })
                    i = end + 1
                    continue
                }
            }

            // 删除线
            if (text.slice(i, i + 2) === '~~' && text[i + 2] !== ' ') {
                const end = text.indexOf('~~', i + 2)
                if (end !== -1) {
                    result.push({ type: 'delete', children: this.parseInlines(text.slice(i + 2, end)) })
                    i = end + 2
                    continue
                }
            }

            // 链接和图片
            if (char === '!' && text[i + 1] === '[') {
                const link = this.parseLinkOrImage(text, i)
                if (link) {
                    result.push(link)
                    i += link.alt.length + link.src.length + (link.title?.length || 0) + 6
                    continue
                }
            }
            if (char === '[' && !text.startsWith('![', i)) {
                const link = this.parseLinkOrImage(text, i)
                if (link) {
                    result.push(link as any)
                    i += (link as any).children[0].text.length + (link as any).href.length + (link as any).title?.length || 0 + 4
                    continue
                }
            }

            // 自动链接 <https://...>
            if (char === '<' && text.slice(i + 1).match(/^https?:\/\//)) {
                const end = text.indexOf('>', i)
                if (end !== -1) {
                    const url = text.slice(i + 1, end)
                    result.push({ type: 'link', href: url, children: [{ type: 'text', text: url }] })
                    i = end + 1
                    continue
                }
            }

            // 强调（** 和 __）
            if ((char === '*' || char === '_') && text[i + 1] === char) {
                const end = text.indexOf(char + char, i + 2)
                if (end !== -1) {
                    result.push({ type: 'strong', children: this.parseInlines(text.slice(i + 2, end)) })
                    i = end + 2
                    continue
                }
            }

            // 斜体
            if (char === '*' || char === '_') {
                const end = text.indexOf(char, i + 1)
                if (end !== -1 && !/\s/.test(text[i + 1]) && !/\s/.test(text[end - 1])) {
                    result.push({ type: 'emph', children: this.parseInlines(text.slice(i + 1, end)) })
                    i = end + 1
                    continue
                }
            }

            // 转义
            if (char === '\\' && i + 1 < text.length) {
                result.push({ type: 'text', text: text[i + 1] })
                i += 2
                continue
            }

            // 普通文本
            const next = text.slice(i).match(/[\[*_~`\\<!]/)
            const nextPos = next ? next.index! + i : text.length
            result.push({ type: 'text', text: text.slice(i, nextPos) })
            i = nextPos
        }

        return result
    }

    private parseLinkOrImage(text: string, pos: number): Node | null {
        if (text[pos] === '!') pos++
        if (!text.startsWith('[', pos)) return null

        const labelEnd = text.indexOf(']', pos + 1)
        if (labelEnd === -1) return null
        const label = text.slice(pos + 1, labelEnd)

        if (text[labelEnd + 1] !== '(') return null
        const urlEnd = text.indexOf(')', labelEnd + 2)
        if (urlEnd === -1) return null

        const inside = text.slice(labelEnd + 2, urlEnd)
        const match = inside.match(/^(\S+)(?:\s+"(.*)")?$/)
        if (!match) return null

        const href = match[1]
        const title = match[2]

        if (text[pos] === '!') {
            return { type: 'image', alt: label, src: href, title }
        } else {
            return { type: 'link', href, title, children: [{ type: 'text', text: label }] }
        }
    }

    private closeListIfNeeded(stack: Node[]) {
        // 空行结束 loose 列表，这里简化处理
    }
}

// HTML 渲染器
class HTMLRenderer {
    render(node: Node): string {
        if ('children' in node && Array.isArray(node.children)) {
            const tagMap: Record<string, string> = {
                heading: `h${(node as any).level}`,
                paragraph: 'p',
                strong: 'strong',
                emph: 'em',
                delete: 'del',
                link: 'a',
                list: (node as any).ordered ? 'ol' : 'ul',
                listItem: 'li',
                blockquote: 'blockquote'
            }

            const tag = tagMap[node.type] || node.type
            const attrs = this.getAttrs(node)
            const inner = node.children.map(c => this.render(c)).join('')

            if (node.type === 'heading') return `<${tag}>${inner}</${tag}>`
            if (node.type === 'paragraph') return `<${tag}>${inner}</${tag}>`
            if (node.type === 'link') return `<a href="${(node as any).href}"${attrs}>${inner}</a>`
            if (node.type === 'image') return `<img src="${(node as any).src}" alt="${(node as any).alt}"${attrs}>`
            if (node.type === 'code') return `<pre><code${(node as any).lang ? ` class="language-${(node as any).lang}"` : ''}>${this.escape((node as any).text)}</code></pre>`
            if (node.type === 'codespan') return `<code>${this.escape((node as any).text)}</code>`
            if (node.type === 'thematicBreak') return '<hr>'
            if (node.type === 'text') return this.escape((node as any).text)
            if (node.type === 'list') {
                const start = (node as any).start && (node as any).start !== 1 ? ` start="${(node as any).start}"` : ''
                return `<${tag}${start}>${inner}</${tag}>`
            }

            return `<${tag}${attrs}>${inner}</${tag}>`
        }
        return ''
    }

    private getAttrs(node: Node): string {
        if (node.type === 'link' && (node as any).title) return ` title="${(node as any).title}"`
        if (node.type === 'image' && (node as any).title) return ` title="${(node as any).title}"`
        return ''
    }

    private escape(html: string): string {
        return html.replace(/[&<>"']/g, m => ({
            '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
        })[m]!)
    }
}

// 使用示例（直接在浏览器或 Node.js + ts-node 运行）
const md = `
# Hello TinyMark

**粗体** _斜体_ ~~删除线~~ \`代码\`

> 这是一个引用
> 支持多行

\`\`\`js
console.log("Hello World!")
\`\`\`

- 苹果
- 香蕉
  - 小香蕉
  - 大香蕉

1. 第一步
2. 第二步

[链接](https://github.com "GitHub")

![图片](https://http.cat/200.jpg)
`

const ast = TinyMark.parse(md)
console.log(JSON.stringify(ast, null, 2))
console.log(TinyMark.toHTML(ast))