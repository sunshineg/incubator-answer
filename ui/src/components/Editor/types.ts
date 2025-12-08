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

import { EditorView, Command } from '@codemirror/view';

export interface Position {
  ch: number;
  line: number;
  sticky?: string | undefined;
}

export type Level = 1 | 2 | 3 | 4 | 5 | 6;

export interface ExtendEditor {
  addKeyMap: (keyMap: Record<string, Command>) => void;
  on: (
    event:
      | 'change'
      | 'focus'
      | 'blur'
      | 'dragenter'
      | 'dragover'
      | 'drop'
      | 'paste',
    callback: (e?) => void,
  ) => void;
  getValue: () => string;
  setValue: (value: string) => void;
  off: (
    event:
      | 'change'
      | 'focus'
      | 'blur'
      | 'dragenter'
      | 'dragover'
      | 'drop'
      | 'paste',
    callback: (e?) => void,
  ) => void;
  getSelection: () => string;
  replaceSelection: (value: string) => void;
  focus: () => void;
  getCursor: () => Position;
  replaceRange: (value: string, from: Position, to: Position) => void;
  setSelection: (anchor: Position, head?: Position) => void;
  setReadOnly: (readOnly: boolean) => void;

  // 底层方法（供编辑器内部使用，不推荐工具栏直接使用）
  wrapText: (before: string, after?: string, defaultText?: string) => void;
  replaceLines: (
    replace: Parameters<Array<string>['map']>[0],
    symbolLen?: number,
  ) => void;
  appendBlock: (content: string) => void;

  // 语义化高级方法（工具栏推荐使用）
  // 文本格式
  insertBold: (text?: string) => void;
  insertItalic: (text?: string) => void;
  insertCode: (text?: string) => void;
  insertStrikethrough: (text?: string) => void;

  // 块级元素
  insertHeading: (level: Level, text?: string) => void;
  insertBlockquote: (text?: string) => void;
  insertCodeBlock: (language?: string, code?: string) => void;
  insertHorizontalRule: () => void;

  // 列表
  insertOrderedList: () => void;
  insertUnorderedList: () => void;
  toggleOrderedList: () => void;
  toggleUnorderedList: () => void;

  // 链接和媒体
  insertLink: (url: string, text?: string) => void;
  insertImage: (url: string, alt?: string) => void;

  // 表格
  insertTable: (rows?: number, cols?: number) => void;

  // 缩进
  indent: () => void;
  outdent: () => void;

  // 状态查询
  isBold: () => boolean;
  isItalic: () => boolean;
  isHeading: (level?: number) => boolean;
  isBlockquote: () => boolean;
  isCodeBlock: () => boolean;
  isOrderedList: () => boolean;
  isUnorderedList: () => boolean;
}

export type Editor = EditorView & ExtendEditor;
export interface CodeMirrorEditor extends Editor {
  display: any;

  moduleType;
}

// @deprecated 已废弃，请直接使用 Editor 接口
// 保留此接口仅用于向后兼容，新代码不应使用
export interface IEditorContext {
  editor: Editor;
  wrapText?;
  replaceLines?;
  appendBlock?;
}
