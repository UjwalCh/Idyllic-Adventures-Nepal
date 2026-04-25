import { RouterProvider } from "react-router";
import { Toaster } from "sonner";
import { router } from "./routes";
import { useEffect } from "react";
import ScrollToTop from "./components/ScrollToTop";
import { ThemeProvider } from "next-themes";

export default function App() {
  return <RouterProvider router={router} />;
}