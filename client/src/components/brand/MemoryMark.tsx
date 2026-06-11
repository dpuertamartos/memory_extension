type MemoryMarkProps = {
  className?: string
}

const MemoryMark = ({ className = "h-8 w-8 text-accent" }: MemoryMarkProps) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 32 32"
    fill="none"
    className={className}
    aria-hidden
  >
    <path
      d="M16 4.5c-2.2 0-4.2 1.1-5.4 2.9C9.4 6.2 8 5.5 6.3 5.5 3.9 5.5 2 7.4 2 9.8c0 1.4.7 2.7 1.8 3.5-.3.7-.5 1.5-.5 2.3 0 3.1 2.5 5.6 5.6 5.6.6 0 1.2-.1 1.7-.3.8 2.2 2.9 3.8 5.4 3.8s4.6-1.6 5.4-3.8c.5.2 1.1.3 1.7.3 3.1 0 5.6-2.5 5.6-5.6 0-.8-.2-1.6-.5-2.3 1.1-.8 1.8-2.1 1.8-3.5 0-2.4-1.9-4.3-4.3-4.3-1.7 0-3.1.7-4.3 1.9C20.2 5.6 18.2 4.5 16 4.5z"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M11 14.5c1.2 1.8 3 2.8 5 2.8s3.8-1 5-2.8"
      stroke="currentColor"
      strokeWidth="1.25"
      strokeLinecap="round"
    />
    <circle cx="12.5" cy="12" r="1" fill="currentColor" />
    <circle cx="19.5" cy="12" r="1" fill="currentColor" />
    <path
      d="M10 20.5c1.5 1.2 3.3 1.8 6 1.8s4.5-.6 6-1.8"
      stroke="currentColor"
      strokeWidth="1"
      strokeLinecap="round"
      opacity="0.45"
    />
  </svg>
)

export default MemoryMark
