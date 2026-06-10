import logoApp from "../assets/images/logo-saas-transparent.png"

type LogoAppProps = {
  compact?: boolean
}

const LogoApp = ({ compact = false }: LogoAppProps) => {
  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <img src={logoApp} alt="Local Brain logo" className="h-8 w-8" />
        <span className="text-sm font-semibold">Local Brain</span>
      </div>
    )
  }

  return (
    <div>
      <div className="mt-4 flex justify-center">
        <img src={logoApp} alt="Local Brain logo" className="w-24" />
      </div>
      <div className="mt-2 flex justify-center">
        <b className="text-sm">Local Brain</b>
      </div>
    </div>
  )
}

export default LogoApp
