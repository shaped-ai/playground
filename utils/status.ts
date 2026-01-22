interface ChipColors {
  textColor: string
  backgroundColor: string
  borderColor: string
}

export enum ModelStatus {
  ACTIVE = "ACTIVE",
  IDLE = "IDLE",
  SCHEDULING = "SCHEDULING",
  FETCHING = "FETCHING",
  TUNING = "TUNING",
  TRAINING = "TRAINING",
  DEPLOYING = "DEPLOYING",
  ERROR = "ERROR",
  INACTIVE = "INACTIVE",
  DESTROYING = "DESTROYING",
  BACKFILLING = "BACKFILLING",
}

const getStatusColor = (status: string): ChipColors => {
  switch (status.trim().toUpperCase()) {
    case "ACTIVE":
      return {
        textColor: "text-green-800",
        backgroundColor: "bg-green-100",
        borderColor: "border-green-300",
      }
    case "SCHEDULING":
      return {
        textColor: "text-yellow-800",
        backgroundColor: "bg-yellow-100",
        borderColor: "border-yellow-300",
      }
    case "FETCHING":
      return {
        textColor: "text-violet-800",
        backgroundColor: "bg-violet-100",
        borderColor: "border-violet-300",
      }
    case "TUNING":
      return {
        textColor: "text-blue-800",
        backgroundColor: "bg-blue-100",
        borderColor: "border-blue-300",
      }
    case "TRAINING":
      return {
        textColor: "text-blue-800",
        backgroundColor: "bg-blue-100",
        borderColor: "border-blue-300",
      }
    case "DEPLOYING":
      return {
        textColor: "text-orange-800",
        backgroundColor: "bg-orange-100",
        borderColor: "border-orange-300",
      }
    case "ERROR":
      return {
        textColor: "text-red-800",
        backgroundColor: "bg-red-100",
        borderColor: "border-red-300",
      }
    case "INACTIVE":
      return {
        textColor: "text-slate-800",
        backgroundColor: "bg-slate-100",
        borderColor: "border-slate-300",
      }
    case "BACKFILLING":
      return {
        textColor: "text-blue-800",
        backgroundColor: "bg-blue-100",
        borderColor: "border-blue-300",
      }
    default:
      return {
        textColor: "text-slate-800",
        backgroundColor: "bg-gray-100",
        borderColor: "border-gray-300",
      }
  }
}

export default getStatusColor
