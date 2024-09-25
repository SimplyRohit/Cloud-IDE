// Tab.tsx
"use client";
import { X } from "lucide-react";

const Tab = ({ tab, isActive, onClick, onClose }) => {
  return (
    <div
      className={`flex justify-center  cursor-pointer items-center  w-[6rem] ${
        isActive ? "bg-[#1F1F1F]" : "bg-[#181818]"
      }  text-gray-300`}
    >
      <h1 className="font-bold truncate  text-[0.8rem] px-1 " onClick={onClick}>
        {tab.name}
      </h1>
      <X onClick={onClose} className="w-3 h-3 " />
    </div>
  );
};

export default Tab;
