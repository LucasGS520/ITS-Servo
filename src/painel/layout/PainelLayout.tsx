import { Outlet } from "react-router-dom";

const PainelLayout = () => {
  return (
    <div className="flex min-h-screen flex-col bg-muted/30">
      <Outlet />
    </div>
  );
};

export default PainelLayout;
