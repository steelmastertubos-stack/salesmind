import Dashboard from './pages/Dashboard';
import Clients from './pages/Clients';
import Principals from './pages/Principals';
import Quotes from './pages/Quotes';
import Orders from './pages/Orders';
import FieldMode from './pages/FieldMode';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Dashboard": Dashboard,
    "Clients": Clients,
    "Principals": Principals,
    "Quotes": Quotes,
    "Orders": Orders,
    "FieldMode": FieldMode,
    "Reports": Reports,
    "Settings": Settings,
}

export const pagesConfig = {
    mainPage: "Dashboard",
    Pages: PAGES,
    Layout: __Layout,
};