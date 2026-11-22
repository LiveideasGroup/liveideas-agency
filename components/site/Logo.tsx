/** Mark: a signal node with three links, one per niche. */
export function Logo() {
  return (
    <span className="logo">
      <svg className="logo-mark" viewBox="0 0 32 32" aria-hidden="true">
        <rect x="1" y="1" width="30" height="30" rx="8" fill="#15203a" stroke="#2d3d63" />
        <path d="M16 16 L8 9 M16 16 L24 9 M16 16 L16 25" stroke="#82b4ff" strokeWidth="2" strokeLinecap="round" />
        <circle cx="16" cy="16" r="3.6" fill="#82b4ff" />
        <circle cx="8" cy="9" r="2.2" fill="#7fd3ff" />
        <circle cx="24" cy="9" r="2.2" fill="#c3b7ff" />
        <circle cx="16" cy="25" r="2.2" fill="#7fe3b4" />
      </svg>
      LiveIdeas
    </span>
  );
}
