import { FeatureType } from "@/types/enums"
import moment from "moment"

const calculateMedian = (values: any[], headerType: FeatureType): any => {
  let midIndex = Math.floor(values.length / 2)

  if (headerType === FeatureType.TIMESTAMP) {
    if (values.length % 2 === 0) {
      const date1 = moment.utc(values[midIndex])
      const date2 = moment.utc(values[midIndex - 1])

      if (date1.isValid() && date2.isValid()) {
        return moment
          .unix((date1.unix() + date2.unix()) / 2)
          .format("YYYY-MM-DD")
      } else {
        console.error("Invalid date format in the input array.")
        return null
      }
    } else {
      const date = moment.utc(values[midIndex])

      if (date.isValid()) {
        return date.format("YYYY-MM-DD")
      } else {
        console.error("Invalid date format in the input array.")
        return null
      }
    }
  }

  if (
    headerType == FeatureType.TEXT ||
    headerType == FeatureType.TEXT_SEQUENCE ||
    headerType == FeatureType.TEXT_SET
  ) {
    if (values.length % 2 === 0) {
      return Math.floor(
        (values[midIndex].length + values[midIndex - 1].length) / 2
      )
    } else {
      return values[midIndex].length
    }
  }

  if (FeatureType.getAllNumericalTypes().includes(headerType as string)) {
    let data = values.map(Number)
    if (Array.isArray(values[0])) {
      data = values.flatMap((val) => val).sort((a, b) => a - b)
      midIndex = Math.floor(data.length / 2)
    }
    if (data.length % 2 === 0) {
      if ((data[midIndex] + data[midIndex - 1]) / 2 < 1)
        return Number(((data[midIndex] + data[midIndex - 1]) / 2).toFixed(6))
      else return Number(((data[midIndex] + data[midIndex - 1]) / 2).toFixed(2))
    } else {
      return data[midIndex] < 1
        ? Number(data[midIndex]).toFixed(6)
        : Number(data[midIndex]).toFixed(2)
    }
  }

  return null
}

export const getBucketizedCount = (
  data: any,
  headerName: string,
  headerType: string
) => {
  if (!data.length) {
    return {
      bucketizedData: [],
      columnStats: {
        total_rows: 0,
        null_count: 0,
        min_value: "",
        max_value: "",
      },
    }
  }

  const targetFieldData = data
    .map((item) => item[headerName])
    .filter((val) => val != null)

  if (targetFieldData.length == 0) {
    return {
      bucketizedData: [],
      columnStats: {
        total_rows: 0,
        null_count: 0,
        min_value: "",
        max_value: "",
      },
    }
  }
  // Sort data by name (either timestamp or text)
  if (headerType == FeatureType.TIMESTAMP) {
    targetFieldData.sort((a, b) => {
      const timeA = moment(a).unix()
      const timeB = moment(b).unix()
      return timeA - timeB
    })
  } else if (
    headerType == FeatureType.TEXT ||
    headerType == FeatureType.TEXT_SEQUENCE ||
    headerType == FeatureType.TEXT_SET
  ) {
    targetFieldData.sort((a, b) => a.length - b.length)
  } else
    targetFieldData.sort((a, b) => {
      if (Array.isArray(a)) {
        return a[0] - b[0]
      } else return a - b
    })

  const totalRows = data.length
  const nullCount = data.length - targetFieldData.length

  const minValue = Number(
    headerType == FeatureType.TIMESTAMP
      ? moment.utc(targetFieldData[0]).unix()
      : headerType == FeatureType.TEXT ||
        headerType == FeatureType.TEXT_SEQUENCE ||
        headerType == FeatureType.TEXT_SET
      ? targetFieldData[0].length
      : Array.isArray(targetFieldData[0])
      ? targetFieldData
          .flatMap((d) => d)
          .reduce((min, val) => {
            return typeof val === "number" && !isNaN(val)
              ? Math.min(min, val)
              : min
          }, Infinity)
      : targetFieldData[0]
  )

  const maxValue = Number(
    headerType == FeatureType.TIMESTAMP
      ? moment.utc(targetFieldData[targetFieldData.length - 1]).unix()
      : headerType == FeatureType.TEXT ||
        headerType == FeatureType.TEXT_SEQUENCE ||
        headerType == FeatureType.TEXT_SET
      ? targetFieldData[targetFieldData.length - 1].length
      : Array.isArray(targetFieldData[targetFieldData.length - 1])
      ? targetFieldData
          .flatMap((d) => d)
          .filter(
            (val): val is number => typeof val === "number" && !isNaN(val)
          )
          .reduce((max, val) => Math.max(max, val), -Infinity)
      : targetFieldData[targetFieldData.length - 1]
  )

  const range: number = maxValue - minValue + 1
  const bucketCount = range < 1 ? 12 : range <= 12 ? range : 12
  const bucketSize = range / bucketCount

  const parsedData = data.map((item) => ({
    ...item,
    parsedValue:
      headerType == FeatureType.TIMESTAMP
        ? moment.utc(item[headerName]).unix()
        : headerType == FeatureType.TEXT ||
          headerType == FeatureType.TEXT_SEQUENCE ||
          headerType == FeatureType.TEXT_SET
        ? item[headerName]?.length ?? 0
        : item[headerName],
  }))

  const median = calculateMedian(targetFieldData, headerType)
  const buckets: any[] = []

  for (let i = 0; i < bucketCount; i++) {
    const isBucketRangeTypeInteger =
      (Array.isArray(targetFieldData[0])
        ? targetFieldData.flatMap((d) => d).every(Number.isInteger)
        : targetFieldData.every(Number.isInteger)) ||
      headerType == FeatureType.TEXT ||
      headerType == FeatureType.TEXT_SEQUENCE ||
      headerType == FeatureType.TEXT_SET

    const bucketStart = isBucketRangeTypeInteger
      ? Math.floor(minValue + i * bucketSize)
      : minValue + i * bucketSize

    const bucketEnd =
      i === bucketCount - 1
        ? maxValue
        : isBucketRangeTypeInteger
        ? Math.floor(minValue + (i + 1) * bucketSize) - 1
        : minValue + (i + 1) * bucketSize

    const bucketData = parsedData.filter(
      (item) =>
        item.parsedValue >= bucketStart &&
        (isBucketRangeTypeInteger
          ? item.parsedValue <=
            (i === bucketCount - 1 ? bucketEnd + 1 : bucketEnd)
          : item.parsedValue <
            (i === bucketCount - 1 ? bucketEnd + 1 : bucketEnd))
    )
    const diff = maxValue - minValue

    buckets.push({
      bucket_index: i,
      count: bucketData.length,
      bucket_start:
        headerType === FeatureType.TIMESTAMP
          ? moment.unix(bucketStart).format("YYYY-MM-DD")
          : Number(
              bucketStart.toFixed(
                diff < 1 ? 6 : diff <= 12 ? 2 : diff <= 120 ? 1 : 0
              )
            ),
      bucket_end:
        headerType === FeatureType.TIMESTAMP
          ? moment.unix(bucketEnd).format("YYYY-MM-DD")
          : Number(
              bucketEnd.toFixed(
                diff < 1 ? 6 : diff <= 12 ? 2 : diff <= 120 ? 1 : 0
              )
            ),
    })
  }

  return {
    bucketizedData: buckets,
    columnStats: {
      total_rows: totalRows,
      null_count: nullCount,
      min_value:
        minValue < 1
          ? Number(minValue.toFixed(6))
          : headerType == FeatureType.TIMESTAMP
          ? moment.unix(minValue).format("YYYY-MM-DD")
          : minValue,
      max_value:
        maxValue < 1
          ? Number(maxValue.toFixed(6))
          : headerType == FeatureType.TIMESTAMP
          ? moment.unix(maxValue).format("YYYY-MM-DD")
          : maxValue,
      median_value: median > 1 ? Math.floor(median) : median,
    },
  }
}
