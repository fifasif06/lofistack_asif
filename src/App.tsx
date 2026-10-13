import { useEffect } from "react";
import { Route, Routes, useLocation } from "react-router-dom";
import Layout from "./Layout";
import Gallery from "./Gallery";
import ComponentPage from "./ComponentPage";
import NotFound from "./NotFound";

// Page addresses never change:  /  = gallery,  /components/<slug>  = one component
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
