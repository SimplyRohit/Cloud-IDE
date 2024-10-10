import React, { useEffect } from "react";
import { v4 as uuidv4 } from "uuid";
import Image from "next/image";
import vscode_icon from "../public/vscode_icon.svg";
import nookies from "nookies";
import axios from "axios";
import { CircleStopIcon, CirclePlayIcon } from "lucide-react";

const Titlebar = () => {
  const [status, setStatus] = React.useState("checking");
  useEffect(() => {
    const cookies = nookies.get();
    if (!cookies.userId) {
      const userId = uuidv4();
      nookies.set(null, "userId", userId, {
        maxAge: 30 * 24 * 60 * 60,
        path: "/",
      });
    }
    serverRunning();
  }, []);
  const serverRunning = async () => {
    const cookies = nookies.get();
    try {
      const response = await axios.post("http://localhost:8080/running", {
        userId: cookies.userId,
      });

      if (response.data.running) {
        setStatus("running");
        console.log("running", response.data);
      } else {
        console.log("running", response.data);
        setStatus("stopped");
      }
    } catch (error) {
      console.error("Error checking Docker container status:", error);
    }
  };
  const StopServer = async () => {
    const cookies = nookies.get();
    try {
      const response = await axios.post("http://localhost:8080/stop", {
        userId: cookies.userId,
      });

      if (response.data.status === "success") {
        setStatus("stopping");
        setTimeout(() => {
          setStatus("stopped");
        }, 2000);
        console.log("stop");
      } else {
      }
    } catch (error) {
      console.error("Error checking Docker container status:", error);
    }
  };
  const startServer = async () => {
    const cookies = nookies.get();
    try {
      const response = await axios.post("http://localhost:8080/start", {
        userId: cookies.userId,
      });
      if (response.data.status === "success") {
        setStatus("starting");
        setTimeout(() => {
          setStatus("running");
        }, 2000);
        console.log("start");
      } else {
      }
    } catch (error) {
      console.error("Error checking Docker container status:", error);
    }
  };
  return (
    <section className="bg-[#181818] w-full  h-8 px-2 flex items-center justify-center text-white text-sm border-b-[1px] border-[#2B2B2B] font-sans">
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
      <div className="items-center justify-center flex flex-row ">
        <h1 className="truncate pr-1"> STATUS </h1>
        <p className="truncate text-yellow-400 ">{status}</p>
        <button
          className="p-2"
          onClick={status === "stopped" ? startServer : null}
        >
          <CirclePlayIcon className="w-4 h-4  text-green-400" />
        </button>
        <button onClick={status === "running" ? StopServer : null}>
          <CircleStopIcon className="w-4 h-4 text-red-400" />
        </button>
      </div>
    </section>
  );
};

export default Titlebar;
