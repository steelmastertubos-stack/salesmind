import AIInsights from './pages/AIInsights';
import AlertList from './pages/AlertList';
import AuditFluxo from './pages/AuditFluxo';
import ClientAlertDetail from './pages/ClientAlertDetail';
import ClientDetails from './pages/ClientDetails';
import Clients from './pages/Clients';
import Commissions from './pages/Commissions';
import Dashboard from './pages/Dashboard';
import FieldMode from './pages/FieldMode';
import ImportData from './pages/ImportData';
import Opportunities from './pages/Opportunities';
import Orders from './pages/Orders';
import Principals from './pages/Principals';
import Products from './pages/Products';
import Quotes from './pages/Quotes';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import Tasks from './pages/Tasks';
import VTKAuditReport from './pages/VTKAuditReport';
import VTKCostSetup from './pages/VTKCostSetup';
import VTKMarginAuditReport from './pages/VTKMarginAuditReport';
import __Layout from './Layout.jsx';


export const PAGES = {
    "AIInsights": AIInsights,
    "AlertList": AlertList,
    "AuditFluxo": AuditFluxo,
    "ClientAlertDetail": ClientAlertDetail,
    "ClientDetails": ClientDetails,
    "Clients": Clients,
    "Commissions": Commissions,
    "Dashboard": Dashboard,
    "FieldMode": FieldMode,
    "ImportData": ImportData,
    "Opportunities": Opportunities,
    "Orders": Orders,
    "Principals": Principals,
    "Products": Products,
    "Quotes": Quotes,
    "Reports": Reports,
    "Settings": Settings,
    "Tasks": Tasks,
    "VTKAuditReport": VTKAuditReport,
    "VTKCostSetup": VTKCostSetup,
    "VTKMarginAuditReport": VTKMarginAuditReport,
}

export const pagesConfig = {
    mainPage: "Dashboard",
    Pages: PAGES,
    Layout: __Layout,
};