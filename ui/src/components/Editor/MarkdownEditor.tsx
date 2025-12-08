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

import { useEffect, useRef } from 'react';

import { EditorView } from '@codemirror/view';

import { Editor } from './types';
import { useEditor } from './utils';

interface MarkdownEditorProps {
  value: string;
  onChange?: (value: string) => void;
  onFocus?: () => void;
  onBlur?: () => void;
  placeholder?: string;
  autoFocus?: boolean;
  onEditorReady?: (editor: Editor) => void;
}

const MarkdownEditor: React.FC<MarkdownEditorProps> = ({
  value,
  onChange,
  onFocus,
  onBlur,
  placeholder,
  autoFocus,
  onEditorReady,
}) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const lastSyncedValueRef = useRef<string>(value);

  const editor = useEditor({
    editorRef,
    onChange,
    onFocus,
    onBlur,
    placeholder,
    autoFocus,
  });

  // 初始化内容（只在编辑器创建时执行）
  useEffect(() => {
    if (!editor) {
      return;
    }

    // 初始化编辑器内容
    editor.setValue(value || '');
    lastSyncedValueRef.current = value || '';
    onEditorReady?.(editor);
  }, [editor]); // 只在编辑器创建时执行

  // 当外部 value 变化时更新（但不是用户输入导致的）
  useEffect(() => {
    if (!editor) {
      return;
    }

    // 如果 value 和 lastSyncedValueRef 相同，说明是用户输入导致的更新，跳过
    if (value === lastSyncedValueRef.current) {
      return;
    }

    // 外部 value 真正变化，更新编辑器
    const currentValue = editor.getValue();
    if (currentValue !== value) {
      editor.setValue(value || '');
      lastSyncedValueRef.current = value || '';
    }
  }, [editor, value]);

  // 清理：组件卸载时销毁编辑器
  useEffect(() => {
    return () => {
      if (editor) {
        // CodeMirror EditorView 有 destroy 方法
        const view = editor as unknown as EditorView;
        if (view.destroy) {
          view.destroy();
        }
      }
    };
  }, [editor]);

  return (
    <div className="content-wrap">
      <div
        className="md-editor position-relative w-100 h-100"
        ref={editorRef}
      />
    </div>
  );
};

export default MarkdownEditor;
