"use client";

import React, { useEffect, useRef } from "react";
import { Terminal } from "@xterm/xterm";
import "@xterm/xterm/css/xterm.css";
import { io } from "socket.io-client";
import nookies from "nookies";
const Xterm = () => {
  const cookies = nookies.get();
  const userId = cookies.userId;
  const socket = io(`http://${userId}.localhost`);
  const terminalRef = useRef(null);
  useEffect(() => {
    if (terminalRef.current) {
      const term = new Terminal({
        cursorBlink: true,
        rows: 10,
        cols: 80,
        theme: {
          background: "#181818",
          cursor: "#f1fa8c",
        },
      });

      term.open(terminalRef.current);
      term.write(`Welcome to Code. Type 'help' for help.\r\n`);

      term.onData(async (input) => {
        try {
          await fetch(`http://${userId}.localhost/api/terminal`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ data: input }),
          });
        } catch (error) {
          console.error("Error sending data to server:", error);
        }
      });

      socket.on("terminal:data", (data) => {
        term.write(data);
      });

      return () => {
        term.dispose();
      };
    }
  }, []);

  return (
    <div
      className=" flex w-[calc(100%-0.1vw)] h-[calc(100%-0.1vh)] p-2 bg-[#181818] "
      ref={terminalRef}
    ></div>
  );
};

export default Xterm;
