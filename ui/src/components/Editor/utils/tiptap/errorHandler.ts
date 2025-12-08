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
 * Editor error type enumeration
 *
 * Defines various error types that may occur in the editor, used for error classification and handling.
 */
export enum EditorErrorType {
  COMMAND_EXECUTION_FAILED = 'COMMAND_EXECUTION_FAILED',
  POSITION_CONVERSION_FAILED = 'POSITION_CONVERSION_FAILED',
  CONTENT_PARSING_FAILED = 'CONTENT_PARSING_FAILED',
  EVENT_LISTENER_FAILED = 'EVENT_LISTENER_FAILED',
}

/**
 * Editor error interface
 */
export interface EditorError {
  type: EditorErrorType;
  message: string;
  originalError?: Error;
  context?: Record<string, unknown>;
  timestamp: number;
}

/**
 * Handles editor errors with unified log format
 *
 * Unified error handling for the editor, recording error information, context, and stack traces
 * for easier problem identification and debugging.
 *
 * @param error - Original error object
 * @param type - Error type
 * @param context - Optional context information (function name, parameters, etc.)
 * @returns Processed error object
 *
 * @example
 * ```typescript
 * try {
 *   editor.commands.insertContent(content);
 * } catch (error) {
 *   handleEditorError(error, EditorErrorType.COMMAND_EXECUTION_FAILED, {
 *     function: 'insertContent',
 *     content: content.substring(0, 50),
 *   });
 * }
 * ```
 */
export function handleEditorError(
  error: Error,
  type: EditorErrorType,
  context?: Record<string, unknown>,
): EditorError {
  const editorError: EditorError = {
    type,
    message: error.message,
    originalError: error,
    context,
    timestamp: Date.now(),
  };

  console.error(`[Editor Error] ${type}:`, {
    message: editorError.message,
    context: editorError.context,
    stack: error.stack,
  });

  return editorError;
}

/**
 * Safely executes TipTap command with error handling and fallback strategy
 *
 * Automatically catches errors when executing TipTap commands. If a fallback function is provided,
 * it attempts to execute the fallback operation when the main command fails. All errors are uniformly recorded.
 *
 * @param command - Main command function to execute
 * @param fallback - Optional fallback function to execute when main command fails
 * @param errorType - Error type, defaults to COMMAND_EXECUTION_FAILED
 * @param context - Optional context information
 * @returns Command execution result, returns undefined if failed and no fallback
 *
 * @example
 * ```typescript
 * const result = safeExecuteCommand(
 *   () => editor.commands.insertContent(content),
 *   () => editor.commands.insertContent(content, { contentType: 'markdown' }),
 *   EditorErrorType.COMMAND_EXECUTION_FAILED,
 *   { function: 'insertContent', contentLength: content.length }
 * );
 * ```
 */
export function safeExecuteCommand<T>(
  command: () => T,
  fallback?: () => T,
  errorType: EditorErrorType = EditorErrorType.COMMAND_EXECUTION_FAILED,
  context?: Record<string, unknown>,
): T | undefined {
  try {
    return command();
  } catch (error) {
    handleEditorError(error as Error, errorType, context);
    if (fallback) {
      try {
        return fallback();
      } catch (fallbackError) {
        handleEditorError(fallbackError as Error, errorType, {
          ...context,
          isFallback: true,
        });
      }
    }
    return undefined;
  }
}

/**
 * Logs warning information (for non-fatal errors)
 *
 * Records non-fatal warning information to alert potential issues without affecting functionality.
 *
 * @param message - Warning message
 * @param context - Optional context information
 *
 * @example
 * ```typescript
 * if (start < 0 || end < 0) {
 *   logWarning('Invalid position range', { start, end, function: 'setSelection' });
 *   return;
 * }
 * ```
 */
export function logWarning(
  message: string,
  context?: Record<string, unknown>,
): void {
  console.warn(`[Editor Warning] ${message}`, context || {});
}
