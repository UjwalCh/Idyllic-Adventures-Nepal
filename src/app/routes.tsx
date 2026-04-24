import { createBrowserRouter } from "react-router";
import { RootLayout } from "./components/layouts/RootLayout";
import { AdminLayout } from "./components/layouts/AdminLayout";
import { HomePage } from "./pages/HomePage";
import { TreksPage } from "./pages/TreksPage";
import { TrekDetailPage } from "./pages/TrekDetailPage";
import { AboutPage } from "./pages/AboutPage";
import { ContactPage } from "./pages/ContactPage";
import { AdminLoginPage } from "./pages/admin/AdminLoginPage";
import { AdminDashboardPage } from "./pages/admin/AdminDashboardPage";
import { AdminTreksPage } from "./pages/admin/AdminTreksPage";
import { AdminImagesPage } from "./pages/admin/AdminImagesPage";
import { AdminNoticesPage } from "./pages/admin/AdminNoticesPage";
import { AdminInquiriesPage } from "./pages/admin/AdminInquiriesPage";
import { AdminSettingsPage } from "./pages/admin/AdminSettingsPage";
import { NotFoundPage } from "./pages/NotFoundPage";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: RootLayout,
    children: [
      { index: true, Component: HomePage },
      { path: "treks", Component: TreksPage },
      { path: "treks/:id", Component: TrekDetailPage },
      { path: "about", Component: AboutPage },
      { path: "contact", Component: ContactPage },
    ],
  },
  {
    path: "/admin",
    children: [
      { index: true, Component: AdminLoginPage },
      {
        path: "dashboard",
        Component: AdminLayout,
        children: [
          { index: true, Component: AdminDashboardPage },
          { path: "treks", Component: AdminTreksPage },
          { path: "images", Component: AdminImagesPage },
          { path: "notices", Component: AdminNoticesPage },
          { path: "inquiries", Component: AdminInquiriesPage },
          { path: "settings", Component: AdminSettingsPage },
        ],
      },
    ],
  },
  {
    path: "*",
    Component: NotFoundPage,
  },
]);
