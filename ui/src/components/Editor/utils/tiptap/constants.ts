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

/**
 * Markdown pattern matching regular expression constants
 *
 * Defines regular expression patterns for parsing and matching Markdown syntax.
 * These patterns are used to convert Markdown syntax to TipTap nodes, or from TipTap nodes
 * to Markdown format.
 *
 * @example
 * ```typescript
 * const headingMatch = text.match(MARKDOWN_PATTERNS.HEADING);
 * if (headingMatch) {
 *   const level = headingMatch[1].length; // Number of #
 *   const text = headingMatch[2]; // Heading text
 * }
 * ```
 */
export const MARKDOWN_PATTERNS = {
  HEADING: /^(#{1,6})\s+(.+)$/,
  ORDERED_LIST_ORIGINAL: /^(\s{0,})(\d+)\.\s/,
  ORDERED_LIST_NEW: /^(\d+)\.\s*(.*)$/,
  UNORDERED_LIST_ORIGINAL: /^(\s{0,})(-|\*)\s/,
  UNORDERED_LIST_NEW: /^[-*]\s*(.*)$/,
  INLINE_CODE: /^`(.+?)`$/,
  CODE_BLOCK: /^(\n)?```(\w+)?\n([\s\S]*?)\n```(\n)?$/,
  IMAGE: /^!\[([^\]]*)\]\(([^)]+)\)$/,
  LINK: /^\[([^\]]*)\]\(([^)]+)\)$/,
  AUTO_LINK: /^<(.+?)>$/,
  HORIZONTAL_RULE: /^-{3,}$/,
} as const;
