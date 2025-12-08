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

import { Position } from '../../types';

import {
  safeExecuteCommand,
  EditorErrorType,
  handleEditorError,
} from './errorHandler';
import {
  convertTipTapPositionToCodeMirror,
  convertCodeMirrorPositionToTipTap,
} from './position';
import { MARKDOWN_PATTERNS } from './constants';

/**
 * Creates base methods module
 *
 * Provides core base methods for the editor, including:
 * - Content getter and setter (getValue, setValue)
 * - Selection operations (getSelection, replaceSelection)
 * - Cursor and selection position (getCursor, setSelection)
 * - Read-only state control (setReadOnly)
 *
 * @param editor - TipTap editor instance
 * @returns Object containing base methods
 */
export function createBaseMethods(editor: TipTapEditor) {
  return {
    getValue: () => {
      return (
        safeExecuteCommand(
          () => editor.getMarkdown(),
          () => '',
          EditorErrorType.COMMAND_EXECUTION_FAILED,
          { function: 'getValue' },
        ) || ''
      );
    },

    setValue: (value: string) => {
      safeExecuteCommand(
        () => {
          editor.commands.setContent(value, { contentType: 'markdown' });
        },
        undefined,
        EditorErrorType.COMMAND_EXECUTION_FAILED,
        { function: 'setValue', valueLength: value.length },
      );
    },

    getSelection: () => {
      const { from, to } = editor.state.selection;
      return editor.state.doc.textBetween(from, to);
    },

    replaceSelection: (value: string) => {
      const inlineCodeMatch = value.match(MARKDOWN_PATTERNS.INLINE_CODE);
      if (inlineCodeMatch && value.length > 2) {
        const codeText = inlineCodeMatch[1];
        safeExecuteCommand(
          () => {
            editor.commands.insertContent({
              type: 'text',
              text: codeText,
              marks: [{ type: 'code' }],
            });
          },
          () => {
            editor.commands.insertContent(value, { contentType: 'markdown' });
          },
        );
        return;
      }

      const codeBlockMatch = value.match(MARKDOWN_PATTERNS.CODE_BLOCK);
      if (codeBlockMatch) {
        const [, , lang, codeText] = codeBlockMatch;
        safeExecuteCommand(
          () => {
            editor.commands.insertContent({
              type: 'codeBlock',
              attrs: lang ? { language: lang } : {},
              content: [
                {
                  type: 'text',
                  text: codeText,
                },
              ],
            });
          },
          () => {
            editor.commands.insertContent(value, { contentType: 'markdown' });
          },
        );
        return;
      }

      const imageMatch = value.match(MARKDOWN_PATTERNS.IMAGE);
      if (imageMatch) {
        const [, alt, url] = imageMatch;
        safeExecuteCommand(
          () => {
            editor.commands.insertContent({
              type: 'image',
              attrs: {
                src: url,
                alt: alt || '',
              },
            });
          },
          () => {
            editor.commands.insertContent(value, { contentType: 'markdown' });
          },
        );
        return;
      }

      const linkMatch = value.match(MARKDOWN_PATTERNS.LINK);
      if (linkMatch) {
        const [, text, url] = linkMatch;
        safeExecuteCommand(
          () => {
            editor.commands.insertContent({
              type: 'text',
              text: text || url,
              marks: [
                {
                  type: 'link',
                  attrs: {
                    href: url,
                  },
                },
              ],
            });
          },
          () => {
            editor.commands.insertContent(value, { contentType: 'markdown' });
          },
        );
        return;
      }

      const autoLinkMatch = value.match(MARKDOWN_PATTERNS.AUTO_LINK);
      if (autoLinkMatch && value.length > 2) {
        const url = autoLinkMatch[1];
        safeExecuteCommand(
          () => {
            editor.commands.insertContent({
              type: 'text',
              text: url,
              marks: [
                {
                  type: 'link',
                  attrs: {
                    href: url,
                  },
                },
              ],
            });
          },
          () => {
            editor.commands.insertContent(value, { contentType: 'markdown' });
          },
        );
        return;
      }

      if (MARKDOWN_PATTERNS.HORIZONTAL_RULE.test(value.trim())) {
        safeExecuteCommand(
          () => {
            editor.commands.insertContent({
              type: 'horizontalRule',
            });
          },
          () => {
            editor.commands.insertContent(value, { contentType: 'markdown' });
          },
        );
        return;
      }

      safeExecuteCommand(() => {
        editor.commands.insertContent(value, { contentType: 'markdown' });
      });
    },

    focus: () => {
      editor.commands.focus();
    },

    getCursor: () => {
      try {
        const { from } = editor.state.selection;
        return convertTipTapPositionToCodeMirror(editor, from);
      } catch (error) {
        handleEditorError(
          error as Error,
          EditorErrorType.POSITION_CONVERSION_FAILED,
          {
            function: 'getCursor',
          },
        );
        return { line: 0, ch: 0 };
      }
    },

    setSelection: (anchor?: unknown, head?: unknown) => {
      try {
        if (
          anchor &&
          typeof anchor === 'object' &&
          'line' in anchor &&
          'ch' in anchor
        ) {
          const anchorPos = convertCodeMirrorPositionToTipTap(
            editor,
            anchor as Position,
          );
          let headPos = anchorPos;

          if (
            head &&
            typeof head === 'object' &&
            'line' in head &&
            'ch' in head
          ) {
            headPos = convertCodeMirrorPositionToTipTap(
              editor,
              head as Position,
            );
          }

          safeExecuteCommand(
            () => {
              editor.commands.setTextSelection({
                from: anchorPos,
                to: headPos,
              });
            },
            undefined,
            EditorErrorType.COMMAND_EXECUTION_FAILED,
            { function: 'setSelection', anchorPos, headPos },
          );
        } else {
          editor.commands.focus();
        }
      } catch (error) {
        handleEditorError(
          error as Error,
          EditorErrorType.COMMAND_EXECUTION_FAILED,
          {
            function: 'setSelection',
            anchor,
            head,
          },
        );
        safeExecuteCommand(
          () => {
            editor.commands.focus();
          },
          undefined,
          EditorErrorType.COMMAND_EXECUTION_FAILED,
          { function: 'setSelection', isFallback: true },
        );
      }
    },

    setReadOnly: (readOnly: boolean) => {
      editor.setEditable(!readOnly);
    },

    replaceRange: (value: string, from?: unknown, to?: unknown) => {
      if (from && to && typeof from === 'object' && typeof to === 'object') {
        const { from: currentFrom, to: currentTo } = editor.state.selection;
        const imageMatch = value.match(MARKDOWN_PATTERNS.IMAGE);
        if (imageMatch) {
          const [, alt, url] = imageMatch;
          safeExecuteCommand(
            () => {
              editor.commands.insertContentAt(
                { from: currentFrom, to: currentTo },
                {
                  type: 'image',
                  attrs: {
                    src: url,
                    alt: alt || '',
                  },
                },
              );
            },
            () => {
              editor.commands.insertContentAt(
                { from: currentFrom, to: currentTo },
                value,
                { contentType: 'markdown' },
              );
            },
          );
          return;
        }

        safeExecuteCommand(() => {
          editor.commands.insertContentAt(
            { from: currentFrom, to: currentTo },
            value,
            { contentType: 'markdown' },
          );
        });
      } else {
        const imageMatch = value.match(MARKDOWN_PATTERNS.IMAGE);
        if (imageMatch) {
          const [, alt, url] = imageMatch;
          safeExecuteCommand(
            () => {
              editor.commands.insertContent({
                type: 'image',
                attrs: {
                  src: url,
                  alt: alt || '',
                },
              });
            },
            () => {
              editor.commands.insertContent(value, {
                contentType: 'markdown',
              });
            },
          );
          return;
        }

        safeExecuteCommand(() => {
          editor.commands.insertContent(value, { contentType: 'markdown' });
        });
      }
    },
  };
}
