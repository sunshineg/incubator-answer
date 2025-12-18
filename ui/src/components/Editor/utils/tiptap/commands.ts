/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

import { Editor as TipTapEditor } from '@tiptap/react';
import { Command } from '@codemirror/view';

import { Level } from '../../types';

import { safeExecuteCommand, logWarning } from './errorHandler';
import { MARKDOWN_PATTERNS } from './constants';

/**
 * Creates command methods module
 *
 * Provides command methods for the editor, including:
 * - Low-level methods: wrapText, replaceLines, appendBlock (for internal editor use)
 * - Semantic methods: insertBold, insertHeading, insertImage, etc. (for toolbar use)
 * - State query methods: isBold, isHeading, etc.
 *
 * @param editor - TipTap editor instance
 * @returns Object containing all command methods
 */
export function createCommandMethods(editor: TipTapEditor) {
  return {
    wrapText: (before: string, after?: string, defaultText?: string) => {
      const { from, to } = editor.state.selection;
      const actualAfter = after || before;

      if (before === '**' && actualAfter === '**') {
        if (from === to) {
          if (defaultText) {
            const insertPos = from;
            editor.commands.insertContent(defaultText);
            editor.commands.setTextSelection({
              from: insertPos,
              to: insertPos + defaultText.length,
            });
            editor.commands.toggleBold();
          } else {
            editor.commands.toggleBold();
          }
        } else {
          editor.commands.toggleBold();
        }
        return;
      }

      if (before === '*' && actualAfter === '*') {
        if (from === to) {
          if (defaultText) {
            const insertPos = from;
            editor.commands.insertContent(defaultText);
            editor.commands.setTextSelection({
              from: insertPos,
              to: insertPos + defaultText.length,
            });
            editor.commands.toggleItalic();
          } else {
            editor.commands.toggleItalic();
          }
        } else {
          editor.commands.toggleItalic();
        }
        return;
      }

      if (before === '`' && actualAfter === '`') {
        if (from === to) {
          if (defaultText) {
            const insertPos = from;
            editor.commands.insertContent(defaultText);
            editor.commands.setTextSelection({
              from: insertPos,
              to: insertPos + defaultText.length,
            });
            editor.commands.toggleCode();
          } else {
            editor.commands.toggleCode();
          }
        } else {
          editor.commands.toggleCode();
        }
        return;
      }

      if (before === '```\n' && actualAfter === '\n```') {
        if (from === to) {
          const codeBlockText = defaultText
            ? `\`\`\`\n${defaultText}\n\`\`\``
            : '```\n\n```';
          safeExecuteCommand(
            () => {
              editor.commands.insertContent(codeBlockText, {
                contentType: 'markdown',
              });
            },
            () => {
              editor.commands.insertContent({
                type: 'codeBlock',
                content: defaultText
                  ? [
                      {
                        type: 'text',
                        text: defaultText,
                      },
                    ]
                  : [],
              });
            },
          );
        } else {
          const selectedText = editor.state.doc.textBetween(from, to);
          safeExecuteCommand(
            () => {
              editor.commands.insertContentAt(
                { from, to },
                {
                  type: 'codeBlock',
                  content: [
                    {
                      type: 'text',
                      text: selectedText,
                    },
                  ],
                },
              );
            },
            () => {
              const codeBlockText = `\`\`\`\n${selectedText}\n\`\`\``;
              editor.commands.insertContentAt({ from, to }, codeBlockText, {
                contentType: 'markdown',
              });
            },
          );
        }
        return;
      }

      if (from === to) {
        const text = before + (defaultText || '') + actualAfter;
        editor.commands.insertContent(text, { contentType: 'markdown' });
      } else {
        const selectedText = editor.state.doc.textBetween(from, to);
        const wrappedText = before + selectedText + actualAfter;
        editor.commands.insertContentAt({ from, to }, wrappedText, {
          contentType: 'markdown',
        });
      }
    },

    replaceLines: (replace: Parameters<Array<string>['map']>[0]) => {
      const { from } = editor.state.selection;
      const $pos = editor.state.doc.resolve(from);
      const block = $pos.parent;
      const lineText = block.textContent;
      const newText = replace(lineText, 0, [lineText]) as string;

      const finalText = newText || ' ';
      const headingMatch = finalText.match(MARKDOWN_PATTERNS.HEADING);
      if (headingMatch) {
        const [, hashes, text] = headingMatch;
        const level = hashes.length;
        const start = $pos.start($pos.depth);
        const end = $pos.end($pos.depth);

        if (start < 0 || end < 0 || start > end) {
          logWarning('Invalid position range for heading', { start, end });
          return;
        }

        const headingText = text.trim() || 'Heading';
        safeExecuteCommand(
          () => {
            if (start === end) {
              editor.commands.insertContent({
                type: 'heading',
                attrs: { level },
                content: [
                  {
                    type: 'text',
                    text: headingText,
                  },
                ],
              });
            } else {
              editor.commands.insertContentAt(
                { from: start, to: end },
                {
                  type: 'heading',
                  attrs: { level },
                  content: [
                    {
                      type: 'text',
                      text: headingText,
                    },
                  ],
                },
              );
            }
          },
          () => {
            const markdownText = finalText.trim() || `# Heading`;
            if (start === end) {
              editor.commands.insertContent(markdownText, {
                contentType: 'markdown',
              });
            } else {
              editor.commands.insertContentAt(
                { from: start, to: end },
                markdownText,
                { contentType: 'markdown' },
              );
            }
          },
        );
        return;
      }

      if (finalText.startsWith('> ')) {
        const quoteText = finalText.slice(2).trim();
        const start = $pos.start($pos.depth);
        const end = $pos.end($pos.depth);

        if (start < 0 || end < 0 || start > end) {
          logWarning('Invalid position range for heading', { start, end });
          return;
        }

        const quoteMarkdown = quoteText ? `> ${quoteText}` : '> ';
        safeExecuteCommand(
          () => {
            if (start === end) {
              editor.commands.insertContent(quoteMarkdown, {
                contentType: 'markdown',
              });
            } else {
              editor.commands.insertContentAt(
                { from: start, to: end },
                quoteMarkdown,
                { contentType: 'markdown' },
              );
            }
          },
          () => {
            if (start === end) {
              editor.commands.insertContent({
                type: 'paragraph',
                content: quoteText ? [{ type: 'text', text: quoteText }] : [],
              });
            } else {
              editor.commands.insertContentAt(
                { from: start, to: end },
                {
                  type: 'paragraph',
                  content: quoteText ? [{ type: 'text', text: quoteText }] : [],
                },
              );
            }
          },
        );
        return;
      }

      const olMatchOriginal = lineText.match(
        MARKDOWN_PATTERNS.ORDERED_LIST_ORIGINAL,
      );
      const olMatchNew = finalText.match(MARKDOWN_PATTERNS.ORDERED_LIST_NEW);

      if (olMatchOriginal || olMatchNew) {
        const isInOrderedList = editor.isActive('orderedList');
        const start = $pos.start($pos.depth);
        const end = $pos.end($pos.depth);

        if (start < 0 || end < 0 || start > end) {
          logWarning('Invalid position range for ordered list', {
            start,
            end,
          });
          return;
        }

        if (olMatchOriginal && !olMatchNew) {
          const textContent = finalText.trim();
          const contentToInsert = textContent || 'Paragraph';

          safeExecuteCommand(
            () => {
              if (start === end) {
                editor.commands.insertContent(contentToInsert, {
                  contentType: 'markdown',
                });
              } else {
                editor.commands.insertContentAt(
                  { from: start, to: end },
                  contentToInsert,
                  { contentType: 'markdown' },
                );
              }
            },
            () => {
              if (start === end) {
                editor.commands.insertContent({
                  type: 'paragraph',
                  content: [{ type: 'text', text: contentToInsert }],
                });
              } else {
                editor.commands.insertContentAt(
                  { from: start, to: end },
                  {
                    type: 'paragraph',
                    content: [{ type: 'text', text: contentToInsert }],
                  },
                );
              }
            },
          );
          if (isInOrderedList) {
            safeExecuteCommand(() => {
              editor.chain().focus().toggleOrderedList().run();
            });
          }
        } else if (!olMatchOriginal && olMatchNew) {
          const [, , text] = olMatchNew;
          const textContent = text.trim();
          const contentToInsert = textContent || 'List item';

          safeExecuteCommand(
            () => {
              if (start === end) {
                editor.commands.insertContent(contentToInsert, {
                  contentType: 'markdown',
                });
              } else {
                editor.commands.insertContentAt(
                  { from: start, to: end },
                  contentToInsert,
                  { contentType: 'markdown' },
                );
              }
            },
            () => {
              if (start === end) {
                editor.commands.insertContent({
                  type: 'paragraph',
                  content: [{ type: 'text', text: contentToInsert }],
                });
              } else {
                editor.commands.insertContentAt(
                  { from: start, to: end },
                  {
                    type: 'paragraph',
                    content: [{ type: 'text', text: contentToInsert }],
                  },
                );
              }
            },
          );
          if (!isInOrderedList) {
            safeExecuteCommand(() => {
              editor.chain().focus().toggleOrderedList().run();
            });
          }
        }
        return;
      }
      const ulMatchOriginal = lineText.match(
        MARKDOWN_PATTERNS.UNORDERED_LIST_ORIGINAL,
      );
      const ulMatchNew = finalText.match(MARKDOWN_PATTERNS.UNORDERED_LIST_NEW);

      if (ulMatchOriginal || ulMatchNew) {
        const isInBulletList = editor.isActive('bulletList');
        const start = $pos.start($pos.depth);
        const end = $pos.end($pos.depth);

        if (start < 0 || end < 0 || start > end) {
          logWarning('Invalid position range for unordered list', {
            start,
            end,
          });
          return;
        }

        if (ulMatchOriginal && !ulMatchNew) {
          const textContent = finalText.trim();
          const contentToInsert = textContent || 'Paragraph';

          safeExecuteCommand(
            () => {
              if (start === end) {
                editor.commands.insertContent(contentToInsert, {
                  contentType: 'markdown',
                });
              } else {
                editor.commands.insertContentAt(
                  { from: start, to: end },
                  contentToInsert,
                  { contentType: 'markdown' },
                );
              }
            },
            () => {
              if (start === end) {
                editor.commands.insertContent({
                  type: 'paragraph',
                  content: [{ type: 'text', text: contentToInsert }],
                });
              } else {
                editor.commands.insertContentAt(
                  { from: start, to: end },
                  {
                    type: 'paragraph',
                    content: [{ type: 'text', text: contentToInsert }],
                  },
                );
              }
            },
          );
          if (isInBulletList) {
            safeExecuteCommand(() => {
              editor.chain().focus().toggleBulletList().run();
            });
          }
        } else if (!ulMatchOriginal && ulMatchNew) {
          const [, text] = ulMatchNew;
          const textContent = text.trim();
          const contentToInsert = textContent || 'List item';

          safeExecuteCommand(
            () => {
              if (start === end) {
                editor.commands.insertContent(contentToInsert, {
                  contentType: 'markdown',
                });
              } else {
                editor.commands.insertContentAt(
                  { from: start, to: end },
                  contentToInsert,
                  { contentType: 'markdown' },
                );
              }
            },
            () => {
              if (start === end) {
                editor.commands.insertContent({
                  type: 'paragraph',
                  content: [{ type: 'text', text: contentToInsert }],
                });
              } else {
                editor.commands.insertContentAt(
                  { from: start, to: end },
                  {
                    type: 'paragraph',
                    content: [{ type: 'text', text: contentToInsert }],
                  },
                );
              }
            },
          );
          if (!isInBulletList) {
            safeExecuteCommand(() => {
              editor.chain().focus().toggleBulletList().run();
            });
          }
        }
        return;
      }

      const start = $pos.start($pos.depth);
      const end = $pos.end($pos.depth);

      if (start < 0 || end < 0 || start > end) {
        logWarning('Invalid position range', {
          start,
          end,
          function: 'replaceLines',
        });
        return;
      }

      const contentToInsert = finalText.trim() || ' ';

      safeExecuteCommand(
        () => {
          if (start === end) {
            editor.commands.insertContent(contentToInsert, {
              contentType: 'markdown',
            });
          } else {
            editor.commands.insertContentAt(
              { from: start, to: end },
              contentToInsert,
              { contentType: 'markdown' },
            );
          }
        },
        () => {
          if (start === end) {
            editor.commands.insertContent({
              type: 'paragraph',
              content: [{ type: 'text', text: contentToInsert }],
            });
          } else {
            editor.commands.insertContentAt(
              { from: start, to: end },
              {
                type: 'paragraph',
                content: [{ type: 'text', text: contentToInsert }],
              },
            );
          }
        },
      );
    },

    appendBlock: (content: string) => {
      if (MARKDOWN_PATTERNS.HORIZONTAL_RULE.test(content.trim())) {
        safeExecuteCommand(
          () => {
            editor.commands.insertContent({
              type: 'horizontalRule',
            });
          },
          () => {
            editor.commands.insertContent(content, {
              contentType: 'markdown',
            });
          },
        );
        return;
      }

      safeExecuteCommand(() => {
        editor.commands.insertContent(`\n\n${content}`, {
          contentType: 'markdown',
        });
      });
    },

    addKeyMap: (keyMap: Record<string, Command>) => {
      Object.keys(keyMap).forEach(() => {});
    },
    insertBold: (text?: string) => {
      if (text) {
        const { from } = editor.state.selection;
        editor.commands.insertContent(text);
        editor.commands.setTextSelection({ from, to: from + text.length });
      }
      editor.commands.toggleBold();
    },

    insertItalic: (text?: string) => {
      if (text) {
        const { from } = editor.state.selection;
        editor.commands.insertContent(text);
        editor.commands.setTextSelection({ from, to: from + text.length });
      }
      editor.commands.toggleItalic();
    },

    insertCode: (text?: string) => {
      if (text) {
        const { from } = editor.state.selection;
        editor.commands.insertContent(text);
        editor.commands.setTextSelection({ from, to: from + text.length });
      }
      editor.commands.toggleCode();
    },

    insertStrikethrough: (text?: string) => {
      if (text) {
        const { from } = editor.state.selection;
        editor.commands.insertContent(text);
        editor.commands.setTextSelection({ from, to: from + text.length });
      }
      editor.commands.toggleStrike();
    },

    insertHeading: (level: Level, text?: string) => {
      if (text) {
        // Insert heading using TipTap's native API to ensure proper structure
        safeExecuteCommand(
          () => {
            editor.commands.insertContent({
              type: 'heading',
              attrs: { level },
              content: [
                {
                  type: 'text',
                  text,
                },
              ],
            });
            // Select only the text part (excluding the heading node structure)
            // After insertion, the cursor is at the end of the heading
            // We need to select backwards from the current position
            const { to } = editor.state.selection;
            editor.commands.setTextSelection({
              from: to - text.length,
              to,
            });
          },
          () => {
            // Fallback: use markdown format
            const headingText = `${'#'.repeat(level)} ${text}`;
            editor.commands.insertContent(headingText, {
              contentType: 'markdown',
            });
          },
        );
      } else {
        editor.commands.toggleHeading({ level });
      }
    },

    insertBlockquote: (text?: string) => {
      if (text) {
        const { from } = editor.state.selection;
        const blockquoteText = `> ${text}`;

        // Use chain to ensure selection happens after insertion
        editor
          .chain()
          .focus()
          .insertContent(blockquoteText, { contentType: 'markdown' })
          .setTextSelection({
            from: from + 1,
            to: from + 1 + text.length,
          })
          .run();
      } else {
        editor.commands.toggleBlockquote();
      }
    },

    insertCodeBlock: (language?: string, code?: string) => {
      const lang = language || '';
      const codeText = code || 'code here';
      editor.commands.insertContent(`\`\`\`${lang}\n${codeText}\n\`\`\``, {
        contentType: 'markdown',
      });
    },

    insertHorizontalRule: () => {
      editor.commands.setHorizontalRule();
    },

    insertOrderedList: () => {
      editor.commands.toggleOrderedList();
    },

    insertUnorderedList: () => {
      editor.commands.toggleBulletList();
    },

    toggleOrderedList: () => {
      editor.commands.toggleOrderedList();
    },

    toggleUnorderedList: () => {
      editor.commands.toggleBulletList();
    },

    insertLink: (url: string, text?: string) => {
      const linkText = text || url;
      editor.commands.insertContent(`[${linkText}](${url})`, {
        contentType: 'markdown',
      });
    },

    insertImage: (url: string, alt?: string) => {
      editor.commands.setImage({ src: url, alt: alt || 'image' });
    },

    insertTable: (rows = 3, cols = 3) => {
      editor.commands.insertTable({
        rows,
        cols,
        withHeaderRow: true,
      });
    },

    indent: () => {
      editor.commands.sinkListItem('listItem');
    },

    outdent: () => {
      editor.commands.liftListItem('listItem');
    },

    isBold: () => editor.isActive('bold'),
    isItalic: () => editor.isActive('italic'),
    isHeading: (level?: number) => {
      if (level) {
        return editor.isActive('heading', { level });
      }
      return editor.isActive('heading');
    },
    isBlockquote: () => editor.isActive('blockquote'),
    isCodeBlock: () => editor.isActive('codeBlock'),
    isOrderedList: () => editor.isActive('orderedList'),
    isUnorderedList: () => editor.isActive('bulletList'),
  };
}
