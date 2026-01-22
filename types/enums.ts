export enum MetricsTabEnum {
  ACTIVITY = "Activity",
  TRAINING = "Training",
  ITEM_INSIGHT = "Item Insight",
  USER_INSIGHT = "User Insight",
}

export enum EventMetricType {
  EVENT_RATE = "Event Rate",
  EVENT_COUNT = "Event Count",
}

export enum EmbeddingTabEnum {
  USER = "User",
  ITEM = "Item",
}

export enum QueryTab {
  USER = "User",
  ITEM = "Item",
  SESSION = "Session",
  TEXT = "Text",
}

export enum UserRecommendationTab {
  RANK = "Rank",
  SIMILAR_USERS = "Similar",
}

export enum ItemRecommendationTab {
  SIMILAR_ITEMS = "Similar items",
  COMPLEMENT_ITEMS = "Complement items",
}

export enum UserType {
  POWER_USER = "Power user",
  RANDOM_USER = "Random user",
  INPUT_USER = "Input user",
}

export enum MetricType {
  SUMMARY_METRIC = "Summary Metric",
  EVALUATION_METRIC = "Evaluation Metric",
}

export enum AnalyticsMetricsDuration {
  LAST_WEEK = "Last week",
  LAST_MONTH = "Last month",
  ALL_TIME = "All time",
}

export enum LiveMetricsDuration {
  LAST_WEEK = "Last week",
  LAST_MONTH = "Last month",
}

export enum EngagementMetricsDuration {
  LAST_WEEK = "Last week",
  LAST_MONTH = "Last month",
}

export enum DateType {
  YEAR = "Year",
  MONTH = "Month",
  WEEK = "Week",
  DAY = "Day",
}

export enum TrainMetricsDuration {
  LAST_RUN = "Last run",
  LAST_WEEK = "Last week",
  LAST_MONTH = "Last month",
}

export enum UserEmbeddingDuration {
  ALL_TIME = "All time",
}

export enum ItemEmbeddingDuration {
  LAST_WEEK = "Last week",
  LAST_MONTH = "Last month",
  ALL_TIME = "All time",
}

export enum ItemAnalyticsDuration {
  LAST_3_DAYS = "Last 3 days",
  LAST_WEEK = "Last week",
  LAST_MONTH = "Last month",
  LAST_3_MONTHS = "Last 3 months",
  ALL_TIME = "All time",
}

export enum MemberRole {
  OWNER = "Owner",
  ADMIN = "Admin",
  VIEWER = "Viewer",
}

export enum EventType {
  NEGATIVE_EVENTS = "Negative events",
  POSITIVE_EVENTS = "Positive events",
  ALL_EVENTS = "All events",
}

export enum EmbeddingProjectionMethod {
  PCA = "PCA",
  UMAP = "UMAP",
}

export enum MetricName {
  PRECISION = "Precision",
  ATTRIBUTED_SESSION_COUNT = "Attributed session count",
}

export enum InteractionFrequency {
  ALL = "All",
  POWER = "Power",
  COLD_START = "Cold-start",
}

export enum EventCountType {
  SESSION = "Session",
  EVENT = "Event",
}

export enum RankRequestType {
  ALL = "All",
  SEEN = "Seen",
  Unseen = "Unseen",
}

export enum EntityType {
  USER = "User",
  ITEM = "Item",
  INTERACTION = "Interaction",
}

export enum ActivityType {
  Daily = "Daily",
  Monthly = "Monthly",
}

export enum AccountType {
  TRIAL = "TRIAL",
  STANDARD = "STANDARD",
  PREMIUM = "PREMIUM",
  ADMIN = "ADMIN",
  DEMO = "DEMO",
}

export enum FileType {
  YAML = "YAML",
  YML = "YML",
  JSON = "JSON",
  CSV = "CSV",
  TSV = "TSV",
  IMAGE = "IMAGE",
  JSONL = "JSONL",
  PARQUET = "PARQUET",
}

export enum UploadFileType {
  MODEL_YAML = "Model Yaml",
  DATASET_YAML = "Dataset Yaml",
  LOCAL_DATASET = "Local Dataset",
  TRANSFORM_YAML = "Transform Yaml",
}

export enum EventDataScope {
  SHAPED = "Shaped",
  ALL = "All",
}

export enum FeatureTableType {
  EVENTS = "Events",
  USERS = "Users",
  ITEMS = "Items",
  PERSONAL_FILTERS = "Personal Filters",
  GLOBAL_FILTERS = "Global Filters",
}

export enum ModelStatus {
  SCHEDULING = "SCHEDULING",
  FETCHING = "FETCHING",
  TUNING = "TUNING",
  TRAINING = "TRAINING",
  DEPLOYING = "DEPLOYING",
  IDLE = "IDLE",
  ACTIVE = "ACTIVE",
  INACTIVE = "INACTIVE",
  ERROR = "ERROR",
  DESTROYING = "DESTROYING",
  BACKFILLING = "BACKFILLING",
}

export enum SplitType {
  ALL = "all",
  TRAIN = "train",
  TEST = "test",
  VAL = "val",
}

export enum DatasetDataType {
  STRING = "String",
  INT32 = "Int32",
  INT64 = "Int64",
  FLOAT = "Float",
  DOUBLE = "Double",
  BOOL = "Bool",
  DATETIME = "DateTime",
  ARRAY_OF_STRING = "Array(String)",
  ARRAY_OF_INTEGER = "Array(Int64)",
  ARRAY_OF_DOUBLE = "Array(Float64)",
  BYTES = "Bytes",
  JSON = "JSON",
}

export class FeatureType {
  static readonly ID = "Id"
  static readonly UNKNOWN = "Unknown"
  static readonly TIMESTAMP = "Timestamp"
  static readonly CATEGORY = "Category"
  static readonly TEXT_CATEGORY = "TextCategory"
  static readonly BINARY = "Binary"
  static readonly NUMERICAL = "Numerical"
  static readonly CATEGORY_SEQUENCE = "Sequence[Category]"
  static readonly TEXT_CATEGORY_SEQUENCE = "Sequence[TextCategory]"
  static readonly TEXT_SEQUENCE = "Sequence[Text]"
  static readonly NUMERICAL_SEQUENCE = "Sequence[Numerical]"
  static readonly BINARY_SEQUENCE = "Sequence[Binary]"
  static readonly CATEGORY_SET = "Set[Category]"
  static readonly NUMERICAL_SET = "Set[Numerical]"
  static readonly BINARY_SET = "Set[Binary]"
  static readonly TEXT_CATEGORY_SET = "Set[TextCategory]"
  static readonly TEXT_SET = "Set[Text]"
  static readonly URL = "Url"
  static readonly TEXT = "Text"
  static readonly VECTOR = "Vector"
  static readonly IMAGE = "Image"
  static readonly IMAGE_URL = "ImageUrl"
  static readonly AUDIO = "Audio"
  static readonly VIDEO = "Video"

  // Methods
  static getContainerTypes(): string[] {
    return [...this.getSequenceTypes(), ...this.getSetTypes()]
  }

  static getCategoryTypes(): string[] {
    return [this.CATEGORY, this.TEXT_CATEGORY, this.BINARY]
  }

  static getSetTypes(): string[] {
    return [
      this.CATEGORY_SET,
      this.TEXT_CATEGORY_SET,
      this.TEXT_SET,
      this.NUMERICAL_SET,
      this.BINARY_SET,
    ]
  }

  static getSequenceTypes(): string[] {
    return [
      this.CATEGORY_SEQUENCE,
      this.TEXT_CATEGORY_SEQUENCE,
      this.TEXT_SEQUENCE,
      this.NUMERICAL_SEQUENCE,
      this.BINARY_SEQUENCE,
      this.VECTOR,
    ]
  }

  static getCategoricalContainerTypes(): string[] {
    return [
      this.CATEGORY_SEQUENCE,
      this.CATEGORY_SET,
      this.TEXT_CATEGORY_SEQUENCE,
      this.TEXT_CATEGORY_SET,
      this.BINARY_SEQUENCE,
      this.BINARY_SET,
    ]
  }

  static getTextContainerTypes(): string[] {
    return [this.TEXT_SEQUENCE, this.TEXT_SET]
  }

  static getAllNumericalTypes(): string[] {
    return [...this.getNumericalContainerTypes(), this.NUMERICAL]
  }

  static getNumericalContainerTypes(): string[] {
    return [this.NUMERICAL_SEQUENCE, this.NUMERICAL_SET, this.VECTOR]
  }

  static getAllCategoricalTypes(): string[] {
    return [
      ...this.getCategoricalContainerTypes(),
      this.CATEGORY,
      this.TEXT_CATEGORY,
      this.BINARY,
    ]
  }
}
