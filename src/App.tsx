import { BrowserRouter as Router, Routes, Route } from "react-router";
import SignIn from "./pages/AuthPages/SignIn";
import SignUp from "./pages/AuthPages/SignUp";
import NotFound from "./pages/OtherPage/NotFound";
import UserProfiles from "./pages/UserProfiles";
import AppLayout from "./layout/AppLayout";
import { ScrollToTop } from "./components/common/ScrollToTop";
import Home from "./pages/Dashboard/Home";
import Admins from "./pages/Admins";
import Patients from "./pages/Patients";
import Categories from "./pages/Categories";
import DoctorsLabs from "./pages/DoctorsLabs";
import Slots from "./pages/Slots";
import BookingHistory from "./pages/BookingHistory";

export default function App() {
  return (
    <>
      <Router>
        <ScrollToTop />
        <Routes>
          <Route element={<AppLayout />}>
            <Route index path="/" element={<Home />} />
            <Route path="/admins" element={<Admins />} />
            <Route path="/patients" element={<Patients />} />
            <Route path="/categories" element={<Categories />} />
            <Route path="/doctors-labs" element={<DoctorsLabs />} />
            <Route path="/slots" element={<Slots />} />
            <Route path="/booking-history" element={<BookingHistory />} />
            <Route path="/profile" element={<UserProfiles />} />
          </Route>

          {/* Auth Layout */}
          <Route path="/signin" element={<SignIn />} />
          <Route path="/signup" element={<SignUp />} />

          {/* Fallback Route */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Router>
    </>
  );
}
