import { useEffect } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useNavigate,
  useLocation,
} from "react-router-dom";
import { App as CapApp } from "@capacitor/app";
import { AppProvider, useApp } from "./contexts/AppContext";

// Pages
import Splash from "./pages/Splash";
import Login from "./pages/Login";
import Register from "./pages/Register";
import DonorSurvey from "./pages/DonorSurvey";
import Home from "./pages/Home";
import Explore from "./pages/Explore";
import RequestDetail from "./pages/RequestDetail";
import ConfirmDonation from "./pages/ConfirmDonation";
import DonationConfirmed from "./pages/DonationConfirmed";
import DonationCancelled from "./pages/DonationCancelled";
import CreateRequest from "./pages/CreateRequest";
import Campaigns from "./pages/Campaigns";
import CampaignDetail from "./pages/CampaignDetail";
import CreateCampaign from "./pages/CreateCampaign";
import MyRequests from "./pages/MyRequests";
import MyCampaigns from "./pages/MyCampaigns";
import Profile from "./pages/Profile";
import Notifications from "./pages/Notifications";
import RateExperience from "./pages/RateExperience";
import LoadingScreen from "./components/LoadingScreen";

// ─── Auth guard ────────────────────────────────────────────────────────────────
function AuthGuard({ children }: { children: React.ReactNode }) {
  const { authUser, isLoading } = useApp();
  if (isLoading) return <LoadingScreen />;
  if (!authUser) return <Navigate to="/" replace />;
  return <>{children}</>;
}

// ─── Back button handler for Android ─────────────────────────────────────────
function BackButtonHandler() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const root = ["/", "/login", "/home"];
    CapApp.addListener("backButton", ({ canGoBack }) => {
      if (root.includes(location.pathname) || !canGoBack) {
        CapApp.exitApp();
      } else {
        navigate(-1);
      }
    });
    return () => {
      CapApp.removeAllListeners();
    };
  }, [navigate, location.pathname]);

  return null;
}

// ─── App ─────────────────────────────────────────────────────────────────────
export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <BackButtonHandler />
        <Routes>
          {/* Public */}
          <Route path="/" element={<Splash />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/donor-survey" element={<DonorSurvey />} />

          {/* Protected */}
          <Route
            path="/home"
            element={
              <AuthGuard>
                <Home />
              </AuthGuard>
            }
          />
          <Route
            path="/explore"
            element={
              <AuthGuard>
                <Explore />
              </AuthGuard>
            }
          />
          <Route
            path="/request/:id"
            element={
              <AuthGuard>
                <RequestDetail />
              </AuthGuard>
            }
          />
          <Route
            path="/confirm-donation/:id"
            element={
              <AuthGuard>
                <ConfirmDonation />
              </AuthGuard>
            }
          />
          <Route
            path="/donation-confirmed/:id"
            element={
              <AuthGuard>
                <DonationConfirmed />
              </AuthGuard>
            }
          />
          <Route
            path="/donation-cancelled"
            element={
              <AuthGuard>
                <DonationCancelled />
              </AuthGuard>
            }
          />
          <Route
            path="/create-request"
            element={
              <AuthGuard>
                <CreateRequest />
              </AuthGuard>
            }
          />
          <Route
            path="/campaigns"
            element={
              <AuthGuard>
                <Campaigns />
              </AuthGuard>
            }
          />
          <Route
            path="/campaign/:id"
            element={
              <AuthGuard>
                <CampaignDetail />
              </AuthGuard>
            }
          />
          <Route
            path="/create-campaign"
            element={
              <AuthGuard>
                <CreateCampaign />
              </AuthGuard>
            }
          />
          <Route
            path="/my-requests"
            element={
              <AuthGuard>
                <MyRequests />
              </AuthGuard>
            }
          />
          <Route
            path="/my-campaigns"
            element={
              <AuthGuard>
                <MyCampaigns />
              </AuthGuard>
            }
          />
          <Route
            path="/profile"
            element={
              <AuthGuard>
                <Profile />
              </AuthGuard>
            }
          />
          <Route
            path="/notifications"
            element={
              <AuthGuard>
                <Notifications />
              </AuthGuard>
            }
          />
          <Route
            path="/rate/:userId"
            element={
              <AuthGuard>
                <RateExperience />
              </AuthGuard>
            }
          />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AppProvider>
  );
}
