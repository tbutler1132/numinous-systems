import { describe, it } from 'node:test'
import assert from 'node:assert'
import { resolve, join } from 'path'
import { parseMarkdownLinks, readArtifact, readPage, resolveReference, collectArtifacts } from './lib'

const ROOT = resolve(__dirname, '..', '..', '..')
const STAGES_DIR = join(ROOT, 'nodes/org/artifacts/stages')

describe('parseMarkdownLinks', () => {
  it('extracts links from markdown', () => {
    const md = '[Genesis](../../songs/genesis/page.md)\n[Epoch](../../songs/epoch/page.md)'
    const links = parseMarkdownLinks(md)
    assert.strictEqual(links.length, 2)
    assert.deepStrictEqual(links[0], { label: 'Genesis', url: '../../songs/genesis/page.md' })
    assert.deepStrictEqual(links[1], { label: 'Epoch', url: '../../songs/epoch/page.md' })
  })

  it('extracts links from list items', () => {
    const md = '- [Song A](../songs/a/page.md)\n- [Song B](../songs/b/page.md)'
    const links = parseMarkdownLinks(md)
    assert.strictEqual(links.length, 2)
    assert.strictEqual(links[0].label, 'Song A')
    assert.strictEqual(links[1].label, 'Song B')
  })

  it('skips http links in resolveReference but still parses them', () => {
    const md = '[Listen](https://example.com/audio.mp3)'
    const links = parseMarkdownLinks(md)
    assert.strictEqual(links.length, 1)
    assert.strictEqual(links[0].url, 'https://example.com/audio.mp3')
  })

  it('returns empty array for text without links', () => {
    assert.deepStrictEqual(parseMarkdownLinks('just some text'), [])
    assert.deepStrictEqual(parseMarkdownLinks(''), [])
  })
})

describe('readArtifact', () => {
  it('reads about.md from a real stage directory', () => {
    const result = readArtifact(join(STAGES_DIR, '01-ordinary-world'))
    assert.ok(result, 'stage 01 should have about.md')
    assert.ok(result.frontmatter.title, 'should have a title in frontmatter')
  })

  it('returns null for a directory without about.md', () => {
    const result = readArtifact('/tmp')
    assert.strictEqual(result, null)
  })
})

describe('readPage', () => {
  it('reads page.md from a real stage directory', () => {
    const result = readPage(join(STAGES_DIR, '01-ordinary-world'))
    assert.ok(result, 'stage 01 should have page.md')
    assert.ok(result.length > 0, 'page.md should have content')
  })

  it('returns null for a directory without page.md', () => {
    const result = readPage('/tmp')
    assert.strictEqual(result, null)
  })
})

describe('resolveReference', () => {
  it('skips http links', () => {
    const result = resolveReference(
      { label: 'Listen', url: 'https://example.com/audio.mp3' },
      STAGES_DIR
    )
    assert.strictEqual(result, null)
  })

  it('resolves a relative link to a song artifact', () => {
    const stageDir = join(STAGES_DIR, '01-ordinary-world')
    const page = readPage(stageDir)
    assert.ok(page, 'stage 01 should have a page')

    const links = parseMarkdownLinks(page)
    const songLink = links.find((l) => !l.url.startsWith('http') && l.url.includes('songs/'))
    if (!songLink) return // no song links, skip

    const ref = resolveReference(songLink, stageDir)
    assert.ok(ref, `should resolve reference for ${songLink.label}`)
    assert.ok(ref.slug, 'resolved reference should have a slug')
    assert.ok(ref.frontmatter, 'resolved reference should have frontmatter')
  })

  it('resolves a relative link to a story fragment', () => {
    const stageDir = join(STAGES_DIR, '01-ordinary-world')
    const page = readPage(stageDir)
    assert.ok(page)

    const links = parseMarkdownLinks(page)
    const fragmentLink = links.find((l) => l.url.includes('story/'))
    if (!fragmentLink) return

    const ref = resolveReference(fragmentLink, stageDir)
    assert.ok(ref, `should resolve story fragment reference`)
    assert.strictEqual(ref.frontmatter.category, 'story-fragment')
  })
})

describe('collectArtifacts', () => {
  it('collects all stages with references resolved', () => {
    const artifacts = collectArtifacts(STAGES_DIR)
    assert.ok(artifacts.length > 0, 'should find at least one stage')
    assert.strictEqual(artifacts.length, 12, 'should find all 12 stages')

    for (const artifact of artifacts) {
      assert.ok(artifact.slug, `artifact should have a slug`)
      assert.ok(artifact.frontmatter.title, `${artifact.slug} should have a title`)
      assert.ok(artifact.references.length > 0, `${artifact.slug} should have at least one reference`)
    }
  })

  it('resolves story fragment references with page content', () => {
    const artifacts = collectArtifacts(STAGES_DIR)
    const withFragment = artifacts.find((a) =>
      a.references.some((r) => r.frontmatter.category === 'story-fragment')
    )
    assert.ok(withFragment, 'at least one stage should have a story fragment reference')

    const fragment = withFragment!.references.find((r) => r.frontmatter.category === 'story-fragment')
    assert.ok(fragment!.page.length > 0, 'story fragment should have page content')
  })

  it('resolves song references with audio links', () => {
    const artifacts = collectArtifacts(STAGES_DIR)
    const withSongs = artifacts.find((a) =>
      a.references.some((r) => r.frontmatter.category === 'song')
    )
    assert.ok(withSongs, 'at least one stage should have song references')

    const song = withSongs!.references.find((r) => r.frontmatter.category === 'song')
    assert.ok(song, 'should find a song reference')
    // Songs with page.md will have audio links
    if (song!.page) {
      const audioLinks = song!.links.filter((l) => l.url.startsWith('http'))
      assert.ok(audioLinks.length > 0, 'song with page should have audio links')
    }
  })
})
