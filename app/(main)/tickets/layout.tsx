// The @peek slot holds the ticket panel that opens over the board or the list (ticket-peek.tsx). A fragment, so the
// pages keep the main area's own spacing.

export default function TicketsLayout({ children, peek }: LayoutProps<"/tickets">) {
  return (
    <>
      {children}
      {peek}
    </>
  );
}
