import React, { memo, useMemo } from "react"
import { Bar, BarChart, ResponsiveContainer } from "recharts"

import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"

const chartConfig = {
  count: {
    label: "Count",
    color: "#D96DFD",
  },
} as ChartConfig

interface DataCatalogBarChartProps {
  width: number
  height: number
  showToolTip?: boolean
  chartData: any[]
}

const DataCatalogBarChart: React.FC<DataCatalogBarChartProps> = memo(
  ({ width, height, showToolTip = true, chartData }) => {
    const containerStyle = useMemo(
      () => ({
        width: `${width}px`,
        height: `${height}px`,
        transition: "width 0.5s ease, height 0.5s ease",
      }),
      [width, height]
    )

    const memoizedChartData = useMemo(() => chartData, [])

    const labelFormatter = (label: string, [barData]: readonly any[]) => {
      const rangeStart = barData.payload.bucket_start
      const rangeEnd = barData.payload.bucket_end
      return [`${rangeStart} - ${rangeEnd}`]
    }

    const tooltipFormatter = (value: number, name: string, props: any) => {
      console.log("payload", props)
      const barColor = props?.fill || "#000"

      return [
        <span
          style={{
            display: "inline-block",
            padding: "2px 6px",
            backgroundColor: barColor,
            color: "#fff", // Ensure text is readable
            borderRadius: "4px",
            fontWeight: "bold",
            fontSize: "0.9rem",
          }}
        >
          {value}
        </span>,
        "Count",
      ]
    }

    return (
      <ChartContainer config={chartConfig} style={containerStyle}>
        <BarChart data={memoizedChartData}>
          {showToolTip && (
            <ChartTooltip
              content={
                <ChartTooltipContent
                  color="#8559E0"
                  className="border-border bg-background-primary text-xs text-foreground"
                />
              }
              labelFormatter={(label, payload) => {
                return labelFormatter(label, payload)
              }}
            />
          )}
          <Bar
            dataKey="count"
            fill="#D96DFD"
            radius={[2, 2, 0, 0]}
            isAnimationActive={false}
            style={{ cursor: "pointer" }}
            activeBar={{ fill: "#8559E0" }}
          />
        </BarChart>
      </ChartContainer>
    )
  }
)

DataCatalogBarChart.displayName = "DataCatalogBarChart"

export default DataCatalogBarChart
