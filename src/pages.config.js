import AIInsights from './pages/AIInsights';
import ClientDetails from './pages/ClientDetails';
import Clients from './pages/Clients';
import Commissions from './pages/Commissions';
import Dashboard from './pages/Dashboard';
import FieldMode from './pages/FieldMode';
import Opportunities from './pages/Opportunities';
import Orders from './pages/Orders';
import Principals from './pages/Principals';
import Quotes from './pages/Quotes';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import __Layout from './Layout.jsx';


export const PAGES = {
    "AIInsights": AIInsights,
    "ClientDetails": ClientDetails,
    "Clients": Clients,
    "Commissions": Commissions,
    "Dashboard": Dashboard,
    "FieldMode": FieldMode,
    "Opportunities": Opportunities,
    "Orders": Orders,
    "Principals": Principals,
    "Quotes": Quotes,
    "Reports": Reports,
    "Settings": Settings,
}

export const pagesConfig = {
    mainPage: "Dashboard",
    Pages: PAGES,
    Layout: __Layout,
};