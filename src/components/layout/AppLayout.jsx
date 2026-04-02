import React from "react";
import Sidebar from "./Sidebar";
import ChatBot from "../shared/ChatBot";

export default function AppLayout({ children }) {
  return (
    <div className="flex h-screen overflow-hidden bg-surface">
      <Sidebar />
      <main className="flex-1 flex flex-col overflow-hidden">
        {children}
      </main>
      <ChatBot />
    </div>
  );
}
