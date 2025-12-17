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

import { useEffect, useRef, useCallback } from 'react';

import {
  useEditor,
  EditorContent,
  Editor as TipTapEditor,
} from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import { Markdown } from '@tiptap/markdown';
import Image from '@tiptap/extension-image';
import { TableRow, TableCell, TableHeader } from '@tiptap/extension-table';

import { Editor, BaseEditorProps } from './types';
import { createTipTapAdapter } from './utils/tiptap/adapter';
import { TableWithWrapper } from './utils/tiptap/tableExtension';

interface RichEditorProps extends BaseEditorProps {}

const RichEditor: React.FC<RichEditorProps> = ({
  value,
  onChange,
  onFocus,
  onBlur,
  placeholder = '',
  autoFocus = false,
  onEditorReady,
}) => {
  const lastSyncedValueRef = useRef<string>(value);
  const adaptedEditorRef = useRef<Editor | null>(null);
  const isInitializedRef = useRef<boolean>(false);
  const isUpdatingFromPropsRef = useRef<boolean>(false);
  const onEditorReadyRef = useRef(onEditorReady);
  const autoFocusRef = useRef(autoFocus);
  const initialValueRef = useRef<string>(value);

  useEffect(() => {
    onEditorReadyRef.current = onEditorReady;
    autoFocusRef.current = autoFocus;
  }, [onEditorReady, autoFocus]);

  const isViewAvailable = (editorInstance: TipTapEditor | null): boolean => {
    if (!editorInstance) {
      return false;
    }
    if (editorInstance.isDestroyed) {
      return false;
    }
    return !!(editorInstance.view && editorInstance.state);
  };

  const handleCreate = useCallback(
    ({ editor: editorInstance }: { editor: TipTapEditor }) => {
      if (isInitializedRef.current || !isViewAvailable(editorInstance)) {
        return;
      }

      isInitializedRef.current = true;

      const initialValue = initialValueRef.current;
      if (initialValue && initialValue.trim() !== '') {
        editorInstance.commands.setContent(initialValue, {
          contentType: 'markdown',
        });
        lastSyncedValueRef.current = initialValue;
      }

      adaptedEditorRef.current = createTipTapAdapter(editorInstance);
      onEditorReadyRef.current?.(adaptedEditorRef.current);

      if (autoFocusRef.current) {
        editorInstance.commands.focus();
      }
    },
    [],
  );

  const handleUpdate = useCallback(
    ({ editor: editorInstance }: { editor: TipTapEditor }) => {
      if (onChange && !isUpdatingFromPropsRef.current) {
        const markdown = editorInstance.getMarkdown();
        onChange(markdown);
        lastSyncedValueRef.current = markdown;
      }
    },
    [onChange],
  );

  const handleFocus = useCallback(() => {
    onFocus?.();
  }, [onFocus]);

  const handleBlur = useCallback(() => {
    onBlur?.();
  }, [onBlur]);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Markdown,
      Image,
      TableWithWrapper.configure({
        HTMLAttributes: {
          class: 'table table-bordered',
          style: {
            width: '100%',
          },
        },
        resizable: true,
        wrapperClass: 'table-responsive',
      }),
      TableRow.configure({
        HTMLAttributes: {
          class: 'table-row',
        },
      }),
      TableCell,
      TableHeader,
      Placeholder.configure({
        placeholder,
      }),
    ],
    onCreate: handleCreate,
    onUpdate: handleUpdate,
    onFocus: handleFocus,
    onBlur: handleBlur,
    editorProps: {
      attributes: {
        class: 'tiptap-editor fmt',
      },
    },
  });

  useEffect(() => {
    if (
      !editor ||
      !isInitializedRef.current ||
      !isViewAvailable(editor) ||
      value === lastSyncedValueRef.current
    ) {
      return;
    }

    try {
      const currentMarkdown = editor.getMarkdown();
      if (currentMarkdown !== value) {
        isUpdatingFromPropsRef.current = true;
        if (value && value.trim() !== '') {
          editor.commands.setContent(value, { contentType: 'markdown' });
        } else {
          editor.commands.clearContent();
        }
        lastSyncedValueRef.current = value || '';
        setTimeout(() => {
          isUpdatingFromPropsRef.current = false;
        }, 0);
      }
    } catch (error) {
      console.warn('Editor view not available when syncing value:', error);
    }
  }, [editor, value]);

  useEffect(() => {
    initialValueRef.current = value;
    lastSyncedValueRef.current = value;
    isInitializedRef.current = false;
    adaptedEditorRef.current = null;
    isUpdatingFromPropsRef.current = false;

    return () => {
      if (editor) {
        editor.destroy();
      }
      isInitializedRef.current = false;
      adaptedEditorRef.current = null;
      isUpdatingFromPropsRef.current = false;
    };
  }, [editor]);

  if (!editor) {
    return <div className="editor-loading">Loading editor...</div>;
  }

  return <EditorContent className="rich-editor-wrap" editor={editor} />;
};

export default RichEditor;
