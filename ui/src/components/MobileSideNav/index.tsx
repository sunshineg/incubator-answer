import { Offcanvas } from 'react-bootstrap';
import { useLocation } from 'react-router-dom';

import { SideNav, AdminSideNav } from '@/components';

import './index.scss';

const MobileSideNav = ({ show, onHide }) => {
  const { pathname } = useLocation();
  const isAdmin = pathname.includes('/admin');
  return (
    <Offcanvas
      show={show}
      onHide={() => {
        onHide(false);
      }}
      id="mobileSideNav"
      className="px-3 py-4">
      <Offcanvas.Body className="p-0">
        {isAdmin ? <AdminSideNav /> : <SideNav />}
      </Offcanvas.Body>
    </Offcanvas>
  );
};

export default MobileSideNav;
