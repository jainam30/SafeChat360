import React from "react";
import Dashboard from "./pages/Dashboard";
import ImageModeration from "./pages/ImageModeration";

function App() {
  return (
    <div className="p-4">
      <Dashboard />
      <hr className="my-6" />
      <ImageModeration />
    </div>
  );
}

export default App;
