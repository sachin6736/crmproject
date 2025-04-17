import Spinner from "./Spinner";

const FullPageLoader = () => {
    return (
      <div className="flex items-center justify-center w-full h-screen bg-white">
        <Spinner size="w-10 h-10" color="text-blue-600" fill="fill-blue-300" />
      </div>
    );
  };
  
  export default FullPageLoader;