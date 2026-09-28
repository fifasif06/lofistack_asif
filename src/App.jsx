import { useEffect } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import Layout from "./Layout.jsx";
import Gallery from "./Gallery.jsx";
import ComponentPage from "./ComponentPage.jsx";
import NotFound from "./NotFound.jsx";

// Page addresses (same as Week 1):  /  = gallery,  /components/<slug>  = one component
export default function App() {
  const { pathname } = useLocation();
  useEffect(() => window.scrollTo(0, 0), [pathname]);

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Gallery />} />
        <Route path="/components/:slug" element={<ComponentPage />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Layout>
  );
}
