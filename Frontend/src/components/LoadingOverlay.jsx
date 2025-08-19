import { PuffLoader } from "react-spinners";
import { useTheme } from "../context/ThemeContext";

const LoadingOverlay = ({ isLoading }) => {
  const { theme } = useTheme();

  if (!isLoading) return null;

  return (
    <div className="absolute inset-0 flex justify-center items-center bg-gray-100/30 dark:bg-gray-900/30 backdrop-filter backdrop-blur-[1px] z-50">
      <PuffLoader
        color={theme === "dark" ? "#60a5fa" : "#2563eb"}
        size={60}
        loading={true}
      />
    </div>
  );
};

export default LoadingOverlay;