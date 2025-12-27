import { useAuth } from "../auth/AuthContext";

export default function Me() {
  const { user } = useAuth();

  return (
    <div style={{ padding: 20, fontFamily: "sans-serif" }}>
      <h2>/auth/me</h2>
      <pre>{JSON.stringify({ user }, null, 2)}</pre>
    </div>
  );
}
