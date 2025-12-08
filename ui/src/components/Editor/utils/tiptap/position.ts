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

import { handleEditorError, EditorErrorType } from './errorHandler';

/**
 * Converts TipTap position to CodeMirror Position
 *
 * TipTap uses document tree-based node positions (character index), while CodeMirror uses
 * line-based positions (line number and column number). This function converts between them.
 *
 * @param editor - TipTap editor instance
 * @param pos - TipTap position index (character position)
 * @returns CodeMirror position object with line and ch properties
 *
 * @example
 * ```typescript
 * const tipTapPos = 100; // Character position
 * const codeMirrorPos = convertTipTapPositionToCodeMirror(editor, tipTapPos);
 * // { line: 5, ch: 10 }
 * ```
 */
export function convertTipTapPositionToCodeMirror(
  editor: TipTapEditor,
  pos: number,
): Position {
  try {
    const { doc } = editor.state;
    let line = 0;
    let ch = 0;
    let currentPos = 0;

    for (let i = 0; i < doc.content.childCount; i += 1) {
      const child = doc.content.child(i);
      const childSize = child.nodeSize;

      if (currentPos + childSize > pos) {
        const text = child.textContent;
        const relativePos = pos - currentPos;

        const textBeforePos = text.substring(0, relativePos);
        const newlineMatches = textBeforePos.match(/\n/g);
        line += newlineMatches ? newlineMatches.length : 0;
        ch = relativePos - textBeforePos.lastIndexOf('\n') - 1;
        break;
      }

      const text = child.textContent;
      const newlineMatches = text.match(/\n/g);
      line += newlineMatches ? newlineMatches.length : 0;
      currentPos += childSize;
    }

    return { line, ch };
  } catch (error) {
    handleEditorError(
      error as Error,
      EditorErrorType.POSITION_CONVERSION_FAILED,
      {
        function: 'convertTipTapPositionToCodeMirror',
        position: pos,
      },
    );
    return { line: 0, ch: 0 };
  }
}

/**
 * Converts CodeMirror Position to TipTap position index
 *
 * Converts CodeMirror's line-based position to TipTap's character index position.
 *
 * @param editor - TipTap editor instance
 * @param position - CodeMirror position object with line and ch properties
 * @returns TipTap position index (character position)
 *
 * @example
 * ```typescript
 * const codeMirrorPos = { line: 5, ch: 10 };
 * const tipTapPos = convertCodeMirrorPositionToTipTap(editor, codeMirrorPos);
 * // 100 (character position)
 * ```
 */
export function convertCodeMirrorPositionToTipTap(
  editor: TipTapEditor,
  position: Position,
): number {
  try {
    const { doc } = editor.state;
    let currentLine = 0;
    let currentPos = 0;

    for (let i = 0; i < doc.content.childCount; i += 1) {
      const child = doc.content.child(i);
      const text = child.textContent;
      const lines = text.split('\n');

      if (currentLine + lines.length - 1 >= position.line) {
        const lineInNode = position.line - currentLine;
        const { ch: posInLine } = position;

        let pos = 0;
        for (let j = 0; j < lineInNode; j += 1) {
          pos += lines[j].length + 1; // +1 for newline
        }
        pos += posInLine;

        return currentPos + pos;
      }

      currentLine += lines.length - 1;
      currentPos += child.nodeSize;
    }

    return doc.content.size;
  } catch (error) {
    handleEditorError(
      error as Error,
      EditorErrorType.POSITION_CONVERSION_FAILED,
      {
        function: 'convertCodeMirrorPositionToTipTap',
        position,
      },
    );
    return editor.state.doc.content.size;
  }
}
