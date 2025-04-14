import { FC, useState, useEffect } from 'react';
import { Form, FormControl } from 'react-bootstrap';
import { useSearchParams, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import { Icon } from '@/components';

const SearchInput: FC<{ className?: string }> = ({ className }) => {
  const { t } = useTranslation('translation', { keyPrefix: 'header' });
  const navigate = useNavigate();
  const location = useLocation();
  const [urlSearch] = useSearchParams();
  const q = urlSearch.get('q');
  const [searchStr, setSearch] = useState('');
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
  }, [location.pathname]);
  return (
    <Form
      action="/search"
      className={`w-100 position-relative mx-auto ${className}`}
      onSubmit={handleSearch}>
      <div className="search-wrap" onClick={handleSearch}>
        <Icon name="search" className="search-icon" />
      </div>
      <FormControl
        type="search"
        placeholder={t('search.placeholder')}
        className="placeholder-search"
        value={searchStr}
        name="q"
        onChange={(e) => handleInput(e.target.value)}
      />
    </Form>
  );
};

export default SearchInput;
