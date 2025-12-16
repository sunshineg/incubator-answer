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

import { Editor, ExtendEditor } from '../../types';

import { createBaseMethods } from './base';
import { createEventMethods } from './events';
import { createCommandMethods } from './commands';

/**
 * Adapts TipTap editor to CodeMirror editor interface
 *
 * This adapter function converts TipTap editor's API to a CodeMirror-compatible interface,
 * enabling toolbar components to work properly in Rich mode. The adapter implements
 * the complete `ExtendEditor` interface, including base methods, event handling, and command methods.
 *
 * @param editor - TipTap editor instance
 * @returns Adapted editor instance that implements the unified Editor interface
 *
 * @example
 * ```typescript
 * const tipTapEditor = useEditor({ ... });
 * const adaptedEditor = createTipTapAdapter(tipTapEditor);
 * // Now you can use the unified API
 * adaptedEditor.insertBold('text');
 * adaptedEditor.insertHeading(1, 'Title');
 * ```
 */
export function createTipTapAdapter(editor: TipTapEditor): Editor {
  const baseMethods = createBaseMethods(editor);
  const eventMethods = createEventMethods(editor);
  const commandMethods = createCommandMethods(editor);

  const editorAdapter: ExtendEditor = {
    ...baseMethods,
    ...eventMethods,
    ...commandMethods,
  };

  return editorAdapter as unknown as Editor;
}
