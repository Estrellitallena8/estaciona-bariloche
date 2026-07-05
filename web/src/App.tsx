import { Route, Routes } from "react-router-dom";
import { Layout } from "./components/Layout";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { LoginPage } from "./pages/LoginPage";
import { RegisterPage } from "./pages/RegisterPage";
import { HomePage } from "./pages/HomePage";
import { ScanPage } from "./pages/ScanPage";
import { ConfirmPage } from "./pages/ConfirmPage";
import { TicketPage } from "./pages/TicketPage";
import { HistoryPage } from "./pages/HistoryPage";
import { VehiclesPage } from "./pages/VehiclesPage";
import { InspectorPage } from "./pages/InspectorPage";

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/registro" element={<RegisterPage />} />

      <Route
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<HomePage />} />
        <Route path="/escanear" element={<ScanPage />} />
        <Route path="/confirmar" element={<ConfirmPage />} />
        <Route path="/ticket/:id" element={<TicketPage />} />
        <Route path="/historial" element={<HistoryPage />} />
        <Route path="/vehiculos" element={<VehiclesPage />} />
        <Route path="/inspector" element={<InspectorPage />} />
      </Route>
    </Routes>
  );
}

export default App;
