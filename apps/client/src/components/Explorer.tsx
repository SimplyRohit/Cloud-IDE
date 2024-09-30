"use client";
import { useState, useEffect } from "react";
import { ChevronRight, FolderOpen, FolderClosed, FileIcon } from "lucide-react";
import axios from "axios";
import { io } from "socket.io-client";

import {
  FolderNodeIcon,
  FolderNodeIconOpen,
  FolderNextIcon,
  FolderNextIconOpen,
} from "../icons/ExplorerFolderIcons";
import { GitIcon, ReacttsIcon } from "../icons/ExplorerFileIcons";

const Explorer = ({ onFileSelect  , ...props } : any ) => {
  console.log("Explorer", props.port);
  const socket = io(`http://${props.port}.localhost`);
  const [fileTree, setFileTree] = useState({});
  const [openDirectories, setOpenDirectories] = useState(new Map());

  useEffect(() => {
    socket.on("file-change", fetchFileTree);
    return () => {
      socket.off("file-change", fetchFileTree);
    };
  }, []);

  useEffect(() => {
    fetchFileTree();
  }, []);

  const fetchFileTree = async () => {
    try {
      const response = await axios.get(`http://${props.port}.localhost/files`);
      setFileTree(response.data);
    } catch (error) {
      console.error("Error fetching file tree:", error);
    }
  };

  const toggleDirectory = (path) => {
    setOpenDirectories((prev) => {
      const newMap = new Map(prev);
      const currentState = newMap.get(path) || false;
      newMap.set(path, !currentState);
      return newMap;
    });
  };

  const handleFileClick = (path) => {
    onFileSelect(path);
  };

  const getFolderIcon = (folderName, isOpen) => {
    if (folderName === "node_modules") {
      return isOpen ? (
        <FolderNodeIconOpen className="mr-2 w-4" />
      ) : (
        <FolderNodeIcon className="mr-2 w-4" />
      );
    } else if (folderName === "next") {
      return isOpen ? (
        <FolderNextIconOpen className="mr-2 w-4" />
      ) : (
        <FolderNextIcon className="mr-2 w-4" />
      );
    } else {
      return isOpen ? (
        <FolderOpen className="mr-2 w-4" />
      ) : (
        <FolderClosed className="mr-2 w-4" />
      );
    }
  };

  const getFileIcon = (fileName) => {
    if (fileName.endsWith(".tsx")) {
      return <ReacttsIcon className="mr-2 w-4" />;
    } else if (fileName.endsWith(".gitignore")) {
      return <GitIcon className="mr-2 w-4" />;
    } else {
      return <FileIcon className="mr-2 w-4" />;
    }
  };

  const renderTree = (node, path = "") => {
    const directories = [];
    const files = [];

    Object.entries(node).forEach(([key, value]) => {
      const isDirectory =
        value && typeof value === "object" && !Array.isArray(value);
      if (isDirectory) {
        directories.push([key, value]);
      } else {
        files.push(key);
      }
    });

    directories.sort(([a], [b]) => a.localeCompare(b));
    files.sort((a, b) => a.localeCompare(b));

    return (
      <div key={path} className="pl-4">
        {directories.map(([key, value]) => {
          const isOpen = openDirectories.get(path + key) || false;

          return (
            <div key={path + key}>
              <div
                className="flex items-center cursor-pointer"
                onClick={() => toggleDirectory(path + key)}
              >
                {getFolderIcon(key, isOpen)}
                <span>{key}</span>
                <ChevronRight
                  className={`transition-transform duration-200 w-3 ${isOpen ? "rotate-90" : ""}`}
                  style={{ marginLeft: "auto " }}
                />
              </div>
              {isOpen && renderTree(value, path + key + "/")}
            </div>
          );
        })}

        {files.map((file) => (
          <div
            key={path + file}
            className="flex items-center cursor-pointer pl-2"
          >
            {getFileIcon(file)}
            <span onClick={() => handleFileClick(path + file)}>{file}</span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="bg-[#181818] h-full w-full text-[#e1e4e8] font-['Source Sans Pro'] border-x-[1px] border-[#2B2B2B]">
      <p className="p-2 font-light uppercase text-[0.9rem] tracking-widest mb-3">
        Explorer
      </p>
      <div>
        <h1 className="uppercase font-bold text-[0.8rem] tracking-widest flex items-center cursor-pointer ml-2 pb-1 px-2">
          User
        </h1>
        <div className={`px-2 py-1 h-[calc(100vh-10rem)] overflow-y-auto`}>
          {renderTree(fileTree)}
        </div>
      </div>
    </div>
  );
};

export default Explorer;
