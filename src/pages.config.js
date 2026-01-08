import AIInsights from './pages/AIInsights';
import ClientDetails from './pages/ClientDetails';
import Clients from './pages/Clients';
import Dashboard from './pages/Dashboard';
import FieldMode from './pages/FieldMode';
import Orders from './pages/Orders';
import Principals from './pages/Principals';
import Quotes from './pages/Quotes';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import Commissions from './pages/Commissions';
import __Layout from './Layout.jsx';


export const PAGES = {
    "AIInsights": AIInsights,
    "ClientDetails": ClientDetails,
    "Clients": Clients,
    "Dashboard": Dashboard,
    "FieldMode": FieldMode,
    "Orders": Orders,
    "Principals": Principals,
    "Quotes": Quotes,
    "Reports": Reports,
    "Settings": Settings,
    "Commissions": Commissions,
}

export const pagesConfig = {
    mainPage: "Dashboard",
    Pages: PAGES,
    Layout: __Layout,
};