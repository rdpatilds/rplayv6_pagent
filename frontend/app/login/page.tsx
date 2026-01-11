import LoginForm from "@/components/login-form"

export default function LoginPage() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="w-full max-w-md p-4">
        <LoginForm />
      </div>
    </div>
  )
}
