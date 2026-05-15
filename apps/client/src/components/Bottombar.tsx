import {
  ErrorIcon,
  WarningIcon,
  BellIcon,
  CheckIcon,
  NextjsIcon,
  SourceControlIcon,
} from "../icons/BottombarIcons";

import { GlobeIcon } from "lucide-react";

import { useState } from "react";

const Bottombar = ({ userID }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    const url = `http://PORT-${userID}.localhost`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <footer className="bg-[#181818] h-[25px] border-t-[1px] border-[#2B2B2B] text-[#e1e4e8] px-2 flex w-full items-center justify-between text-[0.8rem]">
      <div className="flex items-center">
        <a
          href="https://github.com/WasATrueWarriror/codeinide"
          target="_blank"
          rel="noreferrer noopener"
          className="flex items-center mr-2 h-[24px] px-1 cursor-pointer font-[Source Sans Pro] hover:bg-[var(--bottombar-hover-bg)]"
        >
          <SourceControlIcon className="mr-1" />
          <p>main</p>
        </a>
        <div className="flex items-center mr-2 h-[24px] px-1 cursor-pointer font-[Source Sans Pro] hover:bg-[var(--bottombar-hover-bg)]">
          <ErrorIcon className="mr-1" />
          <p className="mr-2">0</p>
          <WarningIcon className="mr-1" />
          <p>0</p>
        </div>
        {userID && (
          <button
            onClick={handleCopy}
            className=""
          >
            <p>{copied ? "Copied!" : "Copy Preview URL"}</p>
          </button>
        )}
      </div>
      <div className="flex items-center">
        <div className="flex items-center mr-2 h-[24px] px-1 cursor-pointer font-[Source Sans Pro] hover:bg-[var(--bottombar-hover-bg)]">
          <NextjsIcon className="mr-1" />
          <p>Powered by Next.js</p>
        </div>
        <div className="flex items-center mr-2 h-[24px] px-1 cursor-pointer font-[Source Sans Pro] hover:bg-[var(--bottombar-hover-bg)]">
          <CheckIcon className="mr-1" />
          <p>Prettier</p>
        </div>
        <div className="flex items-center mr-2 h-[24px] px-1 cursor-pointer hover:bg-[var(--bottombar-hover-bg)]">
          <BellIcon />
        </div>
      </div>
    </footer>
  );
};

export default Bottombar;
