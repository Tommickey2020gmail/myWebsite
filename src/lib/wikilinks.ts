// src/lib/wikilinks.ts
// Remark plugin: turns Obsidian-style [[wikilinks]] in markdown into proper
// links resolved against src/lib/registry.ts.
//
//   [[Welcome to the garden]]              -> link with text "Welcome to the garden"
//   [[Welcome to the garden|hello]]        -> link with text "hello"
//   [[unknown]]                            -> <span class="broken-link">[[unknown]]</span>
//
// Wikilinks inside code blocks are already untouched because the find-and-replace
// helper only walks text-bearing inline nodes, not code/inlineCode.
import { findAndReplace } from 'mdast-util-find-and-replace';
import type { Root } from 'mdast';
import { resolveWikilink } from './registry';

const WIKILINK = /\[\[([^\[\]\n|]+?)(?:\|([^\[\]\n]+))?\]\]/g;

export default function remarkWikilinks() {
  return (tree: Root) => {
    findAndReplace(tree, [
      [
        WIKILINK,
        (_match: string, target: string, alias?: string) => {
          const display = (alias ?? target).trim();
          const hit = resolveWikilink(target);
          if (hit) {
            return {
              type: 'link',
              url: hit.href,
              title: hit.title,
              data: { hProperties: { className: 'wikilink' } },
              children: [{ type: 'text', value: display }],
            };
          }
          return {
            type: 'text',
            data: { hName: 'span', hProperties: { className: 'wikilink broken' } },
            value: `[[${display}]]`,
          };
        },
      ],
    ]);
  };
}
