import { useState, useEffect } from "preact/hooks";

export default function MobileMenu() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const sidebar = document.getElementById("sidebar");
    const mainContent = document.getElementById("main-content");

    if (!sidebar || !mainContent) return;

    if (isOpen) {
      sidebar.classList.add("sidebar--open");
    } else {
      sidebar.classList.remove("sidebar--open");
    }

    function handleMainClick() {
      if (isOpen) {
        setIsOpen(false);
      }
    }

    mainContent.addEventListener("click", handleMainClick);
    return () => {
      mainContent.removeEventListener("click", handleMainClick);
    };
  }, [isOpen]);

  // Close sidebar on navigation (when clicking sidebar links)
  useEffect(() => {
    const sidebar = document.getElementById("sidebar");
    if (!sidebar) return;

    function handleLinkClick(e: Event) {
      const target = e.target as HTMLElement;
      if (target.closest("a")) {
        setIsOpen(false);
      }
    }

    sidebar.addEventListener("click", handleLinkClick);
    return () => {
      sidebar.removeEventListener("click", handleLinkClick);
    };
  }, []);

  return (
    <button
      class={`menu-toggle ${isOpen ? "menu-toggle--active" : ""}`}
      onClick={() => setIsOpen((prev) => !prev)}
      aria-label={isOpen ? "メニューを閉じる" : "メニューを開く"}
    >
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        {isOpen ? (
          <>
            <line x1="4" y1="4" x2="16" y2="16" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
            <line x1="16" y1="4" x2="4" y2="16" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
          </>
        ) : (
          <>
            <line x1="3" y1="5" x2="17" y2="5" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
            <line x1="3" y1="10" x2="17" y2="10" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
            <line x1="3" y1="15" x2="17" y2="15" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
          </>
        )}
      </svg>
    </button>
  );
}
