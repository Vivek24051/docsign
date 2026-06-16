interface BadgeProps {
  status: "UPLOADED" | "SIGNING" | "SIGNED" | "COMPLETED";
}

const statusConfig = {
  UPLOADED: { label: "Uploaded", className: "bg-blue-100 text-blue-700" },
  SIGNING: { label: "In Progress", className: "bg-yellow-100 text-yellow-700" },
  SIGNED: { label: "Signed", className: "bg-green-100 text-green-700" },
  COMPLETED: { label: "Completed", className: "bg-emerald-100 text-emerald-700" },
};

export default function Badge({ status }: BadgeProps) {
  const config = statusConfig[status];
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${config.className}`}>
      {config.label}
    </span>
  );
}
