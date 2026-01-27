import AIInsights from './pages/AIInsights';
import AlertList from './pages/AlertList';
import AuditComplete from './pages/AuditComplete';
import AuditFluxo from './pages/AuditFluxo';
import AutoTest from './pages/AutoTest';
import CleanNewAcoProducts from './pages/CleanNewAcoProducts';
import ClientAlertDetail from './pages/ClientAlertDetail';
import ClientDetails from './pages/ClientDetails';
import ClientRanking from './pages/ClientRanking';
import Clients from './pages/Clients';
import Commissions from './pages/Commissions';
import Dashboard from './pages/Dashboard';
import DiagnosticoHistorico from './pages/DiagnosticoHistorico';
import FieldMode from './pages/FieldMode';
import Financeiro from './pages/Financeiro';
import FixIntegratedFlow from './pages/FixIntegratedFlow';
import FixNewAcoPrices from './pages/FixNewAcoPrices';
import Gamification from './pages/Gamification';
import Generate2025Data from './pages/Generate2025Data';
import GenerateHistoricalData from './pages/GenerateHistoricalData';
import ImportData from './pages/ImportData';
import LossReport from './pages/LossReport';
import Opportunities from './pages/Opportunities';
import Orders from './pages/Orders';
import Principals from './pages/Principals';
import Products from './pages/Products';
import Quotes from './pages/Quotes';
import RecalculateTags from './pages/RecalculateTags';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import Tasks from './pages/Tasks';
import TestDataGenerator from './pages/TestDataGenerator';
import VTKAuditReport from './pages/VTKAuditReport';
import VTKCostSetup from './pages/VTKCostSetup';
import VTKMarginAuditReport from './pages/VTKMarginAuditReport';
import VerifyDataByYear from './pages/VerifyDataByYear';
import __Layout from './Layout.jsx';


export const PAGES = {
    "AIInsights": AIInsights,
    "AlertList": AlertList,
    "AuditComplete": AuditComplete,
    "AuditFluxo": AuditFluxo,
    "AutoTest": AutoTest,
    "CleanNewAcoProducts": CleanNewAcoProducts,
    "ClientAlertDetail": ClientAlertDetail,
    "ClientDetails": ClientDetails,
    "ClientRanking": ClientRanking,
    "Clients": Clients,
    "Commissions": Commissions,
    "Dashboard": Dashboard,
    "DiagnosticoHistorico": DiagnosticoHistorico,
    "FieldMode": FieldMode,
    "Financeiro": Financeiro,
    "FixIntegratedFlow": FixIntegratedFlow,
    "FixNewAcoPrices": FixNewAcoPrices,
    "Gamification": Gamification,
    "Generate2025Data": Generate2025Data,
    "GenerateHistoricalData": GenerateHistoricalData,
    "ImportData": ImportData,
    "LossReport": LossReport,
    "Opportunities": Opportunities,
    "Orders": Orders,
    "Principals": Principals,
    "Products": Products,
    "Quotes": Quotes,
    "RecalculateTags": RecalculateTags,
    "Reports": Reports,
    "Settings": Settings,
    "Tasks": Tasks,
    "TestDataGenerator": TestDataGenerator,
    "VTKAuditReport": VTKAuditReport,
    "VTKCostSetup": VTKCostSetup,
    "VTKMarginAuditReport": VTKMarginAuditReport,
    "VerifyDataByYear": VerifyDataByYear,
}

export const pagesConfig = {
    mainPage: "Dashboard",
    Pages: PAGES,
    Layout: __Layout,
};