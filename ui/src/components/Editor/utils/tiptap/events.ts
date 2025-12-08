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

import { logWarning } from './errorHandler';

/**
 * Checks if editor view is available
 */
function isViewAvailable(editor: TipTapEditor): boolean {
  return !!(editor.view && editor.view.dom);
}

/**
 * Creates event handling methods module
 *
 * Provides event handling methods for the editor, including:
 * - on: Register event listeners (change, focus, blur, dragenter, dragover, drop, paste)
 * - off: Remove event listeners
 *
 * Note: For DOM events (dragenter, dragover, drop, paste),
 * the editor view must be mounted before binding events.
 *
 * @param editor - TipTap editor instance
 * @returns Object containing event handling methods
 */
export function createEventMethods(editor: TipTapEditor) {
  return {
    on: (event: string, callback: (e?: unknown) => void) => {
      if (event === 'change') {
        editor.on('update', callback);
      } else if (event === 'focus') {
        editor.on('focus', callback);
      } else if (event === 'blur') {
        editor.on('blur', callback);
      } else if (
        event === 'dragenter' ||
        event === 'dragover' ||
        event === 'drop' ||
        event === 'paste'
      ) {
        if (!isViewAvailable(editor)) {
          logWarning(
            'TipTap editor view is not available yet. Event listener not attached.',
            {
              event,
            },
          );
          return;
        }
        editor.view.dom.addEventListener(event, callback as EventListener);
      }
    },

    off: (event: string, callback: (e?: unknown) => void) => {
      if (
        (event === 'dragenter' ||
          event === 'dragover' ||
          event === 'drop' ||
          event === 'paste') &&
        !isViewAvailable(editor)
      ) {
        return;
      }
      if (event === 'change') {
        editor.off('update', callback);
      } else if (event === 'focus') {
        editor.off('focus', callback);
      } else if (event === 'blur') {
        editor.off('blur', callback);
      } else if (
        event === 'dragenter' ||
        event === 'dragover' ||
        event === 'drop' ||
        event === 'paste'
      ) {
        editor.view.dom.removeEventListener(event, callback as EventListener);
      }
    },
  };
}
