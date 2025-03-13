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

import { FC, memo, useEffect } from 'react';
import { Outlet, useLocation, ScrollRestoration } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';

import { SWRConfig } from 'swr';

import {
  toastStore,
  loginToContinueStore,
  errorCodeStore,
  siteLealStore,
} from '@/stores';
import {
  Header,
  Footer,
  Toast,
  Customize,
  CustomizeTheme,
  PageTags,
  HttpErrorContent,
} from '@/components';
import { LoginToContinueModal, BadgeModal } from '@/components/Modal';
import { changeTheme, Storage } from '@/utils';
import { useQueryNotificationStatus } from '@/services';
import { useExternalToast } from '@/hooks';
import { EXTERNAL_CONTENT_DISPLAY_MODE } from '@/common/constants';

const Layout: FC = () => {
  const location = useLocation();
  const { msg: toastMsg, variant, clear: toastClear } = toastStore();
  const externalToast = useExternalToast();
  const externalContentDisplay = siteLealStore(
    (state) => state.external_content_display,
  );
  const closeToast = () => {
    toastClear();
  };
  const { code: httpStatusCode, reset: httpStatusReset } = errorCodeStore();
  const { show: showLoginToContinueModal } = loginToContinueStore();
  const { data: notificationData } = useQueryNotificationStatus();

  useEffect(() => {
    httpStatusReset();
  }, [location]);

  useEffect(() => {
    const systemThemeQuery = window.matchMedia('(prefers-color-scheme: dark)');
    function handleSystemThemeChange(event) {
      if (event.matches) {
        changeTheme('dark');
      } else {
        changeTheme('light');
      }
    }

    systemThemeQuery.addListener(handleSystemThemeChange);

    return () => {
      systemThemeQuery.removeListener(handleSystemThemeChange);
    };
  }, []);

  const replaceImgSrc = (img) => {
    const storageUserExternalMode = Storage.get(EXTERNAL_CONTENT_DISPLAY_MODE);

    if (
      storageUserExternalMode !== 'always' &&
      img.src &&
      !img.src.startsWith(window.location.origin)
    ) {
      externalToast.onShow();
      img.dataset.src = img.src;
      img.removeAttribute('src');
    }
  };

  useEffect(() => {
    // Controlling the loading of external image resources
    const observer = new MutationObserver((mutationsList) => {
      mutationsList.forEach((mutation) => {
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeName === 'IMG') {
              replaceImgSrc(node);
            }
            if ((node as Element).querySelectorAll) {
              const images = (node as Element).querySelectorAll('img');
              images.forEach(replaceImgSrc);
            }
          });
        }
      });
    });

    if (externalContentDisplay !== 'always_display') {
      // Process all existing images
      const images = document.querySelectorAll('img');
      images.forEach(replaceImgSrc);
      // Process all images added later
      observer.observe(document.body, { childList: true, subtree: true });
    }

    return () => observer.disconnect();
  }, [externalContentDisplay]);
  return (
    <HelmetProvider>
      <PageTags />
      <CustomizeTheme />
      <SWRConfig
        value={{
          revalidateOnFocus: false,
        }}>
        <Header />
        {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events */}
        <div className="position-relative page-wrap d-flex flex-column flex-fill">
          {httpStatusCode ? (
            <HttpErrorContent httpCode={httpStatusCode} />
          ) : (
            <Outlet />
          )}
        </div>
        <Toast msg={toastMsg} variant={variant} onClose={closeToast} />
        <Footer />
        <Customize />
        <LoginToContinueModal visible={showLoginToContinueModal} />
        <BadgeModal
          badge={notificationData?.badge_award}
          visible={Boolean(notificationData?.badge_award)}
        />
        <ScrollRestoration />
      </SWRConfig>
    </HelmetProvider>
  );
};

export default memo(Layout);
