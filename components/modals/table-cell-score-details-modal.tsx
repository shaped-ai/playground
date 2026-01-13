import { HTMLAttributes } from "react"
import { cn, formatNumber } from "@/lib/utils"
import { DiamondPlus } from "lucide-react"

interface TableCellScoreDetailsModalProps
  extends HTMLAttributes<HTMLDivElement> {
  colIdx: number
  index: number
  scores?: { model: string; value: number }[]
  retrieverScores?: { retriever: string; value: number }[]
  handleShowRankConfig?: (event: any) => void
  setShowScoreDetails: React.Dispatch<React.SetStateAction<boolean>>
  setHoveredCell: React.Dispatch<
    React.SetStateAction<{
      rowNum: number
      colNum: number
    }>
  >
}

export const TableCellScoreDetailsModal = ({
  colIdx,
  index,
  scores,
  retrieverScores,
  handleShowRankConfig,
  setShowScoreDetails,
  setHoveredCell,
}: TableCellScoreDetailsModalProps) => {
  return (
    <div
      onMouseEnter={() => {
        setShowScoreDetails(true)
        setHoveredCell({
          colNum: colIdx + 1,
          rowNum: index + 2,
        })
      }}
      onMouseLeave={() => {
        setShowScoreDetails(false)
        setHoveredCell({
          colNum: -1,
          rowNum: -1,
        })
      }}
      className={cn(
        "absolute right-0 top-[60%] z-[9999] max-h-[80vh] min-h-fit w-[325px] space-y-2 rounded-lg border border-[#E5E7EB] bg-[#FAFAFA] p-2 shadow-lg"
      )}
    >
      <p className="w-full text-center text-xs font-medium text-[#191919]">
        This score is a result of the following{" "}
        {scores && scores.length > 0 ? "model" : "retriever"} scores.
      </p>

      {scores && scores.length > 0 && (
        <div className="flex w-full items-center justify-between gap-6 border-y border-[#9A9A974D] py-2 font-mono text-xs text-[#191919]">
          <div className="flex max-w-[70%] flex-col gap-y-1">
            {scores.map((modelScoreDetails, key) => (
              <span key={key} className="w-full truncate">
                {modelScoreDetails.model}
              </span>
            ))}
          </div>
          <div className="flex flex-col gap-y-1">
            {scores.map((modelScoreDetails, key) => (
              <p key={key}>
                <span className="flex-1">
                  {formatNumber(modelScoreDetails.value, 3)}
                </span>
              </p>
            ))}
          </div>
        </div>
      )}

      {retrieverScores && retrieverScores.length > 0 && (
        <div className="flex w-full items-center justify-between gap-6 border-y border-[#9A9A974D] py-2 font-mono text-xs text-[#191919]">
          <div className="flex max-w-[70%] flex-col gap-y-1">
            {retrieverScores.map((modelScoreDetails, key) => (
              <span key={key} className="w-full truncate">
                {modelScoreDetails.retriever}
              </span>
            ))}
          </div>
          <div className="flex flex-col gap-y-1">
            {retrieverScores.map((modelScoreDetails, key) => (
              <p key={key}>
                <span className="flex-1">
                  {formatNumber(modelScoreDetails.value, 3)}
                </span>
              </p>
            ))}
          </div>
        </div>
      )}
      <button
        onClick={handleShowRankConfig}
        className="flex w-full items-center justify-center gap-1"
      >
        <DiamondPlus className="size-4 text-[#8559E0]" strokeWidth={1.25} />
        <span className="text-xs font-medium text-[#191919]">View Config</span>
      </button>
    </div>
  )
}
