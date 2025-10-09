import Navbar from "./Navbar";
import { useNavigate } from "react-router-dom";

export default function Home() {
  const navigate = useNavigate();
  return (
    <>
      <Navbar />
      <div className="absolute inset-0 z-0">
        <div className="relative w-full h-screen overflow-hidden">
          <video
            className="absolute top-0 left-0 w-dvw h-100 object-contain"
            src="src\assets\Background.mp4"
            autoPlay
            loop
            muted
            playsInline
          ></video>

          <div className="absolute inset-0"></div>

          {/* Foreground content */}
          <div className="relative z-10 flex justify-center items-center h-full">
            <div className="min-w-[32rem] min-h-40 p-6 bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 flex flex-col items-center">
              <h1 className="text-green-700 mb-6 text-center text-2xl font-bold">
                CarbonCred
              </h1>
              <button
                onClick={() => navigate("/Registration")}
                className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-6 rounded-lg transition-all duration-200"
              >
                Register
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
