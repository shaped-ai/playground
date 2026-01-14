import { ModelDetails } from "@/types"
import {
  EntityType,
  FeatureType,
  ItemRecommendationTab,
  QueryTab,
  UserRecommendationTab,
} from "@/types/enums"

export const quantitativeDataTypes = [FeatureType.NUMERICAL]

export const getRankResult = (data: any, useItemFeature = true) => {
  const { ids, scores, metadata } = data
  const rankResults = [] as any
  for (let i = 0; i < ids.length; i++) {
    const userRank = {
      [`${useItemFeature ? "item" : "user"}_id`]: ids[i],
      score: scores?.[i],
    }
    if (metadata?.length) {
      for (const key in metadata[i]) userRank[key] = metadata[i][key]
    }

    rankResults.push(userRank)
  }
  return rankResults
}

export const getRankScoreExplanation = (data: any) => {
  const scores = data?.explanation?.score?.scoring_policy_scores
  return Object.entries(scores ?? {})
    .filter(([Key, value]) => Array.isArray(value))
    .reduce((acc: Record<string, any>, [key, value]) => {
      acc[key] = value
      return acc
    }, {})
}

export const getFeatureWithMostCategories = (
  itemFeatureFilterValues: any[],
  data: any[]
) => {
  const categoricalFeatures = itemFeatureFilterValues.filter((e) =>
    e.type.includes("Category")
  )

  let maxCount = 0,
    defaultFeature: string | undefined
  for (const { name, type } of categoricalFeatures) {
    const unique = new Set<string>()
    for (let i = 0; i < data.length; i++) {
      const element = data[i]
      if (name in element) {
        if (type == "Sequence[Category]" || type == "Sequence[TextCategory]") {
          for (const value of element[name]) {
            unique.add(value)
          }
        } else {
          unique.add(element[name])
        }
      }
    }

    if (unique.size > maxCount) {
      maxCount = unique.size
      defaultFeature = name
    }
  }

  return defaultFeature
}

export const getFeatureFilters = (
  chartType: string,
  featureFilterValues: { name: string; type: string }[]
) => {
  let transformedData: Record<string, { name: string; type: string }[]> = {}

  if (chartType === "EventsSummary") {
    transformedData = {
      Category: [{ name: "events_label", type: "Category" }],
    }
  }

  featureFilterValues.forEach((item) => {
    const { name, type } = item

    if (!transformedData[type]) {
      transformedData[type] = []
    }

    transformedData[type].push({ name, type })
  })

  return transformedData
}

const isImageType = async (url: string) => {
  const safeUrl = encodeURIComponent(url)
  const fileExtension = url.split(".").pop()?.toLowerCase()
  const validImageExtensions = [
    "jpg",
    "jpeg",
    "png",
    "gif",
    "bmp",
    "webp",
    "svg",
  ]
  console.log("immmmage", url, fileExtension)
  if (validImageExtensions.includes(fileExtension!)) return true

  return fetch(`/api/models/recommendation/url-content-type?url=${safeUrl}`)
    .then((response) => {
      if (
        response.ok &&
        response.headers.get("content-type")?.startsWith("image/")
      ) {
        console.log("It's a downloadable image URL.")
        return true
      } else {
        console.log("It's not an image URL.")
        return false
      }
    })
    .catch((error) => {
      console.error("Error:", error.message)
      return false
    })
}

export const calculateRankFeatures = async (
  results: any[],
  modelDetails: ModelDetails,
  useItemFeature: boolean = true
) => {
  console.log(
    "Use item feature in calculate image/non-image features",
    useItemFeature
  )
  const features: { name: string; type: string }[] = []
  const imageFeatures: { name: string; type: string }[] = []
  const itemFeatures = modelDetails.model_schema?.item
  const userFeatures = modelDetails.model_schema?.user
  const allFeatures = useItemFeature ? itemFeatures : userFeatures
  for (const feature of allFeatures) {
    if (feature.type == "Url") {
      const nonEmptyUrlItem = results.find((r) => r[feature.name])
      const isImage = await isImageType(nonEmptyUrlItem[feature.name])
      console.log("Is url type inferred as image", isImage, feature)
      if (nonEmptyUrlItem && isImage) {
        imageFeatures.push(feature)
      } else features.push(feature)
    } else if (feature.type == "Image") {
      imageFeatures.push(feature)
    } else features.push(feature)
  }

  return [features, imageFeatures]
}

export const getRankAPIConfigFromConfig = (
  configuration: any,
  currentQueryTab: QueryTab,
  currentRankTab: UserRecommendationTab | ItemRecommendationTab,
  modelDetails: ModelDetails,
  queryStep: number
) => {
  const policyType =
    modelDetails.config.model.policy_configs?.scoring_policy?.policy_type

  let finalConfiguration: Record<string, any> = {
    ignore_paginations: true,
    return_metadata: true,
    limit: 50,
    config: {
      ...configuration.config,
    },
  }

  if (queryStep == 2 || policyType == "score-ensemble") {
    let valueModel
    if (queryStep == 2) {
      valueModel = configuration.config?.value_model
    } else if (currentRankTab == UserRecommendationTab.RANK) {
      valueModel = configuration.config?.value_model
    }

    if (valueModel) finalConfiguration.config.value_model = valueModel
  }

  if (currentQueryTab == QueryTab.SESSION)
    finalConfiguration.config.filter_interaction_iids = true

  if (queryStep == 2) {
    if (currentQueryTab == QueryTab.ITEM) {
      finalConfiguration.explain = true
      finalConfiguration.text_query = configuration.text_query
      if (configuration.filter_predicate) {
        finalConfiguration.filter_predicate = configuration.filter_predicate
      }
      if (configuration.user_id) {
        finalConfiguration.user_id = configuration.user_id
      } else {
        delete finalConfiguration.ignore_paginations
        delete finalConfiguration.limit
        finalConfiguration.config.limit = 50
      }
    } else {
      finalConfiguration.search = configuration.text_query
      if (configuration.filter_predicate) {
        finalConfiguration.filter_predicate = configuration.filter_predicate
      }
      delete finalConfiguration.limit
      finalConfiguration.config.limit = 50
      if (!("text_semantic_search_weight" in finalConfiguration.config))
        finalConfiguration.config.text_semantic_search_weight = 0.7
    }
  } else if (queryStep == 3) {
    if (
      (currentQueryTab == QueryTab.USER ||
        currentQueryTab == QueryTab.SESSION) &&
      currentRankTab == UserRecommendationTab.RANK
    ) {
      finalConfiguration.explain = true
      if (configuration.user_id) {
        finalConfiguration.user_id = configuration.user_id
      }
      if (configuration.interactions?.length) {
        finalConfiguration.interactions = configuration.interactions
      }
      if (configuration.filter_predicate) {
        finalConfiguration.filter_predicate = configuration.filter_predicate
      }
      if (
        configuration.user_attributes &&
        Object.keys(configuration.user_attributes).length
      ) {
        const attributes = { ...configuration.user_attributes }
        for (const attribute in configuration.user_attributes) {
          try {
            const { type } =
              modelDetails.model_schema.user.find((u) => u.name == attribute) ??
              {}
            if (type == "Numerical")
              attributes[attribute] = Number(
                configuration.user_attributes[attribute]
              )
            else if (type?.includes("Sequence")) {
              attributes[attribute] = configuration.user_attributes[attribute]
                .replace(/[\[\]]/g, "")
                .split(",")
                .map((part: string) => part.trim().replace(/^"|"$/g, ""))
            }
          } catch (error) {}
        }
        finalConfiguration.user_features = attributes
      }
    } else if (
      currentQueryTab == QueryTab.USER &&
      currentRankTab == UserRecommendationTab.SIMILAR_USERS
    ) {
      finalConfiguration.explain = true
      if (configuration.user_id) {
        finalConfiguration.user_id = configuration.user_id
      }
      if (configuration.filter_predicate) {
        finalConfiguration.filter_predicate = configuration.filter_predicate
      }
      finalConfiguration.config = { limit: 50 }
      delete finalConfiguration.limit
    } else if (
      currentQueryTab == QueryTab.ITEM &&
      currentRankTab == ItemRecommendationTab.SIMILAR_ITEMS &&
      !configuration.additional_item_ids?.length
    ) {
      finalConfiguration.explain = true
      if (configuration.item_id) {
        finalConfiguration.item_id = configuration.item_id
      }
      if (configuration.user_id) {
        finalConfiguration.user_id = configuration.user_id
      }
      if (configuration.filter_predicate) {
        finalConfiguration.filter_predicate = configuration.filter_predicate
      }
      delete finalConfiguration.limit
      finalConfiguration.config.limit = 50
    } else if (
      currentQueryTab == QueryTab.ITEM &&
      (currentRankTab == ItemRecommendationTab.COMPLEMENT_ITEMS ||
        configuration.additional_item_ids?.length)
    ) {
      delete finalConfiguration.limit
      finalConfiguration.config.limit = 50
      if (configuration.additional_item_ids?.length) {
        finalConfiguration.item_ids = [
          configuration.item_id,
          ...configuration.additional_item_ids,
        ]
      } else {
        finalConfiguration.item_ids = [configuration.item_id]
      }
      if (configuration.user_id) {
        finalConfiguration.user_id = configuration.user_id
      }
      if (configuration.filter_predicate) {
        finalConfiguration.filter_predicate = configuration.filter_predicate
      }
    }
  }

  const config = finalConfiguration.config
  delete finalConfiguration.config
  finalConfiguration.config = config
  return finalConfiguration
}

export const getRankApiUriFromConfig = (
  configuration: any,
  currentQueryTab: QueryTab,
  currentRankTab: UserRecommendationTab | ItemRecommendationTab,
  modelUri: string,
  queryStep: number
) => {
  if (queryStep == 2) {
    if (configuration.user_id) return `${modelUri}/rank`
    else return `${modelUri}/retrieve`
  } else {
    if (currentQueryTab == QueryTab.USER) {
      if (currentRankTab == UserRecommendationTab.RANK)
        return `${modelUri}/rank`
      else return `${modelUri}/similar_users`
    } else {
      if (configuration.additional_item_ids?.length)
        return `${modelUri}/complement_items`
      else return `${modelUri}/similar_items`
    }
  }
}

export const getRankApiMethodFromConfig = (
  configuration: any,
  currentQueryTab: QueryTab,
  currentRankTab: UserRecommendationTab | ItemRecommendationTab
) => {
  if (currentQueryTab == QueryTab.SESSION || currentQueryTab == QueryTab.USER) {
    if (currentRankTab == UserRecommendationTab.RANK) return "POST"
    else return "POST"
  } else if (currentQueryTab == QueryTab.ITEM) {
    if (configuration.additional_item_ids?.length) return "POST"
    else return "POST"
  } else {
    if (configuration.user_id) return "POST"
    else return "POST"
  }
}

export const calculateEntityInteractionFeatures = async (
  results: any[],
  modelDetails: ModelDetails,
  entityType: EntityType,
  keepDerivedFeatures: boolean = true
) => {
  const features: { name: string; type: string }[] = []
  const imageFeatures: { name: string; type: string }[] = []
  const itemFeatures = modelDetails.model_schema?.item
  const userFeatures = modelDetails.model_schema?.user
  let allFeatures = entityType == EntityType.USER ? itemFeatures : userFeatures

  allFeatures = [
    ...allFeatures.map((e) => ({
      ...e,
      name: e.name == "created_at" ? `entity.${e.name}` : e.name,
    })),
    ...modelDetails.model_schema.interaction.filter((e) =>
      entityType == EntityType.ITEM ? e.name != "user_id" : e.name != "item_id"
    ),
  ]
  allFeatures = allFeatures.filter((e) =>
    entityType == EntityType.USER ? e.name != "user_id" : e.name != "item_id"
  )

  for (const feature of allFeatures) {
    if (feature.type == "Url") {
      const nonEmptyUrlItem = results.find((r) => r[feature.name])
      const isImage = await isImageType(nonEmptyUrlItem[feature.name])
      if (nonEmptyUrlItem && isImage) {
        imageFeatures.push(feature)
      } else features.push(feature)
    } else if (feature.type == "Image") {
      imageFeatures.push(feature)
    } else {
      if (keepDerivedFeatures) features.push(feature)
      else if (!feature.name.startsWith("_derived_")) features.push(feature)
    }
  }

  return [features, imageFeatures]
}
