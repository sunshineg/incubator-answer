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
import { TableKit } from '@tiptap/extension-table';

import { Editor } from './types';
import { createTipTapAdapter } from './utils/tiptap/adapter';

interface WysiwygEditorProps {
  value: string;
  onChange?: (value: string) => void;
  onFocus?: () => void;
  onBlur?: () => void;
  placeholder?: string;
  autoFocus?: boolean;
  onEditorReady?: (editor: Editor) => void;
}

const WysiwygEditor: React.FC<WysiwygEditorProps> = ({
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

  const handleUpdate = useCallback(
    ({ editor: editorInstance }: { editor: TipTapEditor }) => {
      if (onChange) {
        const markdown = editorInstance.getMarkdown();
        onChange(markdown);
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
      TableKit,
      Placeholder.configure({
        placeholder,
      }),
    ],
    content: value || '',
    onUpdate: handleUpdate,
    onFocus: handleFocus,
    onBlur: handleBlur,
    editorProps: {
      attributes: {
        class: 'tiptap-editor',
      },
    },
  });

  useEffect(() => {
    if (!editor) {
      return;
    }

    const checkEditorReady = () => {
      if (editor.view && editor.view.dom) {
        if (value && value.trim() !== '') {
          editor.commands.setContent(value, { contentType: 'markdown' });
        } else {
          editor.commands.clearContent();
        }
        lastSyncedValueRef.current = value || '';
        if (!adaptedEditorRef.current) {
          adaptedEditorRef.current = createTipTapAdapter(editor);
        }
        onEditorReady?.(adaptedEditorRef.current);
      } else {
        setTimeout(checkEditorReady, 10);
      }
    };

    checkEditorReady();
  }, [editor]);

  useEffect(() => {
    if (!editor) {
      return;
    }

    if (value === lastSyncedValueRef.current) {
      return;
    }

    const currentMarkdown = editor.getMarkdown();
    if (currentMarkdown !== value) {
      if (value && value.trim() !== '') {
        editor.commands.setContent(value, { contentType: 'markdown' });
      } else {
        editor.commands.clearContent();
      }
      lastSyncedValueRef.current = value || '';
    }
  }, [editor, value]);

  useEffect(() => {
    if (editor && autoFocus) {
      setTimeout(() => {
        editor.commands.focus();
      }, 100);
    }
  }, [editor, autoFocus]);

  if (!editor) {
    return <div className="editor-loading">Loading editor...</div>;
  }

  return (
    <div className="wysiwyg-editor-wrap">
      <EditorContent editor={editor} />
    </div>
  );
};

export default WysiwygEditor;
