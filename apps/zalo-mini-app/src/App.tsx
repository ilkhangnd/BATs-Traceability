import React, { useEffect, useState } from "react";
import { attachConnectivitySync, BatsZaloSession } from "./zalo-session.js";
import { filterQueuedHarvestsByActor, readQueuedHarvests } from "./offline-queue.js";
import { API_BASE_URL } from "./config.js";
import { HomePage } from "./pages/HomePage.js";
import { HarvestPage } from "./pages/HarvestPage.js";
import { QueuePage } from "./pages/QueuePage.js";
import { HistoryPage } from "./pages/HistoryPage.js";
import { ProfilePage } from "./pages/ProfilePage.js";
import { LoginPage } from "./pages/LoginPage.js";
import { CollectorPage } from "./pages/CollectorPage.js";
import { Sprout, Layers, History, User, Wifi, WifiOff, LayoutGrid, PackageCheck } from "lucide-react";

export type TabType = "home" | "harvest" | "queue" | "history" | "profile";

export const App: React.FC = () => {
  const [session, setSession] = useState<BatsZaloSession | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>("home");
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine ?? true);
  const [queueCount, setQueueCount] = useState<number>(0);
  const isCollector = session?.actor.role === "COLLECTOR";
  const actorId = session?.actor.id;

  const checkQueueCount = async () => {
    try {
      const all = await readQueuedHarvests();
      setQueueCount(filterQueuedHarvestsByActor(all, actorId).length);
    } catch {
      setQueueCount(0);
    }
  };

  useEffect(() => {
    try {
      window.localStorage.removeItem("bats_user_session");
    } catch {
      // Stay in guest mode when local storage is unavailable.
    } finally {
      setSession(null);
      setAuthChecked(true);
    }
  }, []);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      void checkQueueCount();
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    void checkQueueCount();

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [actorId]);

  useEffect(() => {
    if (!session) {
      setQueueCount(0);
      return;
    }
    const cleanupSync = attachConnectivitySync(API_BASE_URL);
    void checkQueueCount();
    return cleanupSync;
  }, [session]);

  if (!authChecked) {
    return (
      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "var(--farm-bg)", color: "#155d3b", fontSize: "13px", fontWeight: 800 }}>
        Đang mở sổ tay BATS...
      </div>
    );
  }

  if (!session) {
    return (
      <div style={{ width: "100%", height: "100%", backgroundColor: "#f8fafc", overflow: "hidden" }}>
        <LoginPage
          onLoginSuccess={(newSession) => {
            setSession(newSession);
            setActiveTab("home");
            void checkQueueCount();
          }}
        />
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", width: "100%", height: "100%", backgroundColor: "var(--farm-bg)", overflow: "hidden", textAlign: "left", position: "relative" }}>
      {/* Header Bar */}
      <div
        style={{
          background: "linear-gradient(135deg, #155d3b 0%, #0c3e29 100%)",
          color: "#fff",
          padding: "10px var(--sp-lg)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          boxShadow: "0 4px 12px rgba(21, 93, 59, 0.28)",
          zIndex: 50,
          flexShrink: 0
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer", minWidth: 0, flex: 1 }} onClick={() => setActiveTab("home")}>
          <div style={{ backgroundColor: "#ffffff", width: "34px", height: "34px", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 2px 6px rgba(0,0,0,0.12)", padding: "3px", flexShrink: 0 }}>
            <img src="./bats-logo.png" alt="BATS" style={{ width: "27px", height: "27px", objectFit: "contain" }} onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }} />
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: "10px", fontWeight: 800, letterSpacing: "0.4px", textTransform: "uppercase", color: "#d9f683", lineHeight: "1.15", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>BATS-AgriGuard</div>
            <div style={{ fontSize: "15px", fontWeight: 800, letterSpacing: 0, color: "#ffffff", lineHeight: "1.2", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>Ghi nhận sự kiện truy xuất</div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "12px", fontWeight: 800, backgroundColor: isOnline ? "rgba(203, 237, 113, 0.22)" : "rgba(228, 167, 52, 0.85)", color: isOnline ? "#d9f683" : "#ffffff", padding: "6px 10px", borderRadius: "20px", flexShrink: 0, marginLeft: "10px", lineHeight: 1 }}>
          {isOnline ? <Wifi size={13} color="#cbed71" /> : <WifiOff size={13} color="#ffffff" />}
          <span>{isOnline ? "Online" : "Mất mạng"}</span>
        </div>
      </div>

      {/* Main Content Area — scrolls independently above the fixed tab bar */}
      <div
        className="scroll-area"
        style={{
          flex: 1,
          minHeight: 0,
          overflowX: "hidden",
          overflowY: "auto",
          position: "relative",
          paddingBottom: "calc(var(--tabbar-h) + max(12px, env(safe-area-inset-bottom, 12px)))"
        }}
      >
        {activeTab === "home" && (
          <HomePage
            session={session}
            isOnline={isOnline}
            queueCount={queueCount}
            onNavigateTab={(tab) => {
              setActiveTab(tab);
              if (tab === "queue") void checkQueueCount();
            }}
          />
        )}
        {activeTab === "harvest" && (
          isCollector ? (
            <CollectorPage
              session={session}
              isOnline={isOnline}
              onSubmitted={() => {
                void checkQueueCount();
              }}
              onViewHistory={() => setActiveTab("history")}
            />
          ) : (
            <HarvestPage
              session={session}
              isOnline={isOnline}
              onSubmitted={() => {
                void checkQueueCount();
              }}
              onViewHistory={() => setActiveTab("history")}
            />
          )
        )}
        {activeTab === "queue" && (
          <QueuePage
            session={session}
            isOnline={isOnline}
            onSyncCompleted={() => {
              void checkQueueCount();
            }}
          />
        )}
        {activeTab === "history" && <HistoryPage session={session} />}
        {activeTab === "profile" && (
          <ProfilePage
            session={session}
            onUpdateSession={(updated) => setSession(updated)}
          />
        )}
      </div>

      {/* Bottom Tab Bar — fixed taskboard, independent from page height */}
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          height: "calc(var(--tabbar-h) + max(8px, env(safe-area-inset-bottom, 8px)))",
          paddingTop: "6px",
          paddingBottom: "max(8px, env(safe-area-inset-bottom, 8px))",
          backgroundColor: "#ffffff",
          borderTop: "1px solid #dfe3da",
          display: "flex",
          justifyContent: "space-around",
          alignItems: "center",
          boxShadow: "0 -2px 10px rgba(0, 0, 0, 0.06)",
          zIndex: 100,
          flexShrink: 0
        }}
      >
        {([
          { id: "home" as TabType, icon: <LayoutGrid size={20} />, label: "Tổng quan" },
          { id: "harvest" as TabType, icon: isCollector ? <PackageCheck size={20} /> : <Sprout size={20} />, label: isCollector ? "Bàn giao" : "Thu hoạch" },
          { id: "queue" as TabType, icon: <Layers size={20} />, label: "Hàng chờ", badge: queueCount },
          { id: "history" as TabType, icon: <History size={20} />, label: "Lịch sử" },
          { id: "profile" as TabType, icon: <User size={20} />, label: "Hồ sơ" },
        ]).map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => {
              setActiveTab(tab.id);
              if (tab.id === "queue") void checkQueueCount();
            }}
            style={{
              background: "transparent",
              border: "none",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "2px",
              color: activeTab === tab.id ? "#155d3b" : "#667069",
              fontSize: "11px",
              fontWeight: activeTab === tab.id ? 800 : 600,
              cursor: "pointer",
              flex: 1,
              height: "100%",
              padding: "5px 2px 3px",
              position: "relative",
              minHeight: "44px",
              minWidth: 0,
              justifyContent: "center",
              lineHeight: 1.15
            }}
          >
            <div style={{ position: "relative" }}>
              {tab.icon}
              {(tab.badge ?? 0) > 0 && (
                <span style={{
                  position: "absolute", top: "-5px", right: "-9px",
                  backgroundColor: "#ef4444", color: "#fff",
                  fontSize: "9px", fontWeight: 800,
                  width: "16px", height: "16px", borderRadius: "50%",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  boxShadow: "0 1px 3px rgba(239, 68, 68, 0.4)"
                }}>
                  {tab.badge}
                </span>
              )}
            </div>
            <span style={{ display: "block", width: "100%", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", textAlign: "center", fontSize: "inherit", lineHeight: 1.15 }}>{tab.label}</span>
            {activeTab === tab.id && (
              <div style={{ width: "20px", height: "3px", borderRadius: "2px", backgroundColor: "#155d3b", marginTop: "1px" }} />
            )}
          </button>
        ))}
      </div>
    </div>
  );
};
