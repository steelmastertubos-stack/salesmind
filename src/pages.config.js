import AIInsights from './pages/AIInsights';
import ClientDetails from './pages/ClientDetails';
import Clients from './pages/Clients';
import Commissions from './pages/Commissions';
import Dashboard from './pages/Dashboard';
import FieldMode from './pages/FieldMode';
import ImportData from './pages/ImportData';
import Opportunities from './pages/Opportunities';
import Orders from './pages/Orders';
import Principals from './pages/Principals';
import Quotes from './pages/Quotes';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import VTKAuditReport from './pages/VTKAuditReport';
import VTKCostSetup from './pages/VTKCostSetup';
import VTKMarginAuditReport from './pages/VTKMarginAuditReport';
import AuditFluxo from './pages/AuditFluxo';
import __Layout from './Layout.jsx';


export const PAGES = {
    "AIInsights": AIInsights,
    "ClientDetails": ClientDetails,
    "Clients": Clients,
    "Commissions": Commissions,
    "Dashboard": Dashboard,
    "FieldMode": FieldMode,
    "ImportData": ImportData,
    "Opportunities": Opportunities,
    "Orders": Orders,
    "Principals": Principals,
    "Quotes": Quotes,
    "Reports": Reports,
    "Settings": Settings,
    "VTKAuditReport": VTKAuditReport,
    "VTKCostSetup": VTKCostSetup,
    "VTKMarginAuditReport": VTKMarginAuditReport,
    "AuditFluxo": AuditFluxo,
}

export const pagesConfig = {
    mainPage: "Dashboard",
    Pages: PAGES,
    Layout: __Layout,
};