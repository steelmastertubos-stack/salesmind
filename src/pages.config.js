import AIInsights from './pages/AIInsights';
import AlertList from './pages/AlertList';
import AuditFluxo from './pages/AuditFluxo';
import ClientAlertDetail from './pages/ClientAlertDetail';
import ClientDetails from './pages/ClientDetails';
import Clients from './pages/Clients';
import Commissions from './pages/Commissions';
import Dashboard from './pages/Dashboard';
import FieldMode from './pages/FieldMode';
import Financeiro from './pages/Financeiro';
import Generate2025Data from './pages/Generate2025Data';
import GenerateHistoricalData from './pages/GenerateHistoricalData';
import ImportData from './pages/ImportData';
import Opportunities from './pages/Opportunities';
import Orders from './pages/Orders';
import Principals from './pages/Principals';
import Products from './pages/Products';
import Quotes from './pages/Quotes';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import Tasks from './pages/Tasks';
import TestDataGenerator from './pages/TestDataGenerator';
import VTKAuditReport from './pages/VTKAuditReport';
import VTKCostSetup from './pages/VTKCostSetup';
import VTKMarginAuditReport from './pages/VTKMarginAuditReport';
import FixIntegratedFlow from './pages/FixIntegratedFlow';
import VerifyDataByYear from './pages/VerifyDataByYear';
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
    "Financeiro": Financeiro,
    "Generate2025Data": Generate2025Data,
    "GenerateHistoricalData": GenerateHistoricalData,
    "ImportData": ImportData,
    "Opportunities": Opportunities,
    "Orders": Orders,
    "Principals": Principals,
    "Products": Products,
    "Quotes": Quotes,
    "Reports": Reports,
    "Settings": Settings,
    "Tasks": Tasks,
    "TestDataGenerator": TestDataGenerator,
    "VTKAuditReport": VTKAuditReport,
    "VTKCostSetup": VTKCostSetup,
    "VTKMarginAuditReport": VTKMarginAuditReport,
    "FixIntegratedFlow": FixIntegratedFlow,
    "VerifyDataByYear": VerifyDataByYear,
}

export const pagesConfig = {
    mainPage: "Dashboard",
    Pages: PAGES,
    Layout: __Layout,
};