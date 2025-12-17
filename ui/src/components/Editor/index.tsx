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

import {
  useRef,
  useState,
  ForwardRefRenderFunction,
  forwardRef,
  useImperativeHandle,
  useCallback,
} from 'react';

import classNames from 'classnames';

import { PluginType, useRenderPlugin } from '@/utils/pluginKit';
import PluginRender from '../PluginRender';

import {
  BlockQuote,
  Bold,
  Code,
  Heading,
  Help,
  Hr,
  Image,
  Indent,
  Italice,
  Link as LinkItem,
  OL,
  Outdent,
  Table,
  UL,
  File,
} from './ToolBars';
import { htmlRender } from './utils';
import Viewer from './Viewer';
import { EditorContext } from './EditorContext';
import RichEditor from './RichEditor';
import MarkdownEditor from './MarkdownEditor';
import { Editor } from './types';

import './index.scss';

export interface EditorRef {
  getHtml: () => string;
}

interface EventRef {
  onChange?(value: string): void;
  onFocus?(): void;
  onBlur?(): void;
}

interface Props extends EventRef {
  editorPlaceholder?;
  className?;
  value;
  autoFocus?: boolean;
}

const MDEditor: ForwardRefRenderFunction<EditorRef, Props> = (
  {
    editorPlaceholder = '',
    className = '',
    value,
    onChange,
    onFocus,
    onBlur,
    autoFocus = false,
  },
  ref,
) => {
  const [mode, setMode] = useState<'markdown' | 'rich'>('rich');
  const [currentEditor, setCurrentEditor] = useState<Editor | null>(null);
  const previewRef = useRef<{ getHtml; element } | null>(null);

  useRenderPlugin(previewRef.current?.element);

  const handleModeChange = useCallback(
    (newMode: 'markdown' | 'rich') => {
      if (newMode === mode) {
        return;
      }

      setCurrentEditor(null);
      setMode(newMode);
    },
    [mode],
  );

  const getHtml = useCallback(() => {
    return previewRef.current?.getHtml();
  }, []);

  useImperativeHandle(
    ref,
    () => ({
      getHtml,
    }),
    [getHtml],
  );

  const EditorComponent = mode === 'markdown' ? MarkdownEditor : RichEditor;

  return (
    <>
      <div className={classNames('md-editor-wrap rounded', className)}>
        <div className="toolbar-wrap px-3 d-flex align-items-center flex-wrap">
          <EditorContext.Provider value={currentEditor}>
            <PluginRender
              type={PluginType.Editor}
              className="d-flex align-items-center flex-wrap"
              editor={currentEditor}
              previewElement={previewRef.current?.element}>
              <Heading />
              <Bold />
              <Italice />
              <div className="toolbar-divider" />
              <Code />
              <LinkItem />
              <BlockQuote />
              <Image />
              <File />
              <Table />
              <div className="toolbar-divider" />
              <OL />
              <UL />
              <Indent />
              <Outdent />
              <Hr />
              <div className="toolbar-divider" />
              <Help />
            </PluginRender>
          </EditorContext.Provider>

          <div className="btn-group ms-auto" role="group">
            <button
              type="button"
              className={`btn btn-sm ${
                mode === 'markdown' ? 'btn-primary' : 'btn-outline-secondary'
              }`}
              title="Markdown Mode"
              onClick={() => handleModeChange('markdown')}>
              <i className="bi bi-filetype-md" />
            </button>
            <button
              type="button"
              className={`btn btn-sm ${
                mode === 'rich' ? 'btn-primary' : 'btn-outline-secondary'
              }`}
              title="Rich Mode"
              onClick={() => handleModeChange('rich')}>
              <i className="bi bi-type" />
            </button>
          </div>
        </div>

        <EditorComponent
          key={mode}
          value={value}
          onChange={(markdown) => {
            onChange?.(markdown);
          }}
          onFocus={onFocus}
          onBlur={onBlur}
          placeholder={editorPlaceholder}
          autoFocus={autoFocus}
          onEditorReady={(editor) => {
            setCurrentEditor(editor);
          }}
        />
      </div>
      {mode === 'markdown' && <Viewer ref={previewRef} value={value} />}
    </>
  );
};
export { htmlRender };
export default forwardRef(MDEditor);
