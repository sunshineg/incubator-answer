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

import { FC, memo, useState, useEffect } from 'react';
import { Navbar, Nav, Form, FormControl, Col } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';
import {
  useSearchParams,
  Link,
  useNavigate,
  useLocation,
  useMatch,
} from 'react-router-dom';

import classnames from 'classnames';

import { userCenter, floppyNavigation } from '@/utils';
import {
  loggedUserInfoStore,
  siteInfoStore,
  brandingStore,
  loginSettingStore,
  themeSettingStore,
  sideNavStore,
} from '@/stores';
import { logout, useQueryNotificationStatus } from '@/services';
import { Icon, MobileSideNav } from '@/components';

import NavItems from './components/NavItems';

import './index.scss';

const Header: FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [urlSearch] = useSearchParams();
  const q = urlSearch.get('q');
  const { user, clear: clearUserStore } = loggedUserInfoStore();
  const { t } = useTranslation();
  const [searchStr, setSearch] = useState('');
  const siteInfo = siteInfoStore((state) => state.siteInfo);
  const brandingInfo = brandingStore((state) => state.branding);
  const loginSetting = loginSettingStore((state) => state.login);
  const { updateReview } = sideNavStore();
  const { data: redDot } = useQueryNotificationStatus();
  const [showMobileSideNav, setShowMobileSideNav] = useState(false);
  /**
   * Automatically append `tag` information when creating a question
   */
  const tagMatch = useMatch('/tags/:slugName');
  let askUrl = '/questions/ask';
  if (tagMatch && tagMatch.params.slugName) {
    askUrl = `${askUrl}?tags=${encodeURIComponent(tagMatch.params.slugName)}`;
  }

  useEffect(() => {
    updateReview({
      can_revision: Boolean(redDot?.can_revision),
      revision: Number(redDot?.revision),
    });
  }, [redDot]);

  const handleInput = (val) => {
    setSearch(val);
  };
  const handleSearch = (evt) => {
    evt.preventDefault();
    if (!searchStr) {
      return;
    }
    const searchUrl = `/search?q=${encodeURIComponent(searchStr)}`;
    navigate(searchUrl);
  };

  const handleLogout = async (evt) => {
    evt.preventDefault();
    await logout();
    clearUserStore();
    window.location.replace(window.location.href);
  };

  useEffect(() => {
    if (q && location.pathname === '/search') {
      handleInput(q);
    }
  }, [q]);

  useEffect(() => {
    // clear search input when navigate to other page
    if (location.pathname !== '/search' && searchStr) {
      setSearch('');
    }
    setShowMobileSideNav(false);
  }, [location.pathname]);

  let navbarStyle = 'theme-colored';
  const { theme, theme_config } = themeSettingStore((_) => _);
  if (theme_config?.[theme]?.navbar_style) {
    navbarStyle = `theme-${theme_config[theme].navbar_style}`;
  }

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1199.9) {
        setShowMobileSideNav(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <>
      <Navbar
        variant={navbarStyle === 'theme-colored' ? 'dark' : ''}
        expand="xl"
        className={classnames('sticky-top', navbarStyle)}
        id="header">
        <div className="w-100 d-flex align-items-center px-3">
          <Navbar.Toggle
            className="answer-navBar me-2"
            onClick={() => {
              setShowMobileSideNav(!showMobileSideNav);
            }}
          />

          <div className="d-flex justify-content-between align-items-center nav-grow flex-nowrap">
            <Navbar.Brand to="/" as={Link} className="lh-1 me-0 me-sm-5 p-0">
              {brandingInfo.logo ? (
                <>
                  <img
                    className="d-none d-xl-block logo me-0"
                    src={brandingInfo.logo}
                    alt={siteInfo.name}
                  />

                  <img
                    className="xl-none logo me-0"
                    src={brandingInfo.mobile_logo || brandingInfo.logo}
                    alt={siteInfo.name}
                  />
                </>
              ) : (
                <span>{siteInfo.name}</span>
              )}
            </Navbar.Brand>

            {/* mobile nav */}
            <div className="d-flex xl-none align-items-center flex-lg-nowrap">
              {user?.username ? (
                <NavItems
                  redDot={redDot}
                  userInfo={user}
                  logOut={(e) => handleLogout(e)}
                />
              ) : (
                <>
                  <Link
                    className={classnames('me-2 btn btn-link', {
                      'link-light': navbarStyle === 'theme-colored',
                      'link-primary': navbarStyle !== 'theme-colored',
                    })}
                    onClick={() => floppyNavigation.storageLoginRedirect()}
                    to={userCenter.getLoginUrl()}>
                    {t('btns.login')}
                  </Link>
                  {loginSetting.allow_new_registrations && (
                    <Link
                      className={classnames(
                        'btn',
                        navbarStyle === 'theme-colored'
                          ? 'btn-light'
                          : 'btn-primary',
                      )}
                      to={userCenter.getSignUpUrl()}>
                      {t('btns.signup')}
                    </Link>
                  )}
                </>
              )}
            </div>
          </div>

          <div className="d-none d-xl-flex flex-grow-1 me-auto">
            <Col lg={8} className="d-none d-xl-block ps-0">
              <Form
                action="/search"
                className="w-100 maxw-400 position-relative"
                onSubmit={handleSearch}>
                <div className="search-wrap" onClick={handleSearch}>
                  <Icon name="search" className="search-icon" />
                </div>
                <FormControl
                  type="search"
                  placeholder="sddfsdf"
                  className="placeholder-search"
                  value={searchStr}
                  name="q"
                  onChange={(e) => handleInput(e.target.value)}
                />
              </Form>
            </Col>

            {/* pc nav */}
            <Col
              lg={4}
              className="d-none d-xl-flex justify-content-start justify-content-sm-end">
              {user?.username ? (
                <Nav className="d-flex align-items-center flex-lg-nowrap">
                  <Nav.Item className="me-3">
                    <Link
                      to={askUrl}
                      className={classnames('text-capitalize text-nowrap btn', {
                        'btn-light': navbarStyle !== 'theme-light',
                        'btn-primary': navbarStyle === 'theme-light',
                      })}>
                      {t('btns.add_question')}
                    </Link>
                  </Nav.Item>

                  <NavItems
                    redDot={redDot}
                    userInfo={user}
                    logOut={handleLogout}
                  />
                </Nav>
              ) : (
                <>
                  <Link
                    className={classnames('me-2 btn btn-link', {
                      'link-light': navbarStyle === 'theme-colored',
                      'link-primary': navbarStyle !== 'theme-colored',
                    })}
                    onClick={() => floppyNavigation.storageLoginRedirect()}
                    to={userCenter.getLoginUrl()}>
                    {t('btns.login')}
                  </Link>
                  {loginSetting.allow_new_registrations && (
                    <Link
                      className={classnames(
                        'btn',
                        navbarStyle === 'theme-colored'
                          ? 'btn-light'
                          : 'btn-primary',
                      )}
                      to={userCenter.getSignUpUrl()}>
                      {t('btns.signup')}
                    </Link>
                  )}
                </>
              )}
            </Col>
          </div>
        </div>
      </Navbar>
      <MobileSideNav show={showMobileSideNav} onHide={setShowMobileSideNav} />
    </>
  );
};

export default memo(Header);
