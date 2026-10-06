import { AuthForm } from '../auth-form';

export default function LoginPage({ searchParams }: { searchParams?: { error?: string } }) {
  return <AuthForm mode="login" oauthError={searchParams?.error} />;
}
