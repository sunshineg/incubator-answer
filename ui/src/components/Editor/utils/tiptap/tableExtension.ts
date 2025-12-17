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

import { Table, TableOptions } from '@tiptap/extension-table';
import type { NodeViewRendererProps } from '@tiptap/core';

interface TableWrapperOptions extends TableOptions {
  wrapperClass?: string;
}

export const TableWithWrapper = Table.extend<TableWrapperOptions>({
  addOptions() {
    const parentOptions = (this.parent?.() || {}) as Partial<TableOptions>;
    return {
      ...parentOptions,
      HTMLAttributes: parentOptions.HTMLAttributes || {},
      wrapperClass: 'table-responsive',
    } as TableWrapperOptions;
  },

  addNodeView() {
    return (props: NodeViewRendererProps) => {
      const { node } = props;
      const wrapperClass = this.options.wrapperClass || 'table-responsive';

      const dom = document.createElement('div');
      dom.className = wrapperClass;

      const table = document.createElement('table');

      const htmlAttrs = this.options.HTMLAttributes || {};
      if (htmlAttrs.class) {
        table.className = htmlAttrs.class as string;
      }
      if (htmlAttrs.style && typeof htmlAttrs.style === 'object') {
        Object.assign(table.style, htmlAttrs.style);
      }

      const colgroup = document.createElement('colgroup');
      if (node.firstChild) {
        const { childCount } = node.firstChild;
        for (let i = 0; i < childCount; i += 1) {
          const col = document.createElement('col');
          colgroup.appendChild(col);
        }
      }
      table.appendChild(colgroup);

      const tbody = document.createElement('tbody');
      table.appendChild(tbody);
      dom.appendChild(table);

      return {
        dom,
        contentDOM: tbody,
        update: (updatedNode) => {
          if (updatedNode.type !== node.type) {
            return false;
          }
          return true;
        },
      };
    };
  },
});
