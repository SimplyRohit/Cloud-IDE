"use client";
import React, { useState, useEffect } from "react";
import MonacoEditor from "../components/Editor";
import Tabsbar from "../components/Tabsbar";
import Explorer from "../components/Explorer";
import Xterm from "../components/Xterm";
import Titlebar from "../components/Titlebar";
import Sidebar from "../components/Sidebar";
import Bottombar from "../components/Bottombar";
import axios from "axios";
import { Allotment } from "allotment";
import nookies from "nookies";
import { v4 as uuidv4 } from "uuid";
import "allotment/dist/style.css";
const HomePage = () => {
  const [tabs, setTabs] = useState([]);
  const [activeFilePath, setActiveFilePath] = useState("");
  const [fileContent, setFileContent] = useState("");
  const [isExplorerOpen, setIsExplorerOpen] = useState(true);
  const [isXtermOpen, setIsXtermOpen] = useState(true);
  const [isDockerRunning, setIsDockerRunning] = useState(false);

  useEffect(() => {
    const cookies = nookies.get();

    if (!cookies.userId) {
      const userId = uuidv4();
      nookies.set(null, "userId", userId, {
        maxAge: 30 * 24 * 60 * 60,
        path: "/",
      });
    }

    checkDockerContainerRunning();
  }, []);
  // useEffect(() => {
  //   const interval = setInterval(() => {
  //     checkDockerContainerRunning();
  //   }, 5000);
  //   return () => clearInterval(interval);
  // }, []);
  const checkDockerContainerRunning = async () => {
    const cookies = nookies.get();
    try {
      const response = await axios.post("/api/docker/running", {
        userId: cookies.userId,
      });

      if (response.data.running) {
        console.log("Docker container is already running.");
        setIsDockerRunning(true);
      } else {
        console.log("Docker container is not running.");
        setIsDockerRunning(false);
      }
    } catch (error) {
      console.error("Error checking Docker container status:", error);
    }
  };

  const startDockerContainer = async () => {
    const cookies = nookies.get();
    try {
      const response = await axios.post("/api/docker/start", {
        userId: cookies.userId,
      });
      if (response.data.message === "Docker container started") {
        setIsDockerRunning(true);
      }
    } catch (error) {
      console.error("Error starting Docker container:", error);
    }
  };

  useEffect(() => {
    if (activeFilePath) {
      fetchFileContent(activeFilePath);
    }
  }, [activeFilePath]);

  const fetchFileContent = async (filePath: string) => {
    try {
      const response = await axios.get(
        `http://localhost:9000/files/${encodeURIComponent(filePath)}`
      );
      setFileContent(response.data);
    } catch (error) {
      console.error("Error fetching file content:", error);
    }
  };

  const handleFileSelect = (filePath: string) => {
    if (!tabs.find((tab) => tab.path === filePath)) {
      setTabs((prevTabs) => [
        ...prevTabs,
        { path: filePath, name: filePath.split("/").pop() },
      ]);
    }
    setActiveFilePath(filePath);
  };

  const handleTabClick = (filePath: string) => {
    setActiveFilePath(filePath);
  };

  const handleTabClose = (filePath: string) => {
    setTabs((prevTabs) => prevTabs.filter((tab) => tab.path !== filePath));
    if (filePath === activeFilePath) {
      setFileContent("");
      setActiveFilePath("");
    }
  };

  const handleSave = async () => {
    if (activeFilePath && fileContent) {
      try {
        await axios.post(
          `http://localhost:9000/files/${encodeURIComponent(activeFilePath)}`,
          {
            content: fileContent,
          }
        );
        console.log("File saved successfully!");
      } catch (error) {
        console.error("Error saving file:", error);
      }
    }
  };

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.ctrlKey && event.key === "s") {
        event.preventDefault();
        handleSave();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [fileContent, activeFilePath]);

  return (
    <div className="flex w-screen h-screen  flex-col ">
      <Titlebar />
      <div className="flex w-full h-full flex-row">
        <div className="flex ">
          <Sidebar
            isExplorerOpen={isExplorerOpen}
            setIsExplorerOpen={setIsExplorerOpen}
            isXtermOpen={isXtermOpen}
            setIsXtermOpen={setIsXtermOpen}
          />
        </div>
        <div className="flex  w-full h-full flex-row">
          <Allotment>
            {isExplorerOpen && (
              <Allotment.Pane
                className="flex w-[20%]  h-full "
                preferredSize="20%"
              >
                <Explorer onFileSelect={handleFileSelect} />
              </Allotment.Pane>
            )}
            <div className="flex w-full h-full flex-col">
              <div className="flex w-full ">
                <Tabsbar
                  tabs={tabs}
                  activeTab={activeFilePath}
                  onTabClick={handleTabClick}
                  onTabClose={handleTabClose}
                />
              </div>
              {activeFilePath && (
                <span className="text-white ml-2 text-[15px] pb-1">
                  User {">"} {activeFilePath.split("/").join(" > ")}
                </span>
              )}
              <Allotment vertical>
                {isDockerRunning ? (
                  <div className="flex h-full">
                    <MonacoEditor
                      value={fileContent}
                      language="javascript"
                      onChange={(newValue) => setFileContent(newValue)}
                    />
                  </div>
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-white">
                    <span className="flex flex-row">
                      <h1>
                        Server 1 status ={" "}
                        {isDockerRunning ? "Running" : "Stopped"}
                      </h1>
                      <button className="ml-10" onClick={startDockerContainer}>
                        Start
                      </button>
                    </span>
                  </div>
                )}
                {isXtermOpen && (
                  <Allotment.Pane className="flex h-full" preferredSize="20%">
                    <Xterm />
                  </Allotment.Pane>
                )}
              </Allotment>
            </div>
          </Allotment>
        </div>
      </div>
      <div className="flex">
        <Bottombar />
      </div>
      {/* {isLogin && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <Auth />
        </div>
      )} */}
    </div>
  );
};

export default HomePage;
