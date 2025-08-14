// Temporarily disabled - will enable when react-dnd is properly configured
interface DragDropProviderProps {
  children: React.ReactNode;
}

export default function DragDropProvider({ children }: DragDropProviderProps) {
  return <>{children}</>;
}
