import ForgotPassword from "./ForgotPassword";

// Legacy route kept for backward compatibility with old email links.
// Reuse the hardened implementation in ForgotPassword to avoid duplicate logic.
export default function ResetPassword() {
  return <ForgotPassword />;
}
