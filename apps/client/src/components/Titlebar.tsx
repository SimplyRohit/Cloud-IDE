import Image from "next/image";
import vscode_icon from "../public/vscode_icon.svg";
import nookies from "nookies";
import axios from "axios";

const Titlebar = () => {
  const StopServer = async () => {
    const cookies = nookies.get();
    try {
      const response = await axios.post("http://localhost:8080/stop", {
        userId: cookies.userId,
      });

      if (response.data.status === "success") {
       console.log("stop");
        } else {
        }
    } catch (error) {
      console.error("Error checking Docker container status:", error);
    }
  };



  return (
    <section className="bg-[#181818] h-8 px-2 flex items-center justify-center text-white text-sm border-b-[1px] border-[#2B2B2B] font-sans">
      <Image
        src={vscode_icon.src}
        alt="VSCode Icon"
        height={15}
        width={15}
        className="ml-2"
      />
      <div className="flex w-full  ml-3">
        <p className="px-2 cursor-pointer">File</p>
        <p className="px-2 cursor-pointer">Edit</p>
        <p className="px-2 cursor-pointer">View</p>
        <p className="px-2 cursor-pointer">Go</p>
        <p className="px-2 cursor-pointer">Run</p>
        <p className="px-2 cursor-pointer">Terminal</p>
        <p className="px-2 cursor-pointer">Help</p>
      </div>
      <div>
        <button onClick={ StopServer}>stopserver</button>
      </div>
    </section>
  );
};

export default Titlebar;
